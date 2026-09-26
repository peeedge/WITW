import { MAX_TRY_COUNT } from "./game";
import { loadAllGuesses } from "./storage";

export interface Stats {
  played: number;
  winRatio: number;
  currentStreak: number;
  maxStreak: number;
  distribution: Record<number, number>;
}

const isWon = (guesses: { distance: number }[]) => guesses.at(-1)?.distance === 0;
const isFinished = (guesses: { distance: number }[]) =>
  isWon(guesses) || guesses.length >= MAX_TRY_COUNT;

export function getStats(): Stats {
  const all = loadAllGuesses();
  const days = Object.keys(all)
    .filter((d) => isFinished(all[d]))
    .sort();

  const distribution: Record<number, number> = {};
  for (let i = 1; i <= MAX_TRY_COUNT; i++) distribution[i] = 0;

  let wins = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let previous: number | null = null;

  for (const day of days) {
    const guesses = all[day];
    const time = Date.parse(`${day}T00:00:00Z`);
    const consecutive = previous !== null && time - previous === 86_400_000;
    if (isWon(guesses)) {
      wins++;
      distribution[guesses.length]++;
      currentStreak = consecutive ? currentStreak + 1 : 1;
    } else {
      currentStreak = 0;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    previous = time;
  }

  const lastDay = days.at(-1);
  if (lastDay) {
    const sinceLast = Date.now() - Date.parse(`${lastDay}T00:00:00Z`);
    if (sinceLast > 2 * 86_400_000) currentStreak = 0;
  }

  return {
    played: days.length,
    winRatio: days.length ? wins / days.length : 0,
    currentStreak,
    maxStreak,
    distribution,
  };
}
