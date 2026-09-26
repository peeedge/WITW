import { useMemo } from "react";
import { MAX_TRY_COUNT } from "../domain/game";
import { sections } from "../domain/sections";
import { getStats } from "../domain/stats";
import type { Settings } from "../domain/storage";
import { Panel } from "./Panel";

interface PanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: PanelProps) {
  return (
    <Panel title="How to play" open={open} onClose={onClose}>
      <p>
        Guess the country from its exports in {MAX_TRY_COUNT} tries. The treemap shows what the
        mystery country sold to the world, with each rectangle sized by its share of total exports.
      </p>
      <p>
        After each guess you'll see how far your guess is from the answer, which direction to go,
        and a proximity score.
      </p>
      <div className="example">
        <div className="guess-row filled">
          <div className="cell name">🇨🇱 Chile</div>
          <div className="cell">11,503 km</div>
          <div className="cell">↗️</div>
          <div className="cell">42%</div>
        </div>
        <p>Your guess is 11,503 km from the mystery country, which lies to the northeast.</p>
        <div className="guess-row filled won">
          <div className="cell name">🇫🇷 France</div>
          <div className="cell">0 km</div>
          <div className="cell">🎉</div>
          <div className="cell">100%</div>
        </div>
        <p>Right on! A new puzzle comes out every day at midnight UTC.</p>
      </div>
      <p>Hover over or tap a rectangle to see the product name, HS code, and value.</p>
      <h3>Colors</h3>
      <ul className="legend">
        {sections.map((s) => (
          <li key={s.id}>
            <span className="swatch" style={{ background: s.color }} /> {s.name}
          </li>
        ))}
      </ul>
      <p className="fine-print">
        Trade data: HS92 4-digit exports from the{" "}
        <a href="https://atlas.hks.harvard.edu/" target="_blank" rel="noreferrer">
          Harvard Growth Lab's Atlas of Economic Complexity
        </a>
        . Inspired by the original{" "}
        <a href="https://oec.world/en/games/tradle" target="_blank" rel="noreferrer">
          Tradle
        </a>{" "}
        from the OEC and{" "}
        <a href="https://worldle.teuteuf.fr" target="_blank" rel="noreferrer">
          Worldle
        </a>
        . No ads, no tracking.
      </p>
    </Panel>
  );
}

export function StatsPanel({ open, onClose }: PanelProps) {
  const stats = useMemo(() => (open ? getStats() : null), [open]);
  if (!stats) return null;
  const maxCount = Math.max(1, ...Object.values(stats.distribution));
  return (
    <Panel title="Statistics" open={open} onClose={onClose}>
      <div className="stats-grid">
        <Stat label="Played" value={stats.played} />
        <Stat label="Win %" value={Math.round(stats.winRatio * 100)} />
        <Stat label="Current streak" value={stats.currentStreak} />
        <Stat label="Max streak" value={stats.maxStreak} />
      </div>
      <h3>Guess distribution</h3>
      <div className="distribution">
        {Object.entries(stats.distribution).map(([tries, count]) => (
          <div key={tries} className="dist-row">
            <span>{tries}</span>
            <div className="dist-bar" style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }}>
              {count}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

interface SettingsPanelProps extends PanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsPanel({ open, onClose, settings, onChange }: SettingsPanelProps) {
  return (
    <Panel title="Settings" open={open} onClose={onClose}>
      <label className="setting">
        <span>Theme</span>
        <select
          value={settings.theme}
          onChange={(e) => onChange({ ...settings, theme: e.target.value as Settings["theme"] })}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label className="setting">
        <span>Distance unit</span>
        <select
          value={settings.distanceUnit}
          onChange={(e) =>
            onChange({ ...settings, distanceUnit: e.target.value as Settings["distanceUnit"] })
          }
        >
          <option value="km">Kilometers</option>
          <option value="miles">Miles</option>
        </select>
      </label>
    </Panel>
  );
}
