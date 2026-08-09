// chart.tsx — wrapper ringan recharts untuk SmartDash (versi minimal, sesuai kebutuhan project).
// Bukan salinan mentah shadcn — cuma ChartContainer/ChartConfig/ChartTooltip/ChartTooltipContent
// yang dipakai kartu-kartu dashboard.

"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";

// Config chart: key data → label + warna (dipakai legend/tooltip)
export type ChartConfig = Record<string, { label?: string; color?: string }>;

const ChartConfigContext = React.createContext<ChartConfig>({});

export function useChartConfig(): ChartConfig {
  return React.useContext(ChartConfigContext);
}

// Wrapper responsive — isi chart menyesuaikan container.
// initialDimension biar SSR/hydration punya ukuran awal (recharts ResponsiveContainer
// render 0x0 sebelum ResizeObserver jalan).
export function ChartContainer({
  config,
  className,
  children,
  initialDimension = { width: 400, height: 220 },
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactNode;
  initialDimension?: { width: number; height: number };
}) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ChartConfigContext.Provider value={config}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={initialDimension}>
          {children}
        </ResponsiveContainer>
      </ChartConfigContext.Provider>
    </div>
  );
}

// Tooltip recharts dengan styling default SmartDash
export function ChartTooltip({
  content,
  cursor = false,
}: {
  content: React.ReactElement;
  cursor?: boolean | object;
}) {
  return <Tooltip content={content} cursor={cursor} wrapperStyle={{ outline: "none" }} />;
}

// Konten tooltip sederhana: tiap seri → dot warna + label + nilai.
// Props active/payload/label di-inject recharts saat hover.
export type ChartTooltipContentProps = {
  hideLabel?: boolean;
  valueFormatter?: (value: number) => string;
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
    stroke?: string;
    fill?: string;
  }>;
  label?: string | number;
};

export function ChartTooltipContent({
  hideLabel = false,
  valueFormatter = (v) => String(v),
  active,
  payload,
  label,
}: ChartTooltipContentProps) {
  const config = useChartConfig();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#2E3750] bg-[#1C222B] px-3 py-2 shadow-xl">
      {!hideLabel && label != null && (
        <div className="mb-1 text-[11px] font-semibold text-white">{label}</div>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? "");
          const cfg = config[key];
          const color = cfg?.color ?? entry.color ?? entry.stroke ?? entry.fill ?? "#94A3B8";
          const name = cfg?.label ?? entry.name ?? key;
          const value = typeof entry.value === "number" ? valueFormatter(entry.value) : entry.value;
          return (
            <div key={key} className="flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[#94A3B8]">{name}</span>
              <span className="ml-auto pl-4 font-semibold text-white">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
