// target-card.tsx — kartu "Target": 3 circular gauge (donut) capaian target SmartDash.
// Style ikut referensi BangBay (ring progress + angka % di tengah + label bawah),
// tapi label = metrik SmartDash (Target Followers · Target Engagement · Konsistensi Posting).
// Warna SmartDash: biru #60A5FA = followers, tosca #2DD4BF = engagement, orange #F97316 = konsistensi.
// Nilai mock masuk akal (44/71/80 — tanpa 0% yang keliatan rusak).
// Patuh types dashboard-data.ts (DayRange, RANGE_LABEL) untuk sinkron filter.

"use client";

import { DayRange, RANGE_LABEL } from "./dashboard-data";

// Data capaian target (mock, % dari target) — akumulatif, tidak diskala per range
// (konsisten dgn arahan: jangan ada nilai yang keliatan "rusak")
const TARGET_METRICS = [
  { label: "Target Followers", value: 44, color: "#60A5FA" },
  { label: "Target Engagement", value: 71, color: "#2DD4BF" },
  { label: "Konsistensi Posting", value: 80, color: "#F97316" },
];

// Circular gauge (donut) — SVG circle + strokeDasharray progress
function Gauge({ value, color, label }: { value: number; color: string; label: string }) {
  const R = 42; // radius
  const C = 2 * Math.PI * R; // keliling lingkaran
  const dash = (Math.min(Math.max(value, 0), 100) / 100) * C;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-[80px] w-[80px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {/* Track (background ring) */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#232A3D" strokeWidth="9" />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
          />
        </svg>
        {/* Angka % di tengah */}
        <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-white">
          {value}%
        </span>
      </div>
      <span className="text-[10px] font-semibold text-[#94A3B8]">{label}</span>
    </div>
  );
}

export function TargetCard({ platform, days }: { platform: string; days: DayRange }) {
  return (
    <div className="flex min-h-[364px] flex-1 flex-col rounded-[10px] bg-[#1C222B] p-3">
      {/* Header: title + badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-white">Target</h2>
        {platform ? (
          <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white" style={{ backgroundColor: `${"#F97316"}25` }}>
            {platform}
          </span>
        ) : (
          <span className="rounded-full bg-[#232A3D] px-2 py-0.5 text-[9px] font-semibold text-[#94A3B8]">
            SmartDash
          </span>
        )}
      </div>

      {/* Sub-judul */}
      <div className="mt-1.5 text-[10px] font-medium text-[#94A3B8]/70">
        Capaian target · {RANGE_LABEL[days]}
      </div>

      {/* 3 circular gauge — stacked vertikal (style referensi) */}
      <div className="mt-2 flex flex-1 flex-col items-center justify-evenly gap-1">
        {TARGET_METRICS.map((m) => (
          <Gauge key={m.label} value={m.value} color={m.color} label={m.label} />
        ))}
      </div>
    </div>
  );
}

export default TargetCard;
