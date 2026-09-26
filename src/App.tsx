import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Game } from "./components/Game";
import { HelpPanel, SettingsPanel, StatsPanel } from "./components/panels";
import { getDayString } from "./domain/daily";
import { loadSettings, saveSettings, type Settings } from "./domain/storage";

type PanelName = "help" | "stats" | "settings" | null;

export default function App() {
  const dayString = useMemo(getDayString, []);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [panel, setPanel] = useState<PanelName>(() =>
    localStorage.getItem("witw-seen-help") || localStorage.getItem("tradle-seen-help") ? null : "help"
  );
  const [toastMessage, setToastMessage] = useState<{ text: string; sticky: boolean } | null>(null);
  const toastTimer = useRef<number>(undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const toast = useCallback((text: string, sticky = false) => {
    window.clearTimeout(toastTimer.current);
    setToastMessage({ text, sticky });
    if (!sticky) toastTimer.current = window.setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const closePanel = useCallback(() => {
    localStorage.setItem("witw-seen-help", "1");
    setPanel(null);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-button" onClick={() => setPanel("help")} aria-label="How to play">
          ?
        </button>
        <h1>
          Wit<span>W</span>
        </h1>
        <div className="topbar-right">
          <button className="icon-button" onClick={() => setPanel("stats")} aria-label="Statistics">
            📊
          </button>
          <button className="icon-button" onClick={() => setPanel("settings")} aria-label="Settings">
            ⚙️
          </button>
        </div>
      </header>

      <Game dayString={dayString} settings={settings} onSettingsChange={updateSettings} toast={toast} />

      <HelpPanel open={panel === "help"} onClose={closePanel} />
      <StatsPanel open={panel === "stats"} onClose={closePanel} />
      <SettingsPanel
        open={panel === "settings"}
        onClose={closePanel}
        settings={settings}
        onChange={updateSettings}
      />

      {toastMessage && (
        <div className="toast" onClick={() => setToastMessage(null)} role="status">
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
