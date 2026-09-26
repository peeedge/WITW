import { forwardRef, useMemo, useState } from "react";
import { countries, flag, sanitizeName } from "../domain/countries";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  excluded: Set<string>;
}

export const CountryInput = forwardRef<HTMLInputElement, Props>(function CountryInput(
  { value, onChange, onSubmit, excluded },
  ref
) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => {
    const q = sanitizeName(value);
    if (!q) return [];
    const matches = countries.filter((c) => !excluded.has(c.code) && sanitizeName(c.name).includes(q));
    return matches.sort(
      (a, b) =>
        Number(!sanitizeName(a.name).startsWith(q)) - Number(!sanitizeName(b.name).startsWith(q))
    );
  }, [value, excluded]);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="country-input">
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder="Country, territory..."
        autoComplete="off"
        spellCheck={false}
        aria-label="Country guess"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const chosen = open && suggestions[highlight] ? suggestions[highlight].name : value;
            setOpen(false);
            onSubmit(chosen);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 && (
        <ul className="suggestions" role="listbox">
          {suggestions.slice(0, 8).map((c, i) => (
            <li
              key={c.code}
              role="option"
              aria-selected={i === highlight}
              className={i === highlight ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c.name);
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="flag">{flag(c.code)}</span> {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
