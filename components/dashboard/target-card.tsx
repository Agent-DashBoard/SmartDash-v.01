// target-card.tsx — kartu "Target": 3 circular gauge capaian target SmartDash.
// Target BISA DIATUR: klik ikon pensil → modal 3 input → tersimpan localStorage.
// Progres = DATA ASLI (live Zernio) kalau ada:
//   - Target Followers      → followersCount akun terhubung
//   - Target Engagement     → total likes + komentar dari posts
//   - Konsistensi Posting   → jumlah posts
// Warna SmartDash: biru #60A5FA = followers, tosca #2DD4BF = engagement, orange #F97316 = konsistensi.

"use client";

import { useEffect, useState } from "react";
import { DayRange, RANGE_LABEL } from "./dashboard-data";
import { LiveData } from "./live-data";
import { platformLabel } from "./chart-data";

type Targets = { followers: number; engagement: number; consistency: number };

const LS_KEY = "smartdash-targets";
const DEFAULT_TARGETS: Targets = { followers: 2000, engagement: 100, consistency: 10 };

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function pct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((actual / target) * 100), 100);
}

// Circular gauge (donut) — SVG circle + strokeDasharray progress
function Gauge({ value, color, label, detail }: { value: number; color: string; label: string; detail: string }) {
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
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white">
          {value}%
        </span>
      </div>
      <span className="text-center text-[10px] font-semibold leading-tight text-[#94A3B8]">{label}</span>
      <span className="text-center text-[9px] leading-tight text-white/40">{detail}</span>
    </div>
  );
}

export function TargetCard({
  platform,
  days,
  live,
}: {
  platform: string;
  days: DayRange;
  live?: LiveData;
}) {
  const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Targets>(DEFAULT_TARGETS);

  // Load target tersimpan (sekali, mount) — via timeout biar aman hydration + lint
  useEffect(() => {
    const first = setTimeout(() => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setTargets({ ...DEFAULT_TARGETS, ...JSON.parse(raw) });
      } catch {
        // abaikan kalau rusak — pakai default
      }
    }, 0);
    return () => clearTimeout(first);
  }, []);

  // Simpan tiap target berubah
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(targets));
    } catch {
      // storage penuh/diblokir — abaikan
    }
  }, [targets]);

  // ---- Progres dari DATA ASLI Zernio ----
  // Semua akun (platform kosong) → agregat; platform pilihan → akun tunggal
  const matchedAccounts =
    live?.accounts?.filter((a) =>
      platform ? platformLabel(a.platform) === platform : true
    ) ?? [];
  const totalFollowers = matchedAccounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);
  const posts = (live?.posts ?? []).filter((p) =>
    platform ? platformLabel(p.platform) === platform : true
  );
  const totalLikes = posts.reduce((s, p) => s + (p.likeCount ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.commentCount ?? 0), 0);
  const engagement = totalLikes + totalComments;

  const metrics = [
    {
      label: "Target Followers",
      color: "#60A5FA",
      value: matchedAccounts.length ? pct(totalFollowers, targets.followers) : 0,
      detail: matchedAccounts.length
        ? `${fmt(totalFollowers)} / ${fmt(targets.followers)}`
        : "Belum ada akun terhubung",
    },
    {
      label: "Target Engagement",
      color: "#2DD4BF",
      value: pct(engagement, targets.engagement),
      detail: `${fmt(engagement)} / ${fmt(targets.engagement)} (likes+komentar)`,
    },
    {
      label: "Konsistensi Posting",
      color: "#F97316",
      value: pct(posts.length, targets.consistency),
      detail: `${posts.length} / ${targets.consistency} post`,
    },
  ];

  const openEdit = () => {
    setForm(targets);
    setEditing(true);
  };

  const saveEdit = () => {
    setTargets({
      followers: Math.max(1, Number(form.followers) || 1),
      engagement: Math.max(1, Number(form.engagement) || 1),
      consistency: Math.max(1, Number(form.consistency) || 1),
    });
    setEditing(false);
  };

  return (
    <div className="flex min-h-[400px] flex-1 flex-col rounded-[10px] bg-[#1C222B] p-4">
      {/* Header: title + tombol edit target */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-white">Target</h2>
        <button
          type="button"
          onClick={openEdit}
          title="Atur target"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3A4560] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </div>

      <p className="mt-1 text-[10px] font-semibold text-[#94A3B8]">
        Capaian · {RANGE_LABEL[days]} {platform ? `· ${platform}` : "· Semua Platform"}
      </p>

      <div className="mt-3 flex flex-col items-center justify-around gap-4">
        {metrics.map((m) => (
          <Gauge key={m.label} value={m.value} color={m.color} label={m.label} detail={m.detail} />
        ))}
      </div>

      <p className="mt-auto pt-3 text-center text-[9px] text-white/35">
        Klik ikon pensil untuk mengatur target kamu ✏️
      </p>

      {/* ===== Modal edit target ===== */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-[12px] bg-[#1C222B] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-white">Atur Target</h3>
                <p className="mt-0.5 text-[12px] text-white/50">
                  Target dipakai buat ngitung progres di kartu ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Tutup"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {(
                [
                  ["followers", "Target Followers (jumlah pengikut)"],
                  ["engagement", "Target Engagement (likes + komentar)"],
                  ["consistency", "Target Posting (jumlah konten)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-white/50">{label}</span>
                  <input
                    type="number"
                    min={1}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className="h-[34px] rounded-[8px] border border-[#38BDF8]/60 bg-[#0E1116] px-3 text-[13px] font-bold text-white outline-none focus:border-[#38BDF8]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-[8px] bg-[#4A4356] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#5A5270]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-[8px] bg-[#38BDF8] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#7DD3FC]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TargetCard;
