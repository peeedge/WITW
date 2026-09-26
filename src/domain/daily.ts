import { targetCountries, type Country } from "./countries";

const EPOCH = Date.UTC(2022, 5, 14);
const DAY_MS = 86_400_000;

function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayString(): string {
  return toDayString(new Date());
}

export function getDayString(): string {
  const param = new URLSearchParams(window.location.search).get("date");
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const parsed = new Date(`${param}T00:00:00Z`);
    if (!isNaN(parsed.getTime()) && parsed.getTime() >= EPOCH) return toDayString(parsed);
  }
  return todayString();
}

export function getPuzzleNumber(dayString: string): number {
  return Math.round((Date.parse(`${dayString}T00:00:00Z`) - EPOCH) / DAY_MS) + 1;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cycleCache = new Map<number, Country[]>();

function getCycle(cycle: number): Country[] {
  let order = cycleCache.get(cycle);
  if (!order) {
    const rand = mulberry32(0x7ad1e + cycle * 7919);
    order = [...targetCountries];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    cycleCache.set(cycle, order);
  }
  return order;
}

/** Every playable country appears exactly once per cycle, in a fixed pseudo-random order. */
export function getCountryForDay(dayString: string): Country {
  const index = getPuzzleNumber(dayString) - 1;
  const n = targetCountries.length;
  return getCycle(Math.floor(index / n))[index % n];
}

export function msUntilNextPuzzle(): number {
  const now = Date.now();
  return DAY_MS - (now % DAY_MS);
}
