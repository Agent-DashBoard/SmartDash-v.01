// app/settings/page.tsx — Settings: layout persis referensi BangBay (11-08-2026).
// Header: judul Settings + breadcrumb "Dashboard • Settings" + jam & dot (pola dashboard).
// Tab: Account (aktif) / Skill / Integrations / Bills.
// Account: 2 kartu atas (Personal Details + Change Password) + 1 kartu form bawah.
// REV: Full-viewport, no scroll — kartu bawah & textarea Bio pakai flex-1 min-h-0
// supaya otomatis mengisi SISA tinggi layar, bukan tinggi fixed yang bisa kepotong.
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SkillsWorkspace } from "@/components/settings/SkillsWorkspace";
import IntegrationsContent from "@/components/integrations/integrations-content";

// ---- Hook jam
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
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-white/60">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#38BDF8]/60"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("account");

  // Form Personal Details — di-muat dari localStorage, disimpan saat Save
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [passCurrent, setPassCurrent] = useState("");
  const [passNew, setPassNew] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Muat data tersimpan saat mount (client-only, pakai try/catch)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("smartdash-settings");
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.firstName === "string") setFirstName(d.firstName);
        if (typeof d.lastName === "string") setLastName(d.lastName);
        if (typeof d.email === "string") setEmail(d.email);
        if (typeof d.phone === "string") setPhone(d.phone);
        if (typeof d.bio === "string") setBio(d.bio);
        if (typeof d.savedAt === "string") setSavedAt(d.savedAt);
      }
    } catch {}
    setHydrated(true);
  }, []);

  function handleSave() {
    // Validasi email sederhana
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSaveMsg({ ok: false, text: "Format email tidak valid." });
      return;
    }
    // Validasi password: kalau ada isi, wajib cocok & min 6
    if (passNew || passCurrent || passConfirm) {
      if (!passCurrent) {
        setSaveMsg({ ok: false, text: "Current Password wajib diisi untuk ganti password." });
        return;
      }
      if (passNew.length < 6) {
        setSaveMsg({ ok: false, text: "Password baru minimal 6 karakter." });
        return;
      }
      if (passNew !== passConfirm) {
        setSaveMsg({ ok: false, text: "Konfirmasi password tidak cocok." });
        return;
      }
    }
    // Simpan ke localStorage
    const data = {
      firstName, lastName, email, phone, bio,
      savedAt: new Date().toLocaleString("id-ID"),
    };
    try {
      window.localStorage.setItem("smartdash-settings", JSON.stringify(data));
      setSavedAt(data.savedAt);
      setSaveMsg({ ok: true, text: "✓ Profil tersimpan" });
      setPassCurrent(""); setPassNew(""); setPassConfirm("");
    } catch {
      setSaveMsg({ ok: false, text: "Gagal menyimpan (localStorage penuh?)" });
    }
    // Hilangkan pesan setelah 3 detik
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function handleCancel() {
    // Reset form ke nilai tersimpan
    try {
      const raw = window.localStorage.getItem("smartdash-settings");
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.firstName === "string") setFirstName(d.firstName);
        if (typeof d.lastName === "string") setLastName(d.lastName);
        if (typeof d.email === "string") setEmail(d.email);
        if (typeof d.phone === "string") setPhone(d.phone);
        if (typeof d.bio === "string") setBio(d.bio);
      }
    } catch {}
    setSaveMsg({ ok: true, text: "Perubahan dibatalkan." });
    setTimeout(() => setSaveMsg(null), 2000);
  }

  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-1 min-h-0 flex-col gap-2">
        {/* ===== HEADER: judul + breadcrumb (kiri) · jam + dot (kanan) ===== */}
        <header className="flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(20px,2.6vw,30px)] font-bold leading-[1.15] text-white">
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
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
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

        {/* ===== CONTENT (mengisi SISA tinggi layar) ===== */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {tab === "account" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {/* ---- GRID ATAS: kiri Personal Details (avatar) · kanan Change Password ---- */}
              {/* shrink-0 = tinggi tetap, TIDAK ikut mengecil */}
              <div className="flex shrink-0 flex-col gap-2 lg:flex-row">
                {/* Kartu kiri: Profile Picture */}
                <section className="flex flex-col gap-2 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3 lg:w-[280px] lg:shrink-0">
                  <div>
                    <h2 className="text-[14px] font-bold text-white">Personal Details</h2>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      Change your profile picture from here
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <span className="relative flex h-20 w-20 overflow-hidden rounded-full border border-[#2E3750]">
                      <Image
                        src="/icons/Agent.png"
                        alt="Profile"
                        fill
                        sizes="80px"
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
                <section className="flex flex-1 flex-col justify-center gap-2 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
                  <div>
                    <h2 className="text-[14px] font-bold text-white">Change Password</h2>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      To change your password please confirm here
                    </p>
                  </div>
                  <Field label="Current Password" type="password" placeholder="••••••••" value={passCurrent} onChange={setPassCurrent} />
                                    <Field label="New Password" type="password" placeholder="••••••••" value={passNew} onChange={setPassNew} />
                                    <Field label="Confirm Password" type="password" placeholder="••••••••" value={passConfirm} onChange={setPassConfirm} />
                </section>
              </div>

              {/* ---- KARTU BAWAH: Personal Details form 2 kolom ---- */}
              {/* flex-1 min-h-0 = MENGISI SISA tinggi layar, bukan tinggi fixed */}
              <section className="flex min-h-0 flex-1 flex-col gap-2 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
                <div className="shrink-0">
                  <h2 className="text-[14px] font-bold text-white">Personal Details</h2>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    To change your personal detail, edit and save from here
                  </p>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <div className="grid shrink-0 gap-2 md:grid-cols-2">
                    {/* Kolom 1 */}
                    <div className="flex flex-col gap-2">
                                          <Field label="First Name" placeholder="First name" value={firstName} onChange={setFirstName} />
                                          <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
                                        </div>

                                        {/* Kolom 2 */}
                                        <div className="flex flex-col gap-2">
                                          <Field label="Last Name" placeholder="Last name" value={lastName} onChange={setLastName} />
                                          <Field label="Phone" placeholder="+62 812 3456 7890" value={phone} onChange={setPhone} />
                                        </div>
                  </div>

                  {/* Bio + Save/Cancel horizontal kanan bawah — Bio mengisi SISA tinggi */}
                  <div className="flex min-h-0 flex-1 items-end gap-3">
                    <label className="flex h-full min-w-0 flex-1 flex-col">
                                          <span className="mb-1 flex shrink-0 items-center gap-2 text-[11px] font-semibold text-white/60">
                                            Bio
                                            {saveMsg ? (
                                              <span className={`text-[10px] font-normal ${saveMsg.ok ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                                                {saveMsg.text}
                                              </span>
                                            ) : savedAt && hydrated ? (
                                              <span className="text-[10px] font-normal text-[#64748B]">· Tersimpan {savedAt}</span>
                                            ) : null}
                                          </span>
                      <textarea
                                              placeholder="Tell something about yourself"
                                              value={bio}
                                              onChange={(e) => setBio(e.target.value)}
                                              className="w-full flex-1 resize-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#38BDF8]/60"
                                            />
                    </label>
                    <div className="flex shrink-0 items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={handleSave}
                                            className="cursor-pointer rounded-[10px] border border-white/25 bg-[#1C222B] px-4 py-1.5 text-[14px] font-bold text-[#9BA3B0] transition-colors hover:bg-[#1C222B]/80"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="cursor-pointer rounded-[10px] border border-white/25 bg-[#1C222B] px-4 py-1.5 text-[14px] font-bold text-[#9BA3B0] transition-colors hover:bg-[#1C222B]/80"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                  </div>
                </div>
              </section>
            </div>
          ) : tab === "skill" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <SkillsWorkspace />
            </div>
          ) : tab === "integrations" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <IntegrationsContent />
            </div>
          ) : (
            /* ---- Tab lain: placeholder jujur ---- */
            <section className="flex min-h-0 flex-1 items-center justify-center rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
              <p className="text-center text-[12px] text-[#64748B]">
                Fitur <span className="font-bold text-white/70">{TABS.find((t) => t.key === tab)?.label}</span>{" "}
                sedang disiapkan.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}