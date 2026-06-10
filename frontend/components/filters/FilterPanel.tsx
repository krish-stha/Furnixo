"use client";
 
import { useState } from "react";
import { COLOR_HEX, type ProductFacets } from "@/lib/types";
import { cn } from "@/lib/utils";
 
export interface ShopFilters {
  category?: string;
  colors: string[];
  materials: string[];
  minPrice?: number;
  maxPrice?: number;
  sale: boolean;
}
 
interface Props {
  facets: ProductFacets | null;
  filters: ShopFilters;
  onChange: (next: ShopFilters) => void;
}
 
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-200 py-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
      {children}
    </div>
  );
}
 
export default function FilterPanel({ facets, filters, onChange }: Props) {
  const [min, setMin] = useState(filters.minPrice?.toString() ?? "");
  const [max, setMax] = useState(filters.maxPrice?.toString() ?? "");
 
  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
 
  return (
    <div>
      <Section title="Filter by Price">
        <div className="flex items-center gap-2">
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            inputMode="numeric"
            placeholder="Min"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-900 focus:outline-none"
          />
          <span className="text-neutral-400">–</span>
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            inputMode="numeric"
            placeholder="Max"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <button
          onClick={() =>
            onChange({
              ...filters,
              minPrice: min ? Number(min) : undefined,
              maxPrice: max ? Number(max) : undefined,
            })
          }
          className="mt-2 w-full bg-neutral-900 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          Apply
        </button>
      </Section>
 
      <Section title="Filter by Categories">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onChange({ ...filters, category: undefined })}
              className={cn(
                "text-sm",
                !filters.category
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              All
            </button>
          </li>
          {(facets?.categories ?? []).map((c) => (
            <li key={c.slug} className="flex items-center justify-between">
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    category: filters.category === c.slug ? undefined : c.slug,
                  })
                }
                className={cn(
                  "text-sm",
                  filters.category === c.slug
                    ? "font-semibold text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                {c.name}
              </button>
              <span className="text-xs text-neutral-400">({c.count})</span>
            </li>
          ))}
          <li className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={filters.sale}
                onChange={() => onChange({ ...filters, sale: !filters.sale })}
                className="h-4 w-4 accent-neutral-900"
              />
              Sale
            </label>
          </li>
        </ul>
      </Section>
 
      <Section title="Filter by Color">
        <ul className="space-y-2">
          {(facets?.colors ?? []).map((c) => (
            <li key={c.value} className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm capitalize text-neutral-600">
                <input
                  type="checkbox"
                  checked={filters.colors.includes(c.value)}
                  onChange={() =>
                    onChange({ ...filters, colors: toggleIn(filters.colors, c.value) })
                  }
                  className="h-4 w-4 accent-neutral-900"
                />
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border border-neutral-300"
                  style={{
                    backgroundColor: COLOR_HEX[c.value as keyof typeof COLOR_HEX] ?? "#ccc",
                  }}
                />
                {c.value}
              </label>
              <span className="text-xs text-neutral-400">({c.count})</span>
            </li>
          ))}
        </ul>
      </Section>
 
      <Section title="Filter by Material">
        <ul className="space-y-2">
          {(facets?.materials ?? []).map((m) => (
            <li key={m.value} className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm capitalize text-neutral-600">
                <input
                  type="checkbox"
                  checked={filters.materials.includes(m.value)}
                  onChange={() =>
                    onChange({ ...filters, materials: toggleIn(filters.materials, m.value) })
                  }
                  className="h-4 w-4 accent-neutral-900"
                />
                {m.value}
              </label>
              <span className="text-xs text-neutral-400">({m.count})</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
 