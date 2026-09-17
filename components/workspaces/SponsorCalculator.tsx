"use client";

// components/workspaces/SponsorCalculator.tsx
// Sponsor Pricing Calculator — hitung tarif endorse wajar.
// Input bisa auto dari data Zernio (useLiveData) atau diisi manual.
// Pola & gaya konsisten dengan RevenueWorkspace.

import { useEffect, useMemo, useState } from "react";
import { useLiveData } from "@/components/dashboard/live-data";

type RateMethod = "per1k" | "per10k" | "engagement";

const rupiah = (n: number) => {
  if (n >= 1_000_000) return "Rp" + (n / 1_000_000).toFixed(2).replace(/\.00$/, "") + " jt";
  if (n >= 1_000) return "Rp" + (n / 1_000).toFixed(0) + " rb";
  return "Rp" + n;
};
const rupiahFull = (n: number) => "Rp" + n.toLocaleString("id-ID");

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  lain: "Lainnya",
};

export function SponsorCalculator() {
  const live = useLiveData();
  const liveAccounts = live.accounts ?? [];

  // ===== Input (default dari akun pertama Zernio) =====
  const [platform, setPlatform] = useState("tiktok");
  const [followers, setFollowers] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [method, setMethod] = useState<RateMethod>("per1k");

  // Muat data akun live saat tersedia
  useEffect(() => {
    if (liveAccounts.length > 0) {
      const acc = liveAccounts[0];
      setPlatform(acc.platform);
      setFollowers(String(acc.followersCount ?? ""));
      if (acc.likesCount) setLikes(String(acc.likesCount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveAccounts.length]);

  const f = Number(followers) || 0;
  const l = Number(likes) || 0;
  const c = Number(comments) || 0;

  // ===== Kalkulasi =====
  const result = useMemo(() => {
    if (!f) return null;
    const engagementRate = f > 0 ? (l + c) / f : 0; // likes+comments per follower
    const engagementPct = engagementRate * 100;

    let low = 0;
    let high = 0;

    if (method === "per1k") {
      // Standar umum: Rp 10.000 - 20.000 per 1.000 follower, naik di tier atas
      const base = (f / 1000) * 10000;
      low = base;
      high = (f / 1000) * 20000;
    } else if (method === "per10k") {
      // Flat per 10.000 follower (mirip CPM sosial)
      low = (f / 10000) * 150000;
      high = (f / 10000) * 300000;
    } else {
      // Berbasis engagement rate: makin tinggi ER, makin mahal
      low = f * 2; // minimal
      high = f * 4;
      if (engagementPct >= 8) { low *= 1.2; high *= 1.2; }
      else if (engagementPct >= 5) { low *= 1.05; high *= 1.05; }
    }

    return {
      low: Math.round(low),
      high: Math.round(high),
      range: high - low,
      engagementPct: (engagementPct * 100).toFixed(1),
      erRaw: engagementPct,
    };
  }, [f, l, c, method]);

  // Kategori tier
  const tier = f >= 500_000 ? "Macro" : f >= 100_000 ? "Micro-Mid" : f >= 10_000 ? "Micro" : "Nano";
  const tierColor =
    f >= 500_000 ? "#8B5CF6" : f >= 100_000 ? "#3B82F6" : f >= 10_000 ? "#22C55E" : "#22C55E";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {/* ===== Input Panel ===== */}
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <Field label="Platform">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
          >
            {Object.entries(PLATFORM_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Followers">
          <input
            type="number"
            min="0"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            placeholder="cth 1648"
            className="w-full appearance-none rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none placeholder:text-white/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
          />
        </Field>
        <Field label="Likes (rata-rata)">
          <input
            type="number"
            min="0"
            value={likes}
            onChange={(e) => setLikes(e.target.value)}
            placeholder="cth 250"
            className="w-full appearance-none rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none placeholder:text-white/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
          />
        </Field>
        <Field label="Komentar (rata-rata)">
          <input
            type="number"
            min="0"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="cth 30"
            className="w-full appearance-none rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none placeholder:text-white/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
          />
        </Field>
      </div>

      {/* ===== Metode hitung ===== */}
      <div className="shrink-0">
        <span className="mb-1 block text-[11px] font-semibold text-white/60">Metode Hitung</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { v: "per1k", label: "Per 1.000 Follower" },
            { v: "per10k", label: "Per 10.000 Follower" },
            { v: "engagement", label: "Basis Engagement" },
          ].map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setMethod(m.v as RateMethod)}
              className={`cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                method === m.v
                  ? "bg-[#4c00b2] text-white"
                  : "border border-[#2E3750] text-[#94A3B8] hover:bg-[#232A3D]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Hasil ===== */}
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <ResultCard label="Tier Kreator" value={tier} color={tierColor} />
        <ResultCard label="Tarif Minimum" value={result ? rupiah(result.low) : "—"} color="#22C55E" />
        <ResultCard label="Tarif Maksimum" value={result ? rupiah(result.high) : "—"} color="#3B82F6" />
        <ResultCard label="Engagement Rate" value={result ? result.engagementPct + "%" : "—"} color="#F59E0B" />
      </div>

      {/* ===== Rekomendasi detail ===== */}
      {result ? (
        <div className="shrink-0 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-white">Rekomendasi Tarif Sponsor</h3>
            <span className="rounded-full bg-[#4c00b2]/20 px-2 py-0.5 text-[11px] font-bold text-[#A78BFA]">
              {PLATFORM_LABEL[platform]}
            </span>
          </div>

          <div className="text-[13px] text-white/80">
            Dengan <b className="text-white">{f.toLocaleString("id-ID")}</b> follower & ER{" "}
            <b className="text-[#F59E0B]">{result.engagementPct}%</b>, tarif wajar untuk 1 konten sponsor berada di rentang:
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="text-[26px] font-bold leading-none text-white">{rupiahFull(result.low)}</div>
            <div className="text-[13px] text-[#64748B]">—</div>
            <div className="text-[26px] font-bold leading-none text-[#4c00b2]">{rupiahFull(result.high)}</div>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#232A3D]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#4c00b2]" style={{ width: "100%" }} />
          </div>

          <ul className="mt-3 list-inside list-disc space-y-1 text-[12px] text-[#94A3B8]">
            <li><b className="text-white/90">Nano/Micro (di bawah 50rb):</b> tarif Rp 50rb–300rb/konten ideal buat mulai & bangun portofolio.</li>
            <li>Bisa <b className="text-white/90">naikin 30–50%</b> kalau ER di atas 8% atau punya niche audio/gear yang langka.</li>
            <li>Jangan <b className="text-white/90">ratusan ribu</b> ke brand besar dulu — fokus deal kecil dulu biar akun dilirik.</li>
          </ul>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-8 text-center">
          <div className="text-[28px]">💵</div>
          <div className="text-[13px] text-white/60">Isi jumlah followers untuk mulai hitung.</div>
          <div className="text-[11px] text-[#64748B]">Data akun otomatis terisi dari Zernio kalau tersedia.</div>
        </div>
      )}

      {/* ===== Penjelasan metode ===== */}
      <div className="grid shrink-0 grid-cols-1 gap-2 lg:grid-cols-3">
        <MethodInfo
          title="Per 1.000 Follower"
          desc="Standar industri: Rp 10rb–20rb per 1.000 follower. Simpel & umum dipakai agency."
        />
        <MethodInfo
          title="Per 10.000 Follower"
          desc="Mirip CPM: Rp 150rb–300rb per 10rb follower. Cocok buat akun udah punya volume."
        />
        <MethodInfo
          title="Basis Engagement"
          desc="Fokus ke interaksi (likes+komentar). Makin tinggi ER, makin tinggi tarif. Paling akurat buat niche."
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-white/60">{label}</span>
      {children}
    </label>
  );
}

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
      <span className="text-[11px] text-[#64748B]">{label}</span>
      <span className="truncate text-[20px] font-bold leading-none" style={{ color }}>{value}</span>
    </div>
  );
}

function MethodInfo({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
      <div className="text-[12px] font-bold text-white">{title}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-[#64748B]">{desc}</div>
    </div>
  );
}
