import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flag, getCountryByName } from "../domain/countries";
import { getCountryForDay, getPuzzleNumber, msUntilNextPuzzle, todayString } from "../domain/daily";
import { formatUsd, loadExports, MAX_TRY_COUNT, type ExportData } from "../domain/game";
import {
  computeProximityPercent,
  DIRECTION_ARROWS,
  generateSquares,
  getDirection,
  getDistance,
} from "../domain/geography";
import { loadAllGuesses, saveGuesses, type Guess, type Settings } from "../domain/storage";
import { CountryInput } from "./CountryInput";
import { Guesses } from "./Guesses";
import { Treemap } from "./Treemap";

interface Props {
  dayString: string;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  toast: (message: string, sticky?: boolean) => void;
}

export function Game({ dayString, settings, onSettingsChange, toast }: Props) {
  const country = useMemo(() => getCountryForDay(dayString), [dayString]);
  const puzzleNumber = getPuzzleNumber(dayString);
  const isHistorical = dayString !== todayString();

  const [data, setData] = useState<ExportData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>(() => loadAllGuesses()[dayString] ?? []);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadExports(country.code)
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
    };
  }, [country.code]);

  const won = guesses.at(-1)?.distance === 0;
  const ended = won || guesses.length >= MAX_TRY_COUNT;
  const guessedCodes = useMemo(() => new Set(guesses.map((g) => g.code)), [guesses]);

  const submit = useCallback(
    (name: string) => {
      if (ended) return;
      const guessed = getCountryByName(name);
      if (!guessed) {
        toast("Unknown country");
        return;
      }
      if (guessedCodes.has(guessed.code)) {
        toast("Already guessed");
        return;
      }
      const guess: Guess = {
        code: guessed.code,
        name: guessed.name,
        distance: guessed.code === country.code ? 0 : Math.max(1, getDistance(guessed, country)),
        direction: getDirection(guessed, country),
      };
      const next = [...guesses, guess];
      setGuesses(next);
      saveGuesses(dayString, next);
      setInput("");
      if (guess.distance === 0) {
        toast(["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"][next.length - 1]);
      } else if (next.length >= MAX_TRY_COUNT) {
        toast(country.name.toUpperCase(), true);
      }
    },
    [ended, guessedCodes, guesses, country, dayString, toast]
  );

  const share = useCallback(async () => {
    const lines = guesses.map((g) =>
      g.distance === 0
        ? "🟩🟩🟩🟩🟩🎉"
        : generateSquares(computeProximityPercent(g.distance), settings.theme) +
          DIRECTION_ARROWS[g.direction]
    );
    const url = window.location.origin + window.location.pathname;
    const text = [
      `#Tradle #${puzzleNumber} ${won ? guesses.length : "X"}/${MAX_TRY_COUNT}`,
      ...lines,
      url,
    ].join("\n");
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast("Copied results to clipboard");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }, [guesses, puzzleNumber, won, settings.theme, toast]);

  const toggleUnit = useCallback(
    () =>
      onSettingsChange({
        ...settings,
        distanceUnit: settings.distanceUnit === "km" ? "miles" : "km",
      }),
    [settings, onSettingsChange]
  );

  return (
    <main className="game">
      {isHistorical && (
        <div className="notice">
          You're playing a past puzzle from {dayString}.{" "}
          <a href={import.meta.env.BASE_URL}>Play today's</a>
        </div>
      )}
      <h2 className="prompt">Guess which country exports these products!</h2>
      <div className="treemap-frame">
        {data ? (
          <Treemap data={data} />
        ) : (
          <div className="treemap-placeholder">{loadError ?? "Loading exports…"}</div>
        )}
      </div>
      {data && (
        <p className="total">
          Total exports ({data.year}): <strong>{formatUsd(data.total)}</strong>
        </p>
      )}

      <Guesses guesses={guesses} settings={settings} onToggleUnit={toggleUnit} />

      {ended ? (
        <EndOfGame
          won={won}
          answer={`${flag(country.code)} ${country.name}`}
          iso3={country.iso3}
          lat={country.lat}
          lon={country.lon}
          onShare={share}
          isHistorical={isHistorical}
          dayString={dayString}
        />
      ) : (
        <form
          className="guess-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <CountryInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={submit}
            excluded={guessedCodes}
          />
          <button type="submit" className="primary">
            🌍 Guess
          </button>
        </form>
      )}
    </main>
  );
}

interface EndProps {
  won: boolean;
  answer: string;
  iso3: string | null;
  lat: number;
  lon: number;
  onShare: () => void;
  isHistorical: boolean;
  dayString: string;
}

function EndOfGame({ won, answer, iso3, lat, lon, onShare, isHistorical, dayString }: EndProps) {
  const previousDay = new Date(Date.parse(`${dayString}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);
  return (
    <section className="end">
      <p className="answer">
        {won ? "You got it! " : "The answer was "}
        <strong>{answer}</strong>
      </p>
      <button className="primary share" onClick={onShare}>
        Share
      </button>
      {!isHistorical && <Countdown />}
      <div className="links">
        {iso3 && (
          <a
            href={`https://oec.world/en/profile/country/${iso3.toLowerCase()}`}
            target="_blank"
            rel="noreferrer"
          >
            Country profile on OEC ↗
          </a>
        )}
        <a
          href={`https://www.google.com/maps?q=${lat},${lon}&z=5`}
          target="_blank"
          rel="noreferrer"
        >
          Show on Google Maps ↗
        </a>
        {getPuzzleNumber(previousDay) >= 1 && (
          <a href={`${import.meta.env.BASE_URL}?date=${previousDay}`}>Play the previous day's puzzle</a>
        )}
      </div>
    </section>
  );
}

function Countdown() {
  const [ms, setMs] = useState(msUntilNextPuzzle);
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextPuzzle()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <p className="countdown">
      Next puzzle in{" "}
      <strong>
        {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
      </strong>
    </p>
  );
}
