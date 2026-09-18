"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useChartData } from "./chart-data-hooks";

type TabKey = "views" | "engagement" | "traffic";
type ViewMode = "day" | "month" | "year";

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "views", label: "Views", color: "#3B82F6" },
  { key: "engagement", label: "Engagement", color: "#EF4444" },
  { key: "traffic", label: "Traffic", color: "#8B5CF6" },
];

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const DAY_NAME_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const now = new Date();
const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

// real weekday for calendar-day index `i` (0-based) of the CURRENT month —
// e.g. Aug 2026's 1st is actually a Saturday, so this can't be a naive 7-cycle
function weekdayLabelForDayIndex(i: number) {
  const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
  const jsDay = d.getDay(); // 0=Sun..6=Sat
  const mondayFirst = (jsDay + 6) % 7; // 0=Sen..6=Min
  return DAY_NAME_LABELS[mondayFirst];
}
const DAY_LABELS = Array.from({ length: daysInCurrentMonth }, (_, i) => String(i + 1));
const YEAR_LABELS = Array.from({ length: 12 }, (_, i) => String(2026 + i));

// Deterministic wave generator (no Math.random -> no SSR/CSR hydration mismatch)
function buildSeries(labels: string[], base: number, variance: number) {
  return labels.map((label, i) => {
    const wiggle =
      Math.sin(i / 2.3) * variance * 0.55 +
      Math.sin(i / 1.1 + 1.4) * variance * 0.25 +
      Math.cos(i / 4.7) * variance * 0.2;
    return { label, value: Math.max(0, Math.round(base + wiggle)) };
  });
}

const DATASETS: Record<ViewMode, Record<TabKey, { label: string; value: number }[]>> = {
  month: {
    views: buildSeries(MONTH_LABELS, 48_200, 12_000),
    engagement: buildSeries(MONTH_LABELS, 4_800, 1_200),
    traffic: buildSeries(MONTH_LABELS, 12_400, 3_000),
  },
  day: {
    views: buildSeries(DAY_LABELS, 1_600, 400),
    engagement: buildSeries(DAY_LABELS, 160, 40),
    traffic: buildSeries(DAY_LABELS, 400, 100),
  },
  year: {
    views: buildSeries(YEAR_LABELS, 48_200, 12_000),
    engagement: buildSeries(YEAR_LABELS, 4_800, 1_200),
    traffic: buildSeries(YEAR_LABELS, 12_400, 3_000),
  },
};

const FORMATTER: Record<TabKey, (v: number) => string> = {
  views: (v) => v.toLocaleString("id-ID"),
  engagement: (v) => v.toLocaleString("id-ID"),
  traffic: (v) => v.toLocaleString("id-ID"),
};

const Y_DOMAIN: Record<TabKey, [number, number]> = {
  views: [0, 70_000],
  engagement: [0, 7_000],
  traffic: [0, 18_000],
};

// ---------------------------------------------------------------------------
// LAYOUT CONSTANTS — everything below is computed from these, not measured at
// runtime. If the dot row still looks a hair off in your browser, nudge these
// numbers directly (they map 1:1 to the Recharts props used further down).
// ---------------------------------------------------------------------------
const CHART_HEIGHT = 300; // total height of the chart box
const CHART_MARGIN_TOP = 10; // AreaChart margin.top
const CHART_MARGIN_LEFT = 0; // AreaChart margin.left — kept at 0 to hug the card's left edge
const CHART_MARGIN_RIGHT = 6; // AreaChart margin.right — small, just enough so the dot's own circle radius isn't clipped
const Y_AXIS_WIDTH = 74; // YAxis width — more breathing room from the card's left edge
const Y_AXIS_TICK_MARGIN = 10; // gap between the numbers and the gridlines
const X_AXIS_RESERVED_HEIGHT = 24; // vertical space Recharts reserves for the bottom labels
const TRACK_OFFSET_ABOVE_LABELS = 6; // sit right ON the baseline gridline, not floating above it

const EFFECTIVE_LEFT = CHART_MARGIN_LEFT + Y_AXIS_WIDTH; // where the plot area actually starts, in px
const EFFECTIVE_RIGHT = CHART_MARGIN_RIGHT; // where the plot area ends, in px from the right
const PLOT_BOTTOM_Y =
  CHART_MARGIN_TOP + (CHART_HEIGHT - CHART_MARGIN_TOP - X_AXIS_RESERVED_HEIGHT);
const TRACK_TOP = PLOT_BOTTOM_Y - TRACK_OFFSET_ABOVE_LABELS;

const GREEN = "#22C55E";
const RED = "#6900CC"; // warna traveler saat di puncak (pulse)
const MS_PER_STEP = 700; // Day mode's per-step pace (kept as-is — this is the speed that's already perfect)
// Fixed total loop duration derived from Day mode's natural pace, so Month/Year
// travel the SAME on-screen distance at the SAME speed instead of finishing too
// fast just because they have fewer points.
const TOTAL_LOOP_MS = (daysInCurrentMonth - 1) * MS_PER_STEP;
const NEAR_THRESHOLD = 0.12; // fraction of a step considered "at" a point

export default function ChartSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("views");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  // exact pixel x Recharts itself uses to place the hover dot — using this same
  // value for our line guarantees perfect alignment, no independent guessing
  const [hoverX, setHoverX] = useState<number | null>(null);

  const tab = TABS.find((t) => t.key === activeTab)!;
  const mockData = DATASETS[viewMode][activeTab];

  // Data ASLI dari Zernio analytics (views/engagement per post).
  // Kalau API mati / kosong → fallback ke deret mock di atas.
  const live = useChartData(viewMode, DAY_LABELS.length);
  const liveSeries = { views: live.views, engagement: live.engagement, traffic: live.traffic } as Record<
    TabKey,
    { label: string; value: number }[]
  >;
  const hasLiveChart = !live.loading && live.hasData;
  const data = hasLiveChart ? liveSeries[activeTab] : mockData;
  const valueFormatter = FORMATTER[activeTab];

  // AUTO-SCALE Y domain: ikut max data (asli atau mock) + headroom 25%,
  // dibulatkan ke angka "bersih" (1/2.5/5×10^n). Kalau data datar (max=0)
  // → fallback ke domain mock biar sumbu gak merosot ke nol.
  const yDomain = useMemo<[number, number]>(() => {
    const maxVal = data.reduce((m, d) => Math.max(m, d.value), 0);
    if (maxVal <= 0) return Y_DOMAIN[activeTab];
    const target = maxVal * 1.25;
    const pow = Math.pow(10, Math.floor(Math.log10(target)));
    const n = target / pow;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return [0, nice * pow];
  }, [data, activeTab]);

  const displayLabel = (label: string, index: number) =>
    viewMode === "day" ? weekdayLabelForDayIndex(index) : label;

  // force exactly 7 evenly-spaced gridlines/ticks on the Y axis, matching the reference
  const yTicks = useMemo(() => {
    const [min, max] = yDomain;
    const step = (max - min) / 6;
    return Array.from({ length: 7 }, (_, i) => Math.round(min + step * i));
  }, [yDomain]);

  const peakIndex = useMemo(() => {
    let maxI = 0;
    for (let i = 1; i < data.length; i++) if (data[i].value > data[maxI].value) maxI = i;
    return maxI;
  }, [data]);
  const peakIndexRef = useRef(peakIndex);
  useEffect(() => {
    peakIndexRef.current = peakIndex;
  }, [peakIndex]);

  // which index represents "today", per the active view mode — this marker gets
  // a permanent pulse regardless of where the traveling dot currently is
  const todayIndex = useMemo(() => {
    const today = new Date();
    if (viewMode === "month") return today.getMonth(); // 0=Jan .. 11=Des
    if (viewMode === "day") return today.getDate() - 1; // matches DAY_LABELS (tanggal 1..N)
    if (viewMode === "year") {
      const idx = today.getFullYear() - 2026;
      return idx >= 0 && idx < YEAR_LABELS.length ? idx : -1;
    }
    return -1;
  }, [viewMode]);
  const todayIndexRef = useRef(todayIndex);
  useEffect(() => {
    todayIndexRef.current = todayIndex;
  }, [todayIndex]);

  // exact same math Recharts uses for a zero-padding point scale: evenly spaced
  // between the plot's left and right edges, index 0 at the start, last index at the end


  // refs for direct DOM-driven animation (smooth continuous glide, not React re-renders)
  const travelerRef = useRef<HTMLSpanElement | null>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const litIndexRef = useRef(-1);

  useEffect(() => {
    markerRefs.current = markerRefs.current.slice(0, data.length);
    litIndexRef.current = -1;
    const startTime = performance.now();
    const durationMs = Math.max(3000, TOTAL_LOOP_MS);

    const clearLit = () => {
      const prev = litIndexRef.current;
      if (prev >= 0 && markerRefs.current[prev]) {
        markerRefs.current[prev]!.classList.remove("marker-lit", "marker-lit-peak");
      }
    };

    function frame(t: number) {
      const elapsed = t - startTime;
      const progress = (elapsed % durationMs) / durationMs; // 0..1, continuous, loops forever
      const exactIndex = progress * (data.length - 1);
      const nearest = Math.round(exactIndex);
      const dist = Math.abs(exactIndex - nearest);
      const isNear = dist < NEAR_THRESHOLD;
      const isPeak = isNear && nearest === peakIndexRef.current;
      const isTodayHit = isNear && nearest === todayIndexRef.current;
      const shouldPulse = isPeak || isTodayHit;
      const pct = data.length > 1 ? (exactIndex / (data.length - 1)) * 100 : 0;

      if (travelerRef.current) {
        travelerRef.current.style.left = `${pct}%`;
        const color = isPeak ? RED : GREEN;
        travelerRef.current.style.backgroundColor = color;
        travelerRef.current.style.setProperty(
          "--pulse-color",
          isPeak ? "rgba(105, 0, 204, 0.55)" : "rgba(34, 197, 94, 0.55)"
        );
        // only pulse while parked on the peak (red) or on today's marker (green) —
        // plain, non-pulsing travel everywhere else
        travelerRef.current.classList.toggle("traveler-pulsing", shouldPulse);
      }

      if (isNear && litIndexRef.current !== nearest) {
        clearLit();
        litIndexRef.current = nearest;
        const el = markerRefs.current[nearest];
        if (el) el.classList.add(isPeak ? "marker-lit-peak" : "marker-lit");
      } else if (!isNear && litIndexRef.current >= 0) {
        clearLit();
        litIndexRef.current = -1;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearLit();
    };
  }, [data, viewMode, activeTab]);

  const tickStep = data.length > 12 ? Math.ceil(data.length / 10) : 1;
  const tickFormatter = (value: string) => {
    const idx = data.findIndex((d) => d.label === value);
    if (idx === -1) return "";
    return idx % tickStep === 0 || idx === data.length - 1 ? displayLabel(value, idx) : "";
  };

  return (
    <div className="mt-6 w-full [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <style jsx>{`
        @keyframes travelerPulse {
          0% {
            box-shadow: 0 0 0 0 var(--pulse-color);
          }
          70% {
            box-shadow: 0 0 0 9px transparent;
          }
          100% {
            box-shadow: 0 0 0 0 transparent;
          }
        }
        /* the traveling dot no longer pulses by default — only while parked on
           the peak value (red) or on today's marker (green), toggled via JS */
        .traveler-pulsing {
          animation: travelerPulse 1s ease-out infinite;
        }
        @keyframes todayPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(217, 217, 217, 0.6);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(217, 217, 217, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(217, 217, 217, 0);
          }
        }
        /* the static "today" marker pulses permanently, independent of where
           the traveling dot currently is */
        .marker-today {
          animation: todayPulse 1.6s ease-out infinite;
        }
        .marker-lit {
          background-color: ${GREEN} !important;
          box-shadow: 0 0 8px 1px rgba(34, 197, 94, 0.6);
        }
        .marker-lit-peak {
          background-color: ${RED} !important;
          box-shadow: 0 0 10px 2px rgba(105, 0, 204, 0.65);
        }
        .marker-dot {
          /* warna di-set di sini (styled-jsx runtime), BUKAN via kelas Tailwind
             bg-[#FFFFFF] — kelas tsb tidak ter-generate di build (invisible dot bug) */
          background-color: #ffffff;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .marker-dot.marker-lit,
        .marker-dot.marker-lit-peak {
          transform: translate(-50%, -50%) scale(1.8) !important;
        }
      `}</style>

      {/* Single unified card: header + chart together */}
      <div className="bg-[#1C222B] rounded-[12px] overflow-hidden pt-4 pb-4 pl-4">
        {/* Header row: tabs left, view mode toggle right — wrap ke baris baru di layar sempit
            biar gak nabrak (dulu: "TrafficDay" nempel karena dipaksa 1 baris) */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4 pr-4">
          <div className="flex items-center gap-3 sm:gap-5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-[13px] font-medium transition-colors ${
                  activeTab === t.key ? "text-white" : "text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            {VIEW_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setViewMode(m.key)}
                className={`text-[13px] font-medium transition-colors ${
                  viewMode === m.key ? "text-white" : "text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart area — intentionally NOT padded on the right, so the wave/dot
            can reach the card's true right edge. overflow-hidden on the card
            above cleanly clips it against the rounded corner. */}
        <div className="relative" style={{ height: CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: CHART_MARGIN_TOP,
                right: CHART_MARGIN_RIGHT,
                left: CHART_MARGIN_LEFT,
                bottom: 0,
              }}
              onMouseMove={(state: any) => {
                if (state?.isTooltipActive && state?.activeCoordinate) {
                  setHoverX(state.activeCoordinate.x);
                } else {
                  setHoverX(null);
                }
              }}
              onMouseLeave={() => setHoverX(null)}
            >
              <defs>
                <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tab.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={tab.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#2E3750" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                padding={{ left: 0, right: 0 }}
                tick={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={valueFormatter}
                domain={yDomain}
                ticks={yTicks}
                width={Y_AXIS_WIDTH}
                tickMargin={Y_AXIS_TICK_MARGIN}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1C222B",
                  border: "1px solid #2E3750",
                  borderRadius: 8,
                  color: "#fff",
                }}
                formatter={(value) => [valueFormatter(Number(value ?? 0)), tab.label]}
                labelFormatter={(label) => {
                  const idx = data.findIndex((d) => d.label === label);
                  return displayLabel(String(label), idx === -1 ? 0 : idx);
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={tab.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${activeTab})`}
                dot={false}
                activeDot={{ r: 4, fill: tab.color, stroke: "#0E1116", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Custom hover guide line — positioned using the EXACT same pixel x
              Recharts computed for the active dot (state.activeCoordinate.x), so
              it always lands precisely on the dot, never independently offset */}
          {hoverX !== null && (
            <div
              className="pointer-events-none absolute top-0"
              style={{
                left: hoverX,
                height: PLOT_BOTTOM_Y,
                width: 1,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />
          )}

          {/* Traveling dot track — laid out with the SAME left/right insets given to
              Recharts above (EFFECTIVE_LEFT / EFFECTIVE_RIGHT), so point 0 sits exactly
              on Recharts' own first tick and the last point sits exactly on its last
              tick, with everything else evenly spaced in between. No runtime DOM
              measurement, so there's no risk of a stray/misplaced dot. */}
          <div
            className="pointer-events-none absolute left-0 right-0 h-0"
            style={{
              top: TRACK_TOP,
              paddingLeft: EFFECTIVE_LEFT,
              paddingRight: EFFECTIVE_RIGHT,
            }}
          >
            <div className="relative h-0 w-full">
              {/* static reference markers — a clean row of white dots sitting
                  right ABOVE the month/date labels at the bottom of the chart.
                  The one matching TODAY pulses permanently via marker-today. */}
              {data.map((d, i) => {
                const basePct = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                const isToday = i === todayIndex;
                return (
                  <span
                    key={d.label + i}
                    ref={(el) => {
                      markerRefs.current[i] = el;
                    }}
                    className={`marker-dot absolute top-1/2 block h-[8px] w-[8px] rounded-full${
                      isToday ? " marker-today" : ""
                    }`}
                    style={{
                      left: `${basePct}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                );
              })}

              {/* continuously traveling dot — no longer pulses by default; the
                  "traveler-pulsing" class is toggled on/off via JS depending on
                  whether it's parked on the peak or today's marker */}
              <span
                ref={travelerRef}
                className="absolute top-1/2 block h-[10px] w-[10px] rounded-full bg-[#22C55E]"
                style={{ left: "0%", transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>

          {/* Text labels — rendered as plain HTML using the EXACT same posForIndex
              math AND the SAME left/right padding as the dot track above, so both
              share one identical coordinate space and can never drift apart */}
          <div
            className="pointer-events-none absolute left-0 right-0"
            style={{
              top: TRACK_TOP + 16,
              paddingLeft: EFFECTIVE_LEFT,
              paddingRight: EFFECTIVE_RIGHT,
            }}
          >
            <div className="relative h-4 w-full">
              {data.map((d, i) => {
                const text = tickFormatter(d.label);
                if (!text) return null;
                const basePct = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                const isFirst = i === 0;
                const isLast = i === data.length - 1;
                // first label grows rightward, last grows leftward, so neither
                // ever pokes past the card edge — but the anchor x is identical
                // to the dot's x, so they stay visually tied together
                const translateX = isFirst ? "-10px" : isLast ? "calc(-100% + 10px)" : "-50%";
                return (
                  <span
                    key={d.label + i}
                    className="absolute whitespace-nowrap text-[11px] text-[#64748B]"
                    style={{ left: `${basePct}%`, transform: `translateX(${translateX})` }}
                  >
                    {text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}