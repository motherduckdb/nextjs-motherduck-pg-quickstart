import { Dashboard } from "@/components/dashboard";
import { query } from "@/lib/motherduck";

export const dynamic = "force-dynamic";

async function fetchBounds() {
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
  const row = res.rows[0];
  return {
    min: new Date(`${row.min_day}T00:00:00Z`),
    max: new Date(`${row.max_day}T00:00:00Z`),
  };
}

export default async function Home() {
  const bounds = await fetchBounds();
  return (
    <main className="container mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      <Dashboard bounds={bounds} />
    </main>
  );
}
