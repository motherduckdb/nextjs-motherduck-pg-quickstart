import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/motherduck";

export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DashboardPayload = {
  kpis: {
    trips: number;
    revenue: number;
    avg_fare: number;
    avg_tip_pct: number;
    avg_distance: number;
    passengers: number;
  };
  by_day: Array<{ day: string; trips: number; revenue: number }>;
  by_hour: Array<{ hour: number; trips: number }>;
  by_payment: Array<{ payment_type: number; trips: number; revenue: number }>;
  payment_to_rate: Array<{
    payment_type: number;
    rate_code: number;
    trips: number;
  }>;
  top_zones: Array<{ zone_id: number; trips: number; revenue: number }>;
};

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!start || !end || !DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
    return NextResponse.json(
      { error: "start and end are required in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  // `end` is inclusive in the UI; query `< end + 1 day`.
  const endExclusive = new Date(`${end}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const endParam = endExclusive.toISOString().slice(0, 10);
  const params = [start, endParam];

  try {
    // Six independent queries, each on its own pooled client.
    const [kpis, byDay, byHour, byPayment, paymentToRate, topZones] =
      await Promise.all([
        query<{
          trips: string;
          revenue: number;
          avg_fare: number;
          avg_tip_pct: number;
          avg_distance: number;
          passengers: string;
        }>(
          `SELECT
             COUNT(*)::BIGINT AS trips,
             COALESCE(SUM(total_amount), 0)::DOUBLE AS revenue,
             COALESCE(AVG(fare_amount), 0)::DOUBLE AS avg_fare,
             COALESCE(AVG(CASE WHEN fare_amount > 0 THEN tip_amount / fare_amount END) * 100, 0)::DOUBLE AS avg_tip_pct,
             COALESCE(AVG(trip_distance), 0)::DOUBLE AS avg_distance,
             COALESCE(SUM(passenger_count), 0)::BIGINT AS passengers
           FROM nyc.taxi
           WHERE tpep_pickup_datetime >= $1 AND tpep_pickup_datetime < $2`,
          params
        ),
        query<{ day: string; trips: string; revenue: number }>(
          `SELECT
             DATE_TRUNC('day', tpep_pickup_datetime)::DATE::TEXT AS day,
             COUNT(*)::BIGINT AS trips,
             COALESCE(SUM(total_amount), 0)::DOUBLE AS revenue
           FROM nyc.taxi
           WHERE tpep_pickup_datetime >= $1 AND tpep_pickup_datetime < $2
           GROUP BY 1 ORDER BY 1`,
          params
        ),
        query<{ hour: number; trips: string }>(
          `SELECT
             EXTRACT(HOUR FROM tpep_pickup_datetime)::INT AS hour,
             COUNT(*)::BIGINT AS trips
           FROM nyc.taxi
           WHERE tpep_pickup_datetime >= $1 AND tpep_pickup_datetime < $2
           GROUP BY 1 ORDER BY 1`,
          params
        ),
        query<{ payment_type: number; trips: string; revenue: number }>(
          `SELECT
             payment_type::INT AS payment_type,
             COUNT(*)::BIGINT AS trips,
             COALESCE(SUM(total_amount), 0)::DOUBLE AS revenue
           FROM nyc.taxi
           WHERE tpep_pickup_datetime >= $1 AND tpep_pickup_datetime < $2
             AND payment_type IS NOT NULL
           GROUP BY 1 ORDER BY 2 DESC`,
          params
        ),
        query<{ payment_type: number; rate_code: number; trips: string }>(
          `SELECT
             payment_type::INT AS payment_type,
             RatecodeID::INT AS rate_code,
             COUNT(*)::BIGINT AS trips
           FROM nyc.taxi
           WHERE tpep_pickup_datetime >= $1 AND tpep_pickup_datetime < $2
             AND payment_type IS NOT NULL AND RatecodeID IS NOT NULL
           GROUP BY 1, 2
           HAVING COUNT(*) > 100
           ORDER BY 3 DESC`,
          params
        ),
        query<{ zone_id: number; trips: string; revenue: number }>(
          `SELECT
             PULocationID::INT AS zone_id,
             COUNT(*)::BIGINT AS trips,
             COALESCE(SUM(total_amount), 0)::DOUBLE AS revenue
           FROM nyc.taxi
           WHERE tpep_pickup_datetime >= $1 AND tpep_pickup_datetime < $2
             AND PULocationID IS NOT NULL
           GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
          params
        ),
      ]);

    const k = kpis.rows[0];
    const payload: DashboardPayload = {
      kpis: {
        trips: Number(k.trips),
        revenue: Number(k.revenue),
        avg_fare: Number(k.avg_fare),
        avg_tip_pct: Number(k.avg_tip_pct),
        avg_distance: Number(k.avg_distance),
        passengers: Number(k.passengers),
      },
      by_day: byDay.rows.map((r) => ({
        day: r.day,
        trips: Number(r.trips),
        revenue: Number(r.revenue),
      })),
      by_hour: byHour.rows.map((r) => ({
        hour: Number(r.hour),
        trips: Number(r.trips),
      })),
      by_payment: byPayment.rows.map((r) => ({
        payment_type: Number(r.payment_type),
        trips: Number(r.trips),
        revenue: Number(r.revenue),
      })),
      payment_to_rate: paymentToRate.rows.map((r) => ({
        payment_type: Number(r.payment_type),
        rate_code: Number(r.rate_code),
        trips: Number(r.trips),
      })),
      top_zones: topZones.rows.map((r) => ({
        zone_id: Number(r.zone_id),
        trips: Number(r.trips),
        revenue: Number(r.revenue),
      })),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to build dashboard payload:", error);
    return NextResponse.json(
      { error: "Failed to build dashboard payload" },
      { status: 500 }
    );
  }
}
