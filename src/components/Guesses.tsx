import { flag } from "../domain/countries";
import { MAX_TRY_COUNT } from "../domain/game";
import { computeProximityPercent, DIRECTION_ARROWS, formatDistance } from "../domain/geography";
import type { Guess, Settings } from "../domain/storage";

interface Props {
  guesses: Guess[];
  settings: Settings;
  onToggleUnit: () => void;
}

export function Guesses({ guesses, settings, onToggleUnit }: Props) {
  return (
    <div className="guesses">
      {Array.from({ length: MAX_TRY_COUNT }, (_, i) => {
        const guess = guesses[i];
        if (!guess) {
          return (
            <div key={i} className="guess-row empty">
              <div className="cell name" />
              <div className="cell" />
              <div className="cell" />
              <div className="cell" />
            </div>
          );
        }
        const won = guess.distance === 0;
        return (
          <div key={i} className={`guess-row filled${won ? " won" : ""}`}>
            <div className="cell name" title={guess.name}>
              <span className="flag">{flag(guess.code)}</span> {guess.name}
            </div>
            <button className="cell distance" onClick={onToggleUnit} title="Toggle km / miles">
              {formatDistance(guess.distance, settings.distanceUnit)}
            </button>
            <div className="cell direction">{won ? "🎉" : DIRECTION_ARROWS[guess.direction]}</div>
            <div className="cell proximity">{computeProximityPercent(guess.distance)}%</div>
          </div>
        );
      })}
    </div>
  );
}
