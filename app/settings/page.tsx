// app/settings/page.tsx — Settings: layout persis referensi BangBay (11-08-2026).
// Header: judul Settings + breadcrumb "Dashboard • Settings" + jam & dot (pola dashboard).
// Tab: Account (aktif) / Skill / Integrations / Bills.
// Account: 2 kartu atas (Personal Details + Change Password) + 1 kartu form bawah.
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// ---- Hook jam (pola sama dengan dashboard) ----
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

type SettingsTab = "account" | "skill" | "integrations" | "bills";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "skill", label: "Skill" },
  { key: "integrations", label: "Integrations" },
  { key: "bills", label: "Bills" },
];

// ---- Field input (konsisten: bg #0E1116, border #2E3750, focus biru) ----
function Field({
  label,
  type = "text",
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-white/60">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#38BDF8]/60"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("account");

  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="flex min-h-full flex-col bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-1 flex-col gap-3">
        {/* ===== HEADER: judul + breadcrumb (kiri) · jam + dot (kanan) ===== */}
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">
              Settings
            </h1>

            {/* Breadcrumb + jam + dot — SATU BARIS sejajar (gaya dashboard) */}
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#94A3B8]">
                <Link
                  href="/"
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Dashboard
                </Link>
                <span className="mx-1 text-white/30">•</span>
                <span className="text-white/60">Settings</span>
              </p>

              {/* Jam + dot — ukuran & gaya SAMA dengan dashboard */}
              <div className="flex shrink-0 items-center gap-[10px]">
                <span className="translate-y-[1.5px] text-[15px] font-bold leading-none tracking-[0.02em] text-white">
                  {time}
                </span>
                <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-20" />
                  <span className="relative inline-flex h-[18px] w-[18px] animate-pulse-dot rounded-full bg-[#00FF2F]" />
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ===== TAB NAV: Account / Skill / Integrations / Bills ===== */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`cursor-pointer whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                tab === t.key
                  ? "border-transparent bg-[#232A3D] text-white"
                  : "border-[#2E3750] bg-transparent text-white/70 hover:bg-[#232A3D]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== CONTENT ===== */}
        {tab === "account" ? (
          <>
            {/* ---- GRID ATAS: kiri Personal Details (avatar) · kanan Change Password ---- */}
            <div className="flex flex-col gap-3 lg:flex-row">
              {/* Kartu kiri: Profile Picture */}
              <section className="flex flex-col gap-3 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4 lg:w-[300px] lg:shrink-0">
                <div>
                  <h2 className="text-[15px] font-bold text-white">Personal Details</h2>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    Change your profile picture from here
                  </p>
                </div>

                <div className="flex items-center justify-center py-4">
                  <span className="relative flex h-28 w-28 overflow-hidden rounded-full border border-[#2E3750]">
                    <Image
                      src="/icons/Agent.png"
                      alt="Profile"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#232A3D] px-4 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#2E3750]"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-[8px] border border-[#2E3750] bg-transparent px-4 py-1.5 text-[11px] font-bold text-white/70 transition-colors hover:bg-[#232A3D]"
                  >
                    Reset
                  </button>
                </div>
              </section>

              {/* Kartu kanan: Change Password */}
              <section className="flex flex-1 flex-col gap-4 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
                <div>
                  <h2 className="text-[15px] font-bold text-white">Change Password</h2>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    To change your password please confirm here
                  </p>
                </div>
                <Field label="Current Password" type="password" placeholder="••••••••" />
                <Field label="New Password" type="password" placeholder="••••••••" />
                <Field label="Confirm Password" type="password" placeholder="••••••••" />
              </section>
            </div>

            {/* ---- KARTU BAWAH: Personal Details form 2 kolom ---- */}
            <section className="flex flex-col gap-4 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
              <div>
                <h2 className="text-[15px] font-bold text-white">Personal Details</h2>
                <p className="mt-0.5 text-[11px] text-white/40">
                  To change your personal detail, edit and save from here
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Kolom 1 */}
                  <div className="flex flex-col gap-3">
                    <Field label="First Name" placeholder="First name" />
                    <Field label="Email" type="email" placeholder="you@example.com" />
                  </div>

                  {/* Kolom 2 */}
                  <div className="flex flex-col gap-3">
                    <Field label="Last Name" placeholder="Last name" />
                    <Field label="Phone" placeholder="+62 812 3456 7890" />
                  </div>
                </div>

                {/* Bio — full-width di bawah grid (sesuai referensi) */}
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-white/60">Bio</span>
                  <textarea
                    rows={4}
                    placeholder="Tell something about yourself"
                    className="w-full resize-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#38BDF8]/60"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border border-[#2E3750] bg-transparent px-4 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#232A3D]"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border border-[#2E3750] bg-transparent px-4 py-1.5 text-[11px] font-bold text-white/70 transition-colors hover:bg-[#232A3D]"
                >
                  Cancel
                </button>
              </div>
            </section>
          </>
        ) : (
          /* ---- Tab lain: placeholder jujur ---- */
          <section className="flex flex-1 items-center justify-center rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
            <p className="text-center text-[12px] text-[#64748B]">
              Fitur <span className="font-bold text-white/70">{TABS.find((t) => t.key === tab)?.label}</span>{" "}
              sedang disiapkan.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
