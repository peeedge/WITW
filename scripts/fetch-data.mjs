// Builds the static game data from the Harvard Atlas of Economic Complexity
// (HS92, 4-digit) and the country centroids used by the original Tradle.
// Usage: node scripts/fetch-data.mjs
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const YEAR = 2023;
const MIN_TOTAL_EXPORTS = 100_000_000;
const COVERAGE = 0.995;
const ATLAS = "https://atlas.hks.harvard.edu/api/graphql";
const CENTROIDS =
  "https://raw.githubusercontent.com/alexandersimoes/tradle/main/src/domain/countries.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const exportsDir = join(root, "public", "data", "exports");
const srcDataDir = join(root, "src", "data");

async function gql(query, attempt = 1) {
  try {
    const res = await fetch(ATLAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return gql(query, attempt + 1);
  }
}

async function loadCentroids() {
  const text = await (await fetch(CENTROIDS)).text();
  const start = text.indexOf("export const countries");
  const body = text.slice(start, text.indexOf("];", start));
  const uncommented = body
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
  const re =
    /code:\s*"(\w+)",\s*latitude:\s*(-?[\d.]+),\s*longitude:\s*(-?[\d.]+),\s*name:\s*"([^"]+)"/g;
  const iso3Start = text.indexOf("countryISOMapping");
  const iso3Body = text.slice(iso3Start, text.indexOf("};", iso3Start));
  const iso3 = Object.fromEntries(
    [...iso3Body.matchAll(/(\w{2}):\s*"(\w{3})"/g)].map((m) => [m[1], m[2]])
  );
  const out = new Map();
  for (const m of uncommented.matchAll(re)) {
    out.set(m[1], { lat: +m[2], lon: +m[3], name: m[4], iso3: iso3[m[1]] });
  }
  return out;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}

const centroids = await loadCentroids();
console.log(`centroids: ${centroids.size}`);

const { locationCountry } = await gql(
  `{ locationCountry { countryId iso3Code iso2Code nameShortEn formerCountry } }`
);
const { productHs92 } = await gql(
  `{ productHs92(productLevel: 4) { productId code nameShortEn productType } }`
);
const products = new Map(
  productHs92
    .filter((p) => p.productType === "good" && /^\d{4}$/.test(p.code))
    .map((p) => [p.productId, { code: p.code, name: p.nameShortEn }])
);
console.log(`atlas countries: ${locationCountry.length}, products: ${products.size}`);

const atlasByIso3 = new Map(
  locationCountry.filter((c) => !c.formerCountry).map((c) => [c.iso3Code, c])
);
const atlasFor = (code) => atlasByIso3.get(centroids.get(code).iso3);

// Some Atlas short names are nicer than the Google centroid list's names.
const NAME_OVERRIDES = {
  CD: "DR Congo",
  CG: "Republic of the Congo",
  CI: "Côte d'Ivoire",
  MK: "North Macedonia",
  SZ: "Eswatini",
  CZ: "Czechia",
  TR: "Turkey",
  MM: "Myanmar",
  BL: "Saint Barthélemy",
  KP: "North Korea",
  KR: "South Korea",
  LA: "Laos",
  FM: "Micronesia",
  PS: "Palestine",
  VA: "Vatican City",
  TL: "Timor-Leste",
};

await rm(exportsDir, { recursive: true, force: true });
await mkdir(exportsDir, { recursive: true });
await mkdir(srcDataDir, { recursive: true });

const codes = [...centroids.keys()].sort();
const targets = new Set();
const usedProducts = new Set();

await mapLimit(codes, 6, async (code) => {
  const atlas = atlasFor(code);
  if (!atlas) {
    console.log(`skip ${code}: not in Atlas`);
    return;
  }
  const id = atlas.countryId.replace("country-", "");
  const data = await gql(
    `{ countryProductYear(countryId: ${id}, productLevel: 4, yearMin: ${YEAR}, yearMax: ${YEAR}) { productId exportValue } }`
  );
  const rows = data.countryProductYear
    .filter((r) => products.has(r.productId) && r.exportValue > 0)
    .sort((a, b) => b.exportValue - a.exportValue);
  const total = rows.reduce((s, r) => s + r.exportValue, 0);
  if (total < MIN_TOTAL_EXPORTS) {
    console.log(`skip ${code}: $${Math.round(total / 1e6)}M`);
    return;
  }
  const kept = [];
  let acc = 0;
  for (const r of rows) {
    if (acc / total >= COVERAGE && kept.length >= 20) break;
    const p = products.get(r.productId);
    kept.push([p.code, Math.round(r.exportValue)]);
    usedProducts.add(p.code);
    acc += r.exportValue;
  }
  await writeFile(
    join(exportsDir, `${code}.json`),
    JSON.stringify({ year: YEAR, total: Math.round(total), products: kept })
  );
  targets.add(code);
  console.log(`${code}: $${(total / 1e9).toFixed(1)}B, ${kept.length} products`);
});

const countries = codes.map((code) => {
  const c = centroids.get(code);
  return {
    code,
    iso3: c.iso3 ?? null,
    name: NAME_OVERRIDES[code] ?? c.name,
    lat: c.lat,
    lon: c.lon,
    target: targets.has(code),
  };
});

const productNames = Object.fromEntries(
  [...products.values()]
    .filter((p) => usedProducts.has(p.code))
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((p) => [p.code, p.name])
);

await writeFile(join(srcDataDir, "countries.json"), JSON.stringify(countries, null, 1));
await writeFile(join(srcDataDir, "products.json"), JSON.stringify(productNames, null, 1));
console.log(`done: ${countries.length} countries, ${targets.size} playable, ${usedProducts.size} products`);
