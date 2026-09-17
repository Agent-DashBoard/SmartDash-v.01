"use client";

// components/integrations/integrations-content.tsx
// Halaman Integrations — tata letak kartu grid (referensi BangBay):
// tiap integrasi = kartu (logo asli + nama + deskripsi + tombol Settings/Details + toggle),
// kartu dibungkus dalam kotak container ber-border; hanya yang terdaftar yang tampil.
// Terhubung asli via Zernio: TikTok @bangbayaudio, YouTube @smart-dashboard.
// Pendaftaran lewat popup disimpan lokal (status "Menunggu") — backend OAuth menyusul.
// Jam + dot = pola PERSIS dashboard & Apps (translate-y-[1.5px], 15px, dot 18px #00FF2F).

import { useEffect, useMemo, useState } from "react";
import { useLiveData } from "../dashboard/live-data";

type Platform = {
  key: string;
  name: string;
  icon: string;
  group: string;
  desc: string;
};

// Struktur mengikuti referensi BangBay: SOCIAL 12 · COMMUNICATION 4 · ADS 5 · EMAIL 2
// icon = favicon/logo asli brand (public/icons/)
const PLATFORMS: Platform[] = [
  { key: "instagram", name: "Instagram", icon: "/icons/instagram.png", group: "SOCIAL", desc: "Integrate Instagram to track followers, posts, and engagement." },
  { key: "facebook", name: "Facebook", icon: "/icons/facebook.png", group: "SOCIAL", desc: "Integrate Facebook to manage pages and group activity." },
  { key: "linkedin", name: "LinkedIn", icon: "/icons/linkedin.png", group: "SOCIAL", desc: "Integrate LinkedIn to grow your professional network." },
  { key: "twitter-x", name: "Twitter/X", icon: "/icons/x.png", group: "SOCIAL", desc: "Integrate X to monitor trends and mentions in real time." },
  { key: "threads", name: "Threads", icon: "/icons/threads.png", group: "SOCIAL", desc: "Integrate Threads to join text conversations with your audience." },
  { key: "bluesky", name: "Bluesky", icon: "/icons/bluesky.png", group: "SOCIAL", desc: "Integrate Bluesky to expand your open social presence." },
  { key: "pinterest", name: "Pinterest", icon: "/icons/pinterest.png", group: "SOCIAL", desc: "Integrate Pinterest to organize ideas and visual content." },
  { key: "reddit", name: "Reddit", icon: "/icons/reddit.png", group: "SOCIAL", desc: "Integrate Reddit to engage communities and forums." },
  { key: "google-business", name: "Google Business", icon: "/icons/google-business.jpeg", group: "SOCIAL", desc: "Integrate Google Business to manage your local listing." },
  { key: "tiktok", name: "TikTok", icon: "/icons/tiktok.png", group: "SOCIAL", desc: "Integrate TikTok to monitor video performance and growth." },
  { key: "youtube", name: "YouTube", icon: "/icons/youtube.png", group: "SOCIAL", desc: "Integrate YouTube to track views, subscribers, and watch time." },
  { key: "snapchat", name: "Snapchat", icon: "/icons/snapchat.png", group: "SOCIAL", desc: "Integrate Snapchat to connect through photos and short videos." },
  { key: "telegram", name: "Telegram", icon: "/icons/telegram.png", group: "COMMUNICATION", desc: "Integrate Telegram to chat and broadcast to your channel." },
  { key: "discord", name: "Discord", icon: "/icons/discord.png", group: "COMMUNICATION", desc: "Integrate Discord to build community with voice and text." },
  { key: "slack", name: "Slack", icon: "/icons/slack.png", group: "COMMUNICATION", desc: "Integrate Slack to streamline team collaboration." },
  { key: "whatsapp", name: "WhatsApp", icon: "/icons/whatsapp.png", group: "COMMUNICATION", desc: "Integrate WhatsApp to manage chats and business messages." },
  { key: "meta-ads", name: "Meta Ads", icon: "/icons/meta.jpeg", group: "ADS", desc: "Integrate Meta Ads to manage ad campaigns on FB & IG." },
  { key: "linkedin-ads", name: "LinkedIn Ads", icon: "/icons/linkedin.png", group: "ADS", desc: "Integrate LinkedIn Ads to reach professional audiences." },
  { key: "pinterest-ads", name: "Pinterest Ads", icon: "/icons/pinterest.png", group: "ADS", desc: "Integrate Pinterest Ads to promote visual content." },
  { key: "tiktok-ads", name: "TikTok Ads", icon: "/icons/tiktok.png", group: "ADS", desc: "Integrate TikTok Ads to launch short-video campaigns." },
  { key: "google-ads", name: "Google Ads", icon: "/icons/google-ads.jpeg", group: "ADS", desc: "Integrate Google Ads to optimize search campaigns." },
  { key: "gmail", name: "Gmail", icon: "/icons/gmail.png", group: "EMAIL", desc: "Integrate Gmail to send, receive, and manage emails directly from your workspace." },
  { key: "outlook", name: "Outlook", icon: "/icons/outlook.jpeg", group: "EMAIL", desc: "Integrate Outlook to manage work emails and calendar." },
];

const GROUP_EMOJI: Record<string, string> = {
  SOCIAL: "📱",
  COMMUNICATION: "💬",
  ADS: "📢",
  EMAIL: "📧",
};

const GROUPS = ["SOCIAL", "COMMUNICATION", "ADS", "EMAIL"];

type PendingIntegration = {
  key: string;
  name: string;
  icon: string;
  clientId?: string;
  clientSecret?: string;
  baseUri?: string;
};

const LS_KEY = "smartdash-integrations-pending";

export function IntegrationsContent() {
  const live = useLiveData();


  // Modal + form (editKey != null = mode pengaturan, form terisi platform itu)
  const [showModal, setShowModal] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [form, setForm] = useState({ app: "", clientId: "", clientSecret: "", baseUri: "" });
  // Toast feedback (gantikan alert() bawaan browser)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  function showToast(ok: boolean, text: string) {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3000);
  }

  // Integrasi yang didaftarkan lewat popup (lokal, status "Menunggu")
  const [pending, setPending] = useState<PendingIntegration[]>([]);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPending(JSON.parse(raw));
    } catch {
      /* abaikan */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(pending));
    } catch {
      /* abaikan */
    }
  }, [pending]);

  // Terhubung asli dari Zernio
  const connectedKeys = useMemo(
    () => new Set<string>(live.accounts.map((a) => a.platform)),
    [live.accounts]
  );
  const acctName = (key: string) => {
    const a = live.accounts.find((x) => x.platform === key.toLowerCase());
    return a?.username ? `@${a.username}` : undefined;
  };

  // State toggle visual per platform (default ON untuk yang terdaftar)
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  // Inisialisasi default ON untuk integrasi yang terdaftar (sekali saat list berubah)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setToggles((prev) => {
      const next = { ...prev };
      connectedKeys.forEach((k) => {
        if (next[k] === undefined) next[k] = true;
      });
      pending.forEach((p) => {
        if (next[p.key] === undefined) next[p.key] = true;
      });
      return next;
    });
  }, [connectedKeys, pending]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isRegistered = (key: string) =>
    connectedKeys.has(key) || pending.some((p) => p.key === key);
  const isPending = (key: string) => pending.some((p) => p.key === key);
  const registeredCount = PLATFORMS.filter((p) => isRegistered(p.key)).length;

  const handleToggle = (key: string) => {
    // Kalau pending: toggle OFF = batalkan pendaftaran (tersimpan asli di localStorage)
    if (isPending(key) && toggles[key]) {
      setPending((prev) => prev.filter((p) => p.key !== key));
      return;
    }
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    const p = PLATFORMS.find((x) => x.key === form.app);
    if (!p) {
      showToast(false, "Pilih aplikasi dulu di kolom Select App 👆");
      return;
    }

    // Mode edit (Settings): simpan perubahan creds ke pendaftaran yang ada
    if (editKey) {
      setPending((prev) =>
        prev.map((x) =>
          x.key === editKey
            ? {
                ...x,
                clientId: form.clientId,
                clientSecret: form.clientSecret,
                baseUri: form.baseUri,
              }
            : x
        )
      );
      setShowModal(false);
      setEditKey(null);
      setForm({ app: "", clientId: "", clientSecret: "", baseUri: "" });
      return;
    }

    // Mode baru: cek duplikat dulu
    if (isRegistered(p.key)) {
      showToast(false, `${p.name} sudah terdaftar.`);
      setShowModal(false);
      setForm({ app: "", clientId: "", clientSecret: "", baseUri: "" });
      return;
    }
    setPending((prev) => [
      ...prev,
      {
        key: p.key,
        name: p.name,
        icon: p.icon,
        clientId: form.clientId,
        clientSecret: form.clientSecret,
        baseUri: form.baseUri,
      },
    ]);
    setShowModal(false);
    setForm({ app: "", clientId: "", clientSecret: "", baseUri: "" });
  };

  // Buka popup pengaturan (Settings) — form terisi platform + creds tersimpan
  const openSettings = (key: string) => {
    const pend = pending.find((x) => x.key === key);
    setEditKey(key);
    setForm({
      app: key,
      clientId: pend?.clientId ?? "",
      clientSecret: pend?.clientSecret ?? "",
      baseUri: pend?.baseUri ?? "",
    });
    setShowModal(true);
  };

  // Platform yang lagi dilihat Details (untuk popup detail)
  const detailPlatform = detailKey ? PLATFORMS.find((x) => x.key === detailKey) : undefined;
  const detailPending = detailKey ? pending.find((x) => x.key === detailKey) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">

        {/* Baris aksi — tombol Add New Integration (kanan), pola filter bar dashboard */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setEditKey(null);
              setForm({ app: "", clientId: "", clientSecret: "", baseUri: "" });
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-[8px] border border-[#2E3750] bg-[#1C222B] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#2A3347]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </span>
            Add New Integration
          </button>
        </div>

        {/* ===== Kotak pembungkus kartu — large container border tipis (referensi) ===== */}
        <div className="rounded-[10px] border border-[#2E3750] bg-[#0E1116] p-4">
          {registeredCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center">
              <span className="text-[28px] opacity-50">🔌</span>
              <p className="text-[13px] font-bold text-white/60">
                {live.loading ? "Memuat integrasi…" : "Belum ada integrasi"}
              </p>
              {!live.loading && (
                <p className="max-w-[320px] text-[11px] text-white/35">
                  Klik <span className="font-bold text-white/60">Add New Integration</span> untuk
                  mendaftarkan platform pertama
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {PLATFORMS.filter((p) => isRegistered(p.key)).map((p) => {
                const isPendingOne = isPending(p.key);
                const on = toggles[p.key] ?? false;

                return (
                  <div
                    key={p.key}
                    className={`flex min-h-[132px] flex-col rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4 transition-opacity ${
                      on ? "" : "opacity-45"
                    }`}
                  >
                    {/* Logo + nama */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#17182C]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- favicon 128px kecil, <img> lebih ringan dari next/image */}
                        <img src={p.icon} alt="" className="h-[22px] w-[22px] object-contain" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-[14px] font-bold text-white">{p.name}</p>
                        {isPendingOne && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#FBBF24]">
                            Menunggu verifikasi
                          </span>
                        )}
                        {connectedKeys.has(p.key) && acctName(p.key) && (
                          <span className="text-[9px] font-bold text-[#22C55E]">{acctName(p.key)}</span>
                        )}
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <p className="mt-2 flex-1 text-[11px] leading-relaxed text-white/50">{p.desc}</p>

                    {/* Baris bawah: Settings + Details (kiri) · Toggle (kanan) — referensi */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Settings — tombol bulat ikon gear */}
                        <button
                          type="button"
                          onClick={() => openSettings(p.key)}
                          title="Settings"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3A4560] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        </button>
                        {/* Details — tombol rounded dengan teks */}
                        <button
                          type="button"
                          onClick={() => setDetailKey(p.key)}
                          className="rounded-[8px] border border-[#3A4560] px-2.5 py-1 text-[11px] font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          Details
                        </button>
                      </div>

                      {/* Toggle — aktif = track oranye + knob putih (referensi) */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        onClick={() => handleToggle(p.key)}
                        title={on ? "Nonaktifkan" : "Aktifkan"}
                        className={`relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors ${
                          on ? "bg-[#F97316]" : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`absolute top-[2px] block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            on ? "translate-x-[18px]" : "translate-x-[2px]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* ===== Popup New Integration (referensi gambar ke-2) ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setShowModal(false);
            setEditKey(null);
          }}
        >
          <div
            className="w-full max-w-[460px] rounded-[12px] bg-[#1C222B] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-bold text-white">
                  {editKey
                    ? `${PLATFORMS.find((x) => x.key === editKey)?.name ?? "Integration"} Settings`
                    : "New Integration"}
                </h2>
                <p className="mt-0.5 text-[12px] text-white/50">
                  {editKey
                    ? "Update the credentials for this integration."
                    : "Set up an integration and add a brief explanation for the team."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditKey(null);
                  setForm({ app: "", clientId: "", clientSecret: "", baseUri: "" });
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Tutup"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="mt-4 flex flex-col gap-3.5">
              {/* Select App — dropdown berkelompok per kategori */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-white">Select App</label>
                <select
                  value={form.app}
                  onChange={(e) => setForm((f) => ({ ...f, app: e.target.value }))}
                  className="w-full rounded-[8px] border border-[#38BDF8]/50 bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none transition-colors focus:border-[#38BDF8]"
                >
                  <option value="">Select an option</option>
                  {GROUPS.map((g) => (
                    <optgroup key={g} label={`${GROUP_EMOJI[g]} ${g}`}>
                      {PLATFORMS.filter((p) => p.group === g).map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name} — {p.desc}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Client ID */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-white">Client ID</label>
                <input
                  type="text"
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  placeholder="Masukkan Client ID"
                  className="w-full rounded-[8px] border border-white/15 bg-[#0E1116] px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#38BDF8]"
                />
              </div>

              {/* Client Secret */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-white">Client Secret</label>
                <input
                  type="password"
                  value={form.clientSecret}
                  onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                  placeholder="••••••••••••"
                  className="w-full rounded-[8px] border border-white/15 bg-[#0E1116] px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#38BDF8]"
                />
              </div>

              {/* Authentication Base URI */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-white">
                  Authentication Base URI
                </label>
                <input
                  type="text"
                  value={form.baseUri}
                  onChange={(e) => setForm((f) => ({ ...f, baseUri: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-[8px] border border-white/15 bg-[#0E1116] px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#38BDF8]"
                />
                <p className="mt-1 text-[10px] leading-relaxed text-white/35">
                  Paste the full URI, and we&apos;ll automatically pull out and show only the
                  subdomain for quick reference.
                </p>
              </div>
            </div>

            {/* Tombol — warna sesuai referensi: Add/Save = biru-cyan, Close = ungu-abu */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditKey(null);
                  setForm({ app: "", clientId: "", clientSecret: "", baseUri: "" });
                }}
                className="rounded-[8px] bg-[#4A4356] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#5A5270]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-[8px] bg-[#38BDF8] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#7DD3FC]"
              >
                {editKey ? "Save Changes" : "Add Integration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Popup Details — info lengkap integrasi (referensi tombol Details) ===== */}
      {detailPlatform && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetailKey(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[12px] bg-[#1C222B] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: logo + nama + X */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#17182C]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- favicon kecil */}
                  <img src={detailPlatform.icon} alt="" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-white">{detailPlatform.name}</h2>
                  <p className="text-[11px] text-white/40">{detailPlatform.group}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailKey(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Tutup"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {connectedKeys.has(detailPlatform.key) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-1 text-[11px] font-bold text-[#22C55E]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  Terhubung {acctName(detailPlatform.key) ?? ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-2.5 py-1 text-[11px] font-bold text-[#FBBF24]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                  Menunggu verifikasi
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/60">
                {GROUP_EMOJI[detailPlatform.group]} {detailPlatform.group}
              </span>
            </div>

            {/* Deskripsi */}
            <p className="mt-4 text-[12px] leading-relaxed text-white/50">{detailPlatform.desc}</p>

            {/* Kredensial tersimpan (kalau didaftarkan via popup) */}
            {detailPending && (detailPending.clientId || detailPending.baseUri) && (
              <div className="mt-4 flex flex-col gap-2 rounded-[8px] border border-[#2E3750] bg-[#0E1116] p-3">
                {detailPending.clientId && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-white/40">Client ID</span>
                    <span className="truncate font-mono text-[11px] text-white/70">
                      {detailPending.clientId}
                    </span>
                  </div>
                )}
                {detailPending.baseUri && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-white/40">Base URI</span>
                    <span className="truncate font-mono text-[11px] text-white/70">
                      {detailPending.baseUri}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tombol: Settings + Close */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailKey(null)}
                className="rounded-[8px] bg-[#4A4356] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#5A5270]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailKey(null);
                  openSettings(detailPlatform.key);
                }}
                className="rounded-[8px] bg-[#38BDF8] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#7DD3FC]"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST — feedback pengganti alert() */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#10B981" : "#EF4444", color: "#fff",
          padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600,
          boxShadow: "0 6px 20px rgba(0,0,0,.4)", zIndex: 60,
        }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default IntegrationsContent;
