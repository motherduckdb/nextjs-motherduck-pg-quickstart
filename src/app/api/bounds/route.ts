import { NextResponse } from "next/server";
import { query } from "@/lib/motherduck";

/**
 * Returns the usable date range for the dashboard — defined as the range of
 * days that contain non-trivial trip volume (>= 1,000 rides). The
 * `sample_data.nyc.taxi` share has a handful of outlier rows sprinkled across
 * other years, which we don't want the date picker to expose.
 */
export async function GET() {
  try {
    const res = await query<{ min_day: string; max_day: string }>(
      `WITH daily AS (
         SELECT DATE_TRUNC('day', tpep_pickup_datetime)::DATE AS day
         FROM nyc.taxi
         WHERE tpep_pickup_datetime IS NOT NULL
         GROUP BY 1
         HAVING COUNT(*) >= 1000
       )
       SELECT MIN(day)::TEXT AS min_day, MAX(day)::TEXT AS max_day
       FROM daily`
    );

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Failed to fetch bounds:", error);
    return NextResponse.json(
      { error: "Failed to fetch date bounds" },
      { status: 500 }
    );
  }
}
