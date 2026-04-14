// NYC TLC payment type codes (yellow taxi data dictionary)
export const PAYMENT_TYPES: Record<number, string> = {
  0: "Uncoded",
  1: "Credit card",
  2: "Cash",
  3: "No charge",
  4: "Dispute",
  5: "Unknown",
  6: "Voided",
};

// NYC TLC RatecodeID values
export const RATE_CODES: Record<number, string> = {
  1: "Standard",
  2: "JFK flat",
  3: "Newark",
  4: "Nassau/Westchester",
  5: "Negotiated",
  6: "Group ride",
  99: "Unknown",
};

export function paymentLabel(id: number | null | undefined): string {
  if (id == null) return "Unknown";
  return PAYMENT_TYPES[id] ?? `Type ${id}`;
}

export function rateLabel(id: number | null | undefined): string {
  if (id == null) return "Unknown";
  return RATE_CODES[id] ?? `Code ${id}`;
}
