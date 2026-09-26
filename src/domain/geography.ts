import type { Country } from "./countries";

const EARTH_RADIUS = 6_371_000;
const MAX_DISTANCE_ON_EARTH = 20_000_000;

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function getDistance(from: Country, to: Country): number {
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS * Math.asin(Math.sqrt(a)));
}

function getRhumbLineBearing(from: Country, to: Country): number {
  let dLon = toRad(to.lon - from.lon);
  const dPhi = Math.log(
    Math.tan(toRad(to.lat) / 2 + Math.PI / 4) / Math.tan(toRad(from.lat) / 2 + Math.PI / 4)
  );
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon > 0 ? -(2 * Math.PI - dLon) : 2 * Math.PI + dLon;
  }
  return ((Math.atan2(dLon, dPhi) * 180) / Math.PI + 360) % 360;
}

const DIRECTIONS: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function getDirection(from: Country, to: Country): Direction {
  return DIRECTIONS[Math.round(getRhumbLineBearing(from, to) / 45) % 8];
}

export const DIRECTION_ARROWS: Record<Direction, string> = {
  N: "⬆️",
  NE: "↗️",
  E: "➡️",
  SE: "↘️",
  S: "⬇️",
  SW: "↙️",
  W: "⬅️",
  NW: "↖️",
};

export function computeProximityPercent(distance: number): number {
  const proximity = Math.max(MAX_DISTANCE_ON_EARTH - distance, 0);
  const rounded = Math.round((proximity / MAX_DISTANCE_ON_EARTH) * 100);
  return distance > 0 && rounded >= 100 ? 99 : rounded;
}

export function generateSquares(proximity: number, theme: "light" | "dark"): string {
  const green = Math.floor(proximity / 20);
  const yellow = proximity - green * 20 >= 10 ? 1 : 0;
  const empty = theme === "light" ? "⬜" : "⬛";
  return "🟩".repeat(green) + "🟨".repeat(yellow) + empty.repeat(5 - green - yellow);
}

export function formatDistance(meters: number, unit: "km" | "miles"): string {
  const km = meters / 1000;
  return unit === "km"
    ? `${Math.round(km).toLocaleString("en-US")} km`
    : `${Math.round(km * 0.621371).toLocaleString("en-US")} mi`;
}
