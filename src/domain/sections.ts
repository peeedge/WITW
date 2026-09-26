export interface Section {
  id: number;
  name: string;
  color: string;
}

// HS sections, keyed by the last 2-digit chapter each one covers.
const SECTIONS: [lastChapter: number, name: string, color: string][] = [
  [5, "Animal Products", "#e0a458"],
  [14, "Vegetable Products", "#a7c957"],
  [15, "Animal and Vegetable Bi-Products", "#d4b44a"],
  [24, "Foodstuffs", "#5b9a5b"],
  [27, "Mineral Products", "#8c5a3c"],
  [38, "Chemical Products", "#d9598c"],
  [40, "Plastics and Rubbers", "#56b8c4"],
  [43, "Animal Hides", "#a86f4c"],
  [46, "Wood Products", "#c49a6c"],
  [49, "Paper Goods", "#e8d5a3"],
  [63, "Textiles", "#3fa77f"],
  [67, "Footwear and Headwear", "#86c49a"],
  [70, "Stone and Glass", "#b3a594"],
  [71, "Precious Metals", "#e6c229"],
  [83, "Metals", "#b5694a"],
  [85, "Machines", "#5a7fd6"],
  [89, "Transportation", "#8f6bd1"],
  [92, "Instruments", "#cf4a4a"],
  [93, "Weapons", "#6e6e6e"],
  [96, "Miscellaneous", "#e57c5d"],
  [99, "Arts and Antiques", "#a45cae"],
];

export const sections: Section[] = SECTIONS.map(([, name, color], id) => ({ id, name, color }));

export function getSection(hs4: string): Section {
  const chapter = parseInt(hs4.slice(0, 2), 10);
  const index = SECTIONS.findIndex(([last]) => chapter <= last);
  return sections[index === -1 ? sections.length - 1 : index];
}

export function textColorFor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#1f2328" : "#ffffff";
}
