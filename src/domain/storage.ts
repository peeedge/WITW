import type { Direction } from "./geography";

export interface Guess {
  code: string;
  name: string;
  distance: number;
  direction: Direction;
}

export interface Settings {
  theme: "light" | "dark";
  distanceUnit: "km" | "miles";
}

const GUESSES_KEY = "tradle-guesses";
const SETTINGS_KEY = "tradle-settings";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadAllGuesses(): Record<string, Guess[]> {
  return read(GUESSES_KEY, {});
}

export function saveGuesses(dayString: string, guesses: Guess[]): void {
  localStorage.setItem(GUESSES_KEY, JSON.stringify({ ...loadAllGuesses(), [dayString]: guesses }));
}

export function loadSettings(): Settings {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return { theme: prefersDark ? "dark" : "light", distanceUnit: "km", ...read(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
