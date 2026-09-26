export const MAX_TRY_COUNT = 6;

export interface ExportData {
  year: number;
  total: number;
  products: [hs4: string, value: number][];
}

export async function loadExports(code: string): Promise<ExportData> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/exports/${code}.json`);
  if (!res.ok) throw new Error(`Could not load export data (${res.status})`);
  return res.json();
}

export function formatUsd(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}k`;
  return `$${value}`;
}
