import rawCountries from "../data/countries.json";

export interface Country {
  code: string;
  iso3: string | null;
  name: string;
  lat: number;
  lon: number;
  target: boolean;
}

export const countries: Country[] = [...(rawCountries as Country[])].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const targetCountries: Country[] = countries
  .filter((c) => c.target)
  .sort((a, b) => a.code.localeCompare(b.code));

export function sanitizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const byName = new Map(countries.map((c) => [sanitizeName(c.name), c]));
const byCode = new Map(countries.map((c) => [c.code, c]));

export function getCountryByName(name: string): Country | undefined {
  return byName.get(sanitizeName(name));
}

export function getCountryByCode(code: string): Country | undefined {
  return byCode.get(code);
}

export function flag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
