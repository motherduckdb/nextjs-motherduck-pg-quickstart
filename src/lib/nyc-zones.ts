// NYC TLC taxi zone lookup — covers the zones that appear most often in the
// Nov 2022 `sample_data.nyc.taxi` slice (Manhattan-heavy plus JFK/LGA/EWR).
// Source: https://www1.nyc.gov/site/tlc/about/tlc-trip-record-data.page
// Values: [zone_name, borough]

type Zone = readonly [name: string, borough: string];

const ZONES: Record<number, Zone> = {
  1: ["Newark Airport", "EWR"],
  4: ["Alphabet City", "Manhattan"],
  12: ["Battery Park", "Manhattan"],
  13: ["Battery Park City", "Manhattan"],
  24: ["Bloomingdale", "Manhattan"],
  41: ["Central Harlem", "Manhattan"],
  42: ["Central Harlem North", "Manhattan"],
  43: ["Central Park", "Manhattan"],
  45: ["Chinatown", "Manhattan"],
  48: ["Clinton East", "Manhattan"],
  50: ["Clinton West", "Manhattan"],
  68: ["East Chelsea", "Manhattan"],
  74: ["East Harlem North", "Manhattan"],
  75: ["East Harlem South", "Manhattan"],
  79: ["East Village", "Manhattan"],
  87: ["Financial District North", "Manhattan"],
  88: ["Financial District South", "Manhattan"],
  90: ["Flatiron", "Manhattan"],
  100: ["Garment District", "Manhattan"],
  107: ["Gramercy", "Manhattan"],
  113: ["Greenwich Village North", "Manhattan"],
  114: ["Greenwich Village South", "Manhattan"],
  116: ["Hamilton Heights", "Manhattan"],
  120: ["Highbridge Park", "Manhattan"],
  125: ["Hudson Sq", "Manhattan"],
  127: ["Inwood", "Manhattan"],
  128: ["Inwood Hill Park", "Manhattan"],
  132: ["JFK Airport", "Queens"],
  137: ["Kips Bay", "Manhattan"],
  138: ["LaGuardia Airport", "Queens"],
  140: ["Lenox Hill East", "Manhattan"],
  141: ["Lenox Hill West", "Manhattan"],
  142: ["Lincoln Square East", "Manhattan"],
  143: ["Lincoln Square West", "Manhattan"],
  144: ["Little Italy / NoLiTa", "Manhattan"],
  148: ["Lower East Side", "Manhattan"],
  151: ["Manhattan Valley", "Manhattan"],
  152: ["Manhattanville", "Manhattan"],
  153: ["Marble Hill", "Manhattan"],
  158: ["Meatpacking / West Village West", "Manhattan"],
  161: ["Midtown Center", "Manhattan"],
  162: ["Midtown East", "Manhattan"],
  163: ["Midtown North", "Manhattan"],
  164: ["Midtown South", "Manhattan"],
  166: ["Morningside Heights", "Manhattan"],
  170: ["Murray Hill", "Manhattan"],
  186: ["Penn Station / Madison Sq West", "Manhattan"],
  194: ["Randalls Island", "Manhattan"],
  202: ["Roosevelt Island", "Manhattan"],
  209: ["Seaport", "Manhattan"],
  211: ["SoHo", "Manhattan"],
  224: ["Stuy Town / Peter Cooper Village", "Manhattan"],
  229: ["Sutton Place / Turtle Bay North", "Manhattan"],
  230: ["Times Sq / Theatre District", "Manhattan"],
  231: ["TriBeCa / Civic Center", "Manhattan"],
  232: ["Two Bridges / Seward Park", "Manhattan"],
  233: ["UN / Turtle Bay South", "Manhattan"],
  234: ["Union Sq", "Manhattan"],
  236: ["Upper East Side North", "Manhattan"],
  237: ["Upper East Side South", "Manhattan"],
  238: ["Upper West Side North", "Manhattan"],
  239: ["Upper West Side South", "Manhattan"],
  243: ["Washington Heights North", "Manhattan"],
  244: ["Washington Heights South", "Manhattan"],
  246: ["West Chelsea / Hudson Yards", "Manhattan"],
  249: ["West Village", "Manhattan"],
  261: ["World Trade Center", "Manhattan"],
  262: ["Yorkville East", "Manhattan"],
  263: ["Yorkville West", "Manhattan"],
  264: ["Unknown", "Unknown"],
  265: ["Outside of NYC", "Unknown"],
};

export function zoneName(id: number | null | undefined): string {
  if (id == null) return "Unknown";
  return ZONES[id]?.[0] ?? `Zone ${id}`;
}

export function zoneBorough(id: number | null | undefined): string {
  if (id == null) return "Unknown";
  return ZONES[id]?.[1] ?? "Other";
}

export function zoneLabel(id: number | null | undefined): string {
  if (id == null) return "Unknown";
  const z = ZONES[id];
  if (!z) return `Zone ${id}`;
  return `${z[0]}, ${z[1]}`;
}
