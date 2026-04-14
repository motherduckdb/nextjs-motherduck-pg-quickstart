"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import useSWR from "swr";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, DollarSign, MapPin, Percent, Route, Users } from "lucide-react";

import type { DashboardPayload } from "@/app/api/dashboard/route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { paymentLabel, rateLabel } from "@/lib/taxi-dict";
import { zoneName, zoneBorough } from "@/lib/nyc-zones";
import {
  cn,
  formatCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

type Bounds = { min: Date; max: Date };

/* ------------------------------ density helpers ------------------------------ */
const CARD = "gap-2 py-3";
const CARD_HEAD = "px-4 [&]:gap-0.5";
const CARD_TITLE = "text-sm";
const CARD_DESC = "text-[11px] leading-tight";
const CARD_BODY = "px-4";
const CHART_INIT = { width: 1, height: 1 };

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as DashboardPayload;
};

export function Dashboard({ bounds }: { bounds: Bounds }) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: bounds.min,
    to: bounds.max,
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const drillRef = useRef<HTMLDivElement | null>(null);

  const rangeKey =
    range?.from && range?.to
      ? `/api/dashboard?start=${format(range.from, "yyyy-MM-dd")}&end=${format(range.to, "yyyy-MM-dd")}`
      : null;
  const { data, error, isLoading: loading } = useSWR<DashboardPayload>(rangeKey, fetcher);

  const dayKey = selectedDay
    ? `/api/dashboard?start=${selectedDay}&end=${selectedDay}`
    : null;
  const { data: dayData, isLoading: dayLoading } = useSWR<DashboardPayload>(dayKey, fetcher);

  const sankey = useSankey(data?.payment_to_rate ?? []);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">NYC Taxi Analytics</h1>
          <p className="text-muted-foreground text-xs">
            Live from <code className="font-mono text-[11px]">sample_data.nyc.taxi</code> via the
            MotherDuck Postgres endpoint.
          </p>
        </div>
        <DateRangePicker
          value={range}
          onChange={setRange}
          minDate={bounds.min}
          maxDate={bounds.max}
        />
      </header>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 text-destructive-foreground">
          <CardContent className="text-destructive text-sm">{error.message}</CardContent>
        </Card>
      )}

      {/* KPIs — single compact strip */}
      <section className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Kpi label="Trips" value={formatCompact(data?.kpis.trips)} icon={Activity} loading={loading} />
        <Kpi label="Revenue" value={formatCurrencyCompact(data?.kpis.revenue)} icon={DollarSign} loading={loading} />
        <Kpi label="Passengers" value={formatCompact(data?.kpis.passengers)} icon={Users} loading={loading} />
        <Kpi label="Avg fare" value={formatCurrency(data?.kpis.avg_fare)} icon={DollarSign} loading={loading} />
        <Kpi label="Avg tip" value={formatPercent(data?.kpis.avg_tip_pct)} icon={Percent} loading={loading} />
        <Kpi label="Avg dist." value={data ? `${data.kpis.avg_distance.toFixed(1)}mi` : "—"} icon={Route} loading={loading} />
      </section>

      {/* Bento row 1: trips/day (2/3) + top zones (1/3) */}
      <section className="grid gap-3 lg:grid-cols-3">
        <Card className={cn(CARD, "lg:col-span-2")}>
          <CardHeader className={CARD_HEAD}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className={CARD_TITLE}>Trips per day</CardTitle>
                <CardDescription className={CARD_DESC}>Click a point to drill into that day.</CardDescription>
              </div>
              {selectedDay && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedDay(null)}>
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className={cn(CARD_BODY, "h-[180px] ")}>
            {loading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" initialDimension={CHART_INIT}>
                <LineChart
                  data={data.by_day}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  onClick={(s) => {
                    const label = (s as { activeLabel?: string } | null)?.activeLabel;
                    if (label) {
                      setSelectedDay(label);
                      requestAnimationFrame(() =>
                        drillRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                      );
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(v) => format(parseISO(v), "MM/dd")}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted-foreground)"
                    minTickGap={16}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v) => formatCompact(v)}
                    width={36}
                  />
                  <Tooltip
                    content={<ChartTooltip format={(k, v) =>
                      k === "trips" ? formatNumber(v) : formatCurrency(v)
                    } labelFormat={(v) => format(parseISO(String(v)), "EEE, MMM d")} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="var(--color-chart-1)"
                    strokeWidth={1.75}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className={CARD}>
          <CardHeader className={CARD_HEAD}>
            <CardTitle className={CARD_TITLE}>Top pickup zones</CardTitle>
            <CardDescription className={CARD_DESC}>Busiest neighborhoods by volume.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_BODY, "pt-0")}>
            {loading || !data ? (
              <Skeleton className="h-[180px] w-full" />
            ) : (
              <ol className="flex flex-col">
                {data.top_zones.slice(0, 6).map((z, i) => {
                  const max = data.top_zones[0].trips;
                  return (
                    <li key={z.zone_id} className="flex items-center gap-2 py-1">
                      <span className="text-muted-foreground w-4 text-right text-[10px] tabular-nums">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{zoneName(z.zone_id)}</div>
                        <div className="text-muted-foreground truncate text-[10px]">{zoneBorough(z.zone_id)}</div>
                      </div>
                      <div className="flex w-24 items-center gap-2">
                        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${(z.trips / max) * 100}%`,
                              background: "var(--color-chart-5)",
                            }}
                          />
                        </div>
                        <span className="w-9 text-right text-[10px] tabular-nums">{formatCompact(z.trips)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Drill-down panel — appears inline right under the trend */}
      {selectedDay && (
        <section
          ref={drillRef}
          className="border-primary/40 bg-accent/30 flex flex-col gap-3 rounded-xl border border-dashed p-3 sm:p-4"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Drill-down</div>
              <h2 className="text-base font-semibold">
                {format(parseISO(selectedDay), "EEEE, MMMM d, yyyy")}
              </h2>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedDay(null)}>
              Close
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Kpi label="Trips" value={formatCompact(dayData?.kpis.trips)} icon={Activity} loading={dayLoading} />
            <Kpi label="Revenue" value={formatCurrencyCompact(dayData?.kpis.revenue)} icon={DollarSign} loading={dayLoading} />
            <Kpi label="Passengers" value={formatCompact(dayData?.kpis.passengers)} icon={Users} loading={dayLoading} />
            <Kpi label="Avg fare" value={formatCurrency(dayData?.kpis.avg_fare)} icon={DollarSign} loading={dayLoading} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className={CARD}>
              <CardHeader className={CARD_HEAD}>
                <CardTitle className={CARD_TITLE}>Hourly volume</CardTitle>
                <CardDescription className={CARD_DESC}>Pickups by hour on this day.</CardDescription>
              </CardHeader>
              <CardContent className={cn(CARD_BODY, "h-[150px] ")}>
                {dayLoading || !dayData ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" initialDimension={CHART_INIT}>
                    <BarChart data={dayData.by_hour} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hour" interval={3} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" minTickGap={4} />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" tickFormatter={(v) => formatCompact(v)} width={32} />
                      <Tooltip content={<ChartTooltip format={(_, v) => formatNumber(v)} labelFormat={(v) => `${v}:00`} />} />
                      <Bar dataKey="trips" fill="var(--color-chart-6)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className={CARD}>
              <CardHeader className={CARD_HEAD}>
                <CardTitle className={CARD_TITLE}>Top pickup zones (day)</CardTitle>
                <CardDescription className={CARD_DESC}>Where most rides started.</CardDescription>
              </CardHeader>
              <CardContent className={cn(CARD_BODY, "pt-0")}>
                {dayLoading || !dayData ? (
                  <Skeleton className="h-[150px] w-full" />
                ) : (
                  <ol className="flex flex-col">
                    {dayData.top_zones.slice(0, 5).map((z, i) => (
                      <li key={z.zone_id} className="flex items-center justify-between gap-2 py-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-muted-foreground w-4 text-right text-[10px] tabular-nums">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-medium">{zoneName(z.zone_id)}</div>
                            <div className="text-muted-foreground truncate text-[10px]">{zoneBorough(z.zone_id)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-[10px]">
                          <span className="tabular-nums">{formatNumber(z.trips)}</span>
                          <span className="text-muted-foreground tabular-nums">{formatCurrencyCompact(z.revenue)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Bento row 2: hour + payment + sankey */}
      <section className="grid gap-3 lg:grid-cols-3">
        <Card className={CARD}>
          <CardHeader className={CARD_HEAD}>
            <CardTitle className={CARD_TITLE}>Pickups by hour</CardTitle>
            <CardDescription className={CARD_DESC}>All days in range, aggregated.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_BODY, "h-[170px] ")}>
            {loading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" initialDimension={CHART_INIT}>
                <BarChart data={data.by_hour} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" interval={3} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" minTickGap={4} />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" tickFormatter={(v) => formatCompact(v)} width={32} />
                  <Tooltip content={<ChartTooltip format={(_, v) => formatNumber(v)} labelFormat={(v) => `${v}:00 – ${Number(v) + 1}:00`} />} />
                  <Bar dataKey="trips" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className={CARD}>
          <CardHeader className={CARD_HEAD}>
            <CardTitle className={CARD_TITLE}>Revenue by payment</CardTitle>
            <CardDescription className={CARD_DESC}>Total fare dollars, grouped.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_BODY, "h-[170px] ")}>
            {loading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" initialDimension={CHART_INIT}>
                <BarChart
                  layout="vertical"
                  data={data.by_payment.map((r) => ({ ...r, label: paymentLabel(r.payment_type) }))}
                  margin={{ top: 2, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                  <YAxis type="category" dataKey="label" width={72} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip content={<ChartTooltip format={(_, v) => formatCurrency(v)} />} />
                  <Bar dataKey="revenue" fill="var(--color-chart-3)" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className={CARD}>
          <CardHeader className={CARD_HEAD}>
            <CardTitle className={CARD_TITLE}>Payment → rate code</CardTitle>
            <CardDescription className={CARD_DESC}>Trip flow from method to fare type.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_BODY, "h-[170px] ")}>
            {loading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : sankey ? (
              <ResponsiveContainer width="100%" height="100%" initialDimension={CHART_INIT}>
                <Sankey
                  data={sankey}
                  node={<SankeyNode />}
                  nodePadding={10}
                  link={{ stroke: "var(--color-chart-4)", strokeOpacity: 0.35 }}
                  margin={{ top: 4, right: 60, bottom: 4, left: 0 }}
                >
                  <Tooltip content={<SankeyTooltip />} />
                </Sankey>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                No data for this range.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <footer className="text-muted-foreground flex items-center gap-2 text-[10px]">
        <MapPin className="size-3" />
        Data: NYC TLC via MotherDuck&apos;s public <code className="font-mono">sample_data</code> share.
      </footer>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function Kpi({
  label,
  value,
  icon: Icon,
  loading,
  className,
}: {
  label: string;
  value: string;
  icon?: typeof Activity;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("gap-1 py-2.5", className)}>
      <CardContent className="flex flex-col gap-1 px-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            {label}
          </span>
          {Icon && <Icon className="text-muted-foreground size-3" />}
        </div>
        {loading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <div className="text-base font-semibold tabular-nums leading-none">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

type SankeyData = {
  nodes: Array<{ name: string }>;
  links: Array<{ source: number; target: number; value: number }>;
};

function useSankey(rows: DashboardPayload["payment_to_rate"]): SankeyData | null {
  return useMemo(() => {
    if (!rows.length) return null;
    const paymentIdx = new Map<number, number>();
    const rateIdx = new Map<number, number>();
    const nodes: SankeyData["nodes"] = [];
    for (const r of rows) {
      if (!paymentIdx.has(r.payment_type)) {
        paymentIdx.set(r.payment_type, nodes.length);
        nodes.push({ name: paymentLabel(r.payment_type) });
      }
    }
    for (const r of rows) {
      if (!rateIdx.has(r.rate_code)) {
        rateIdx.set(r.rate_code, nodes.length);
        nodes.push({ name: rateLabel(r.rate_code) });
      }
    }
    const links = rows.map((r) => ({
      source: paymentIdx.get(r.payment_type)!,
      target: rateIdx.get(r.rate_code)!,
      value: r.trips,
    }));
    return { nodes, links };
  }, [rows]);
}

function SankeyNode(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name: string; value: number };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="var(--color-chart-1)" rx={2} />
      <text
        x={x + width + 4}
        y={y + height / 2}
        dy={3}
        fontSize={9}
        fill="var(--color-foreground)"
      >
        {payload?.name}
      </text>
    </g>
  );
}

function SankeyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      source?: { name: string };
      target?: { name: string };
      name?: string;
      value: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const title = p.source && p.target ? `${p.source.name} → ${p.target.name}` : p.name ?? "";
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-[11px] shadow-md">
      <div className="font-medium">{title}</div>
      <div className="text-muted-foreground tabular-nums">{formatNumber(p.value)} trips</div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey: string }>;
  label?: string | number;
  format: (key: string, value: number) => string;
  labelFormat?: (label: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-[11px] shadow-md">
      {label !== undefined && (
        <div className="mb-0.5 font-medium">
          {labelFormat ? labelFormat(label) : String(label)}
        </div>
      )}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.dataKey}</span>
          <span className="tabular-nums">{format(p.dataKey, p.value)}</span>
        </div>
      ))}
    </div>
  );
}
