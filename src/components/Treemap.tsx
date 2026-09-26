import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { useEffect, useMemo, useRef, useState } from "react";
import productNames from "../data/products.json";
import { formatUsd, type ExportData } from "../domain/game";
import { getSection, textColorFor, type Section } from "../domain/sections";

interface Leaf {
  hs4: string;
  name: string;
  value: number;
  section: Section;
}

interface Node {
  name: string;
  children?: Node[];
  leaf?: Leaf;
}

interface Tooltip {
  leaf: Leaf;
  x: number;
  y: number;
}

const names = productNames as Record<string, string>;

export function Treemap({ data }: { data: ExportData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tree = useMemo<Node>(() => {
    const bySection = new Map<number, Node>();
    for (const [hs4, value] of data.products) {
      const section = getSection(hs4);
      let node = bySection.get(section.id);
      if (!node) {
        node = { name: section.name, children: [] };
        bySection.set(section.id, node);
      }
      node.children!.push({ name: hs4, leaf: { hs4, name: names[hs4] ?? hs4, value, section } });
    }
    return { name: "root", children: [...bySection.values()] };
  }, [data]);

  const leaves = useMemo(() => {
    if (!size.width || !size.height) return [];
    const root = hierarchy(tree)
      .sum((d) => d.leaf?.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return treemap<Node>()
      .tile(treemapSquarify.ratio(1.2))
      .size([size.width, size.height])
      .paddingInner(1)
      .round(true)(root)
      .leaves();
  }, [tree, size]);

  const total = data.total;

  return (
    <div
      className="treemap"
      ref={containerRef}
      onMouseLeave={() => setTooltip(null)}
      role="img"
      aria-label="Treemap of the mystery country's exports"
    >
      {leaves.map((node) => {
        const leaf = node.data.leaf!;
        const w = node.x1 - node.x0;
        const h = node.y1 - node.y0;
        const share = (leaf.value / total) * 100;
        const fontSize = Math.max(9, Math.min(22, Math.sqrt(w * h) / 7));
        const showLabel = w > 34 && h > 22;
        return (
          <div
            key={leaf.hs4}
            className="tile"
            style={{
              left: node.x0,
              top: node.y0,
              width: w,
              height: h,
              background: leaf.section.color,
              color: textColorFor(leaf.section.color),
              fontSize,
            }}
            onMouseMove={(e) => {
              const rect = containerRef.current!.getBoundingClientRect();
              setTooltip({ leaf, x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onClick={(e) => {
              const rect = containerRef.current!.getBoundingClientRect();
              setTooltip({ leaf, x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
          >
            {showLabel && (
              <>
                <span className="tile-name">{leaf.name}</span>
                {h > fontSize * 2.6 && <span className="tile-share">{share.toFixed(2)}%</span>}
              </>
            )}
          </div>
        );
      })}
      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: Math.min(tooltip.x + 12, size.width - 220),
            top: tooltip.y > size.height - 110 ? tooltip.y - 100 : tooltip.y + 16,
          }}
        >
          <div className="tooltip-title">
            <span className="swatch" style={{ background: tooltip.leaf.section.color }} />
            {tooltip.leaf.name}
          </div>
          <div className="tooltip-row">
            HS4 {tooltip.leaf.hs4} · {tooltip.leaf.section.name}
          </div>
          <div className="tooltip-row">
            {formatUsd(tooltip.leaf.value)} · {((tooltip.leaf.value / total) * 100).toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
}
