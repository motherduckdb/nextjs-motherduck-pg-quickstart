import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatCompact(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return compact.format(n);
}

export function formatCurrency(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return currency.format(n);
}

export function formatCurrencyCompact(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return currencyCompact.format(n);
}

export function formatPercent(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return percent.format(n / 100);
}

export function formatNumber(n: number | null | undefined, digits = 0) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
