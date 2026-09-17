// components/settings/SkillsWorkspace.tsx
// CLONE IDENTIK tab Skill dari app/apps/page.tsx (baris 59-1540 + modals 1550-1871)
// 3 kartu: Personality · Skill · Memories + workspace + modals
"use client";

import { useState } from "react";

// ===== Types =====
type SkillItem = {
  name: string;
  desc: string;
  on: boolean;
  cat: string;
};

type MemoryItem = {
  text: string;
  on: boolean;
};

type SkillPanel = "personality" | "skill" | "memories" | null;

// ===== Data awal =====
const INITIAL_SKILLS: SkillItem[] = [
  { name: "creative", desc: "Konten kreatif: gambar, video, desain", on: true, cat: "Bawaan" },
  { name: "email", desc: "Kirim & baca email dari terminal", on: true, cat: "Bawaan" },
  { name: "github", desc: "Kelola repo & PR via gh CLI", on: true, cat: "Bawaan" },
  { name: "media", desc: "Transkrip YouTube, audio, GIF", on: true, cat: "Bawaan" },
  { name: "note-taking", desc: "Catatan & riset multi-sesi", on: false, cat: "Bawaan" },
  { name: "productivity", desc: "Dokumen, slide, spreadsheet", on: false, cat: "Bawaan" },
  { name: "research", desc: "Cari paper & riset pasar", on: false, cat: "Bawaan" },
  { name: "Resep konten TikTok viral", desc: "Formula hook 2 detik + pacing + CTA", on: true, cat: "Milikmu" },
  { name: "Analisa data YouTube", desc: "Cara baca retention & pilih judul", on: true, cat: "Milikmu" },
];

const INITIAL_MEMORIES: MemoryItem[] = [
  { text: "Nama user: Bayu (sapaan akrab). Berbahasa Indonesia.", on: true },
  { text: "Deadline konten TikTok tiap Jumat malam.", on: true },
];

// ===== Kategori skill =====
type SkillCatGroup = { group: string; options: { value: string; label: string }[] };

const SKILL_CATEGORIES: SkillCatGroup[] = [
  {
    group: "SOCIAL",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "facebook", label: "Facebook" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "twitter-x", label: "Twitter/X" },
      { value: "threads", label: "Threads" },
      { value: "bluesky", label: "Bluesky" },
      { value: "pinterest", label: "Pinterest" },
      { value: "reddit", label: "Reddit" },
      { value: "google-business", label: "Google Business" },
      { value: "tiktok", label: "TikTok" },
      { value: "youtube", label: "YouTube" },
      { value: "snapchat", label: "Snapchat" },
    ],
  },
  {
    group: "COMMUNICATION",
    options: [
      { value: "telegram", label: "Telegram" },
      { value: "discord", label: "Discord" },
      { value: "slack", label: "Slack" },
      { value: "whatsapp", label: "WhatsApp" },
    ],
  },
  {
    group: "ADS",
    options: [
      { value: "meta-ads", label: "Meta Ads" },
      { value: "linkedin-ads", label: "LinkedIn Ads" },
      { value: "pinterest-ads", label: "Pinterest Ads" },
      { value: "tiktok-ads", label: "TikTok Ads" },
      { value: "google-ads", label: "Google Ads" },
    ],
  },
  {
    group: "EMAIL",
    options: [
      { value: "gmail", label: "Gmail" },
      { value: "outlook", label: "Outlook" },
    ],
  },
  {
    group: "UMUM (kategori bawaan Hermes)",
    options: [
      { value: "creative", label: "creative" },
      { value: "productivity", label: "productivity" },
      { value: "research", label: "research" },
      { value: "media", label: "media" },
      { value: "email", label: "email" },
      { value: "github", label: "github" },
      { value: "note-taking", label: "note-taking" },
    ],
  },
];

const SOUL_CONTENT = `# SOUL.md — Kepribadian SmartDash AI

Namamu adalah SmartDash — asisten AI pribadi platform SmartDash,
dashboard creator konten all-in-one (TikTok · YouTube · Instagram · WhatsApp).

## Identitas
- Kamu adalah SmartDash, asisten AI dari platform SmartDash.
- Kalau ditanya nama → jawab "SmartDash".
- JANGAN PERNAH menyebut Hermes/DeepSeek/OpenAI/Claude ke user.
- Bahasa Indonesia, ramah & santai.

## Aturan
- Jawab singkat & jelas.
- Jangan menjanjikan fitur yang belum tersedia.`;

// ===== Komponen =====
export function SkillsWorkspace() {
  const [skillPanel, setSkillPanel] = useState<SkillPanel>(null);
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [skillModal, setSkillModal] = useState<"addSkill" | "editSoul" | "addMemory" | "editSkill" | "editMemory" | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCat, setNewSkillCat] = useState("creative");
  const [newSkillBody, setNewSkillBody] = useState("");
  const [editSoulText, setEditSoulText] = useState(SOUL_CONTENT);
  const [newMemoryText, setNewMemoryText] = useState("");
  const [editSkillIndex, setEditSkillIndex] = useState<number | null>(null);
  const [editMemoryIndex, setEditMemoryIndex] = useState<number | null>(null);

  return (
    <>
      {/* ===== Tab Skill — 3 kartu (Personality · Skill · Memories) + workspace ===== */}
      <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {/* 3 kartu — tetap di atas, konten muncul di workspace bawah */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Kartu Personality */}
          <div
            className={`flex flex-col rounded-xl bg-[#1C222B] p-5 transition-colors ${
              skillPanel === "personality"
                ? "bg-[#F97316]/10"
                : "hover:bg-[#2A3347]"
            }`}
          >
            <h3 className="text-[17px] font-bold text-white">Personality</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#94A3B8]">
              Kepribadian SmartDash: cara dia bicara, gaya, dan aturan main. Edit kalau mau dia berubah karakter.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full border border-[#2E3750] bg-[#2A3347] px-3 py-1 text-[12px] text-[#E2E8F0]">1 kepribadian</span>
              <button
                type="button"
                onClick={() => setSkillPanel("personality")}
                className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
              >
                Kelola
              </button>
            </div>
          </div>

          {/* Kartu Skill */}
          <div
            className={`flex flex-col rounded-xl bg-[#1C222B] p-5 transition-colors ${
              skillPanel === "skill"
                ? "bg-[#F97316]/10"
                : "hover:bg-[#2A3347]"
            }`}
          >
            <h3 className="text-[17px] font-bold text-white">Skill</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#94A3B8]">
              Keahlian yang bisa diajarkan ke SmartDash. Tambah file keahlian baru, atau aktif/nonaktifkan yang ada.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full border border-[#2E3750] bg-[#2A3347] px-3 py-1 text-[12px] text-[#E2E8F0]">{skills.length} keahlian</span>
              <button
                type="button"
                onClick={() => setSkillPanel("skill")}
                className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
              >
                Kelola
              </button>
            </div>
          </div>

          {/* Kartu Memories */}
          <div
            className={`flex flex-col rounded-xl bg-[#1C222B] p-5 transition-colors ${
              skillPanel === "memories"
                ? "bg-[#F97316]/10"
                : "hover:bg-[#2A3347]"
            }`}
          >
            <h3 className="text-[17px] font-bold text-white">Memories</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#94A3B8]">
              Catatan yang SmartDash inget terus: preferensi, fakta, hal penting. Tinggal tulis, dia hafal.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full border border-[#2E3750] bg-[#2A3347] px-3 py-1 text-[12px] text-[#E2E8F0]">{memories.length} catatan</span>
              <button
                type="button"
                onClick={() => setSkillPanel("memories")}
                className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
              >
                Kelola
              </button>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[14px] text-[#E2E8F0]">
          Atur kepintaran SmartDash kamu: tambah keahlian (otak), ubah kepribadian (jiwa), dan isi catatan (ingatan).
        </p>

        {/* Workspace — konten muncul di sini saat kartu diklik */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#2E3750] bg-[#1C222B] p-5">
          {skillPanel === null && (
            <div className="flex h-full min-h-[280px] items-center justify-center text-[14px] text-[#64748B]">
              Pilih salah satu kartu di atas untuk mulai mengelola
            </div>
          )}

          {skillPanel === "personality" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[16px] font-bold text-white">💜 Personality — Kepribadian SmartDash</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSkillPanel(null)}
                    className="rounded-lg border border-[#2E3750] px-3 py-1.5 text-[13px] text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillModal("editSoul")}
                    className="rounded-lg bg-[#F97316] px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                  >
                    ✏️ Edit jiwa
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-[#2E3750] bg-[#161B29] p-4 font-mono text-[12.5px] leading-relaxed text-[#A5F3FC]">
                {SOUL_CONTENT}
              </pre>
              <p className="mt-3 text-[12px] italic text-[#64748B]">
                Ini isi kepribadian (SOUL.md) sekarang. Kalau diubah, SmartDash langsung berubah karakter di semua chat.
              </p>
            </div>
          )}

          {skillPanel === "skill" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[16px] font-bold text-white">🧠 Skill — Daftar Keahlian</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSkillPanel(null)}
                    className="rounded-lg border border-[#2E3750] px-3 py-1.5 text-[13px] text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillModal("addSkill")}
                    className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-[13px] font-bold text-[#052E12] transition-colors hover:brightness-110"
                  >
                    + Tambah keahlian
                  </button>
                </div>
              </div>
              <div className="space-y-2.5">
                {skills.map((s, i) => (
                  <div
                    key={s.name + i}
                    onClick={() => {
                      setEditSkillIndex(i);
                      setNewSkillName(s.name);
                      const knownCats = SKILL_CATEGORIES.flatMap((g) =>
                        g.options.map((o) => o.value)
                      );
                      setNewSkillCat(knownCats.includes(s.cat) ? s.cat : "custom");
                      setNewSkillBody(s.desc);
                      setSkillModal("editSkill");
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-[#2E3750] bg-[#232A3D] px-4 py-3 transition-colors hover:border-[#F97316]/60 hover:bg-[#2A3347]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
                        {s.name}
                        <span className="text-[11px] font-normal text-[#F97316]">✏️ klik untuk edit</span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#94A3B8]">{s.cat} · {s.desc}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label
                        className="relative inline-flex h-[22px] w-[40px] cursor-pointer items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={s.on}
                          onChange={() =>
                            setSkills((prev) =>
                              prev.map((x, xi) => (xi === i ? { ...x, on: !x.on } : x))
                            )
                          }
                        />
                        <span className="absolute inset-0 rounded-full bg-[#3B4A68] transition-colors peer-checked:bg-[#22C55E]" />
                        <span className="absolute left-[3px] top-[3px] h-[16px] w-[16px] rounded-full bg-[#94A3B8] transition-transform peer-checked:translate-x-[18px] peer-checked:bg-white" />
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSkills((prev) => prev.filter((_, xi) => xi !== i));
                        }}
                        className="rounded-md border border-[#EF4444] px-2.5 py-1 text-[12px] text-[#EF4444] transition-colors hover:bg-[#EF4444] hover:text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] italic text-[#64748B]">
                Data contoh — di versi asli, daftar diambil dari folder skills/ Hermes. Keahlian custom (mis. &quot;Resep konten TikTok viral&quot;) muncul di sini.
              </p>
            </div>
          )}

          {skillPanel === "memories" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[16px] font-bold text-white">📝 Memories — Catatan SmartDash</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSkillPanel(null)}
                    className="rounded-lg border border-[#2E3750] px-3 py-1.5 text-[13px] text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillModal("addMemory")}
                    className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-[13px] font-bold text-[#052E12] transition-colors hover:brightness-110"
                  >
                    + Tambah catatan
                  </button>
                </div>
              </div>
              <div className="space-y-2.5">
                {memories.map((m, i) => (
                  <div
                    key={m.text + i}
                    onClick={() => {
                      setEditMemoryIndex(i);
                      setNewMemoryText(m.text);
                      setSkillModal("editMemory");
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-[#2E3750] bg-[#232A3D] px-4 py-3 transition-colors hover:border-[#F97316]/60 hover:bg-[#2A3347]"
                  >
                    <div className="flex min-w-0 items-center gap-2 text-[14px] text-[#E2E8F0]">
                      <span>{m.text}</span>
                      <span className="shrink-0 text-[11px] text-[#F97316]">✏️ klik untuk edit</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label
                        className="relative inline-flex h-[22px] w-[40px] cursor-pointer items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={m.on}
                          onChange={() =>
                            setMemories((prev) =>
                              prev.map((x, xi) => (xi === i ? { ...x, on: !x.on } : x))
                            )
                          }
                        />
                        <span className="absolute inset-0 rounded-full bg-[#3B4A68] transition-colors peer-checked:bg-[#22C55E]" />
                        <span className="absolute left-[3px] top-[3px] h-[16px] w-[16px] rounded-full bg-[#94A3B8] transition-transform peer-checked:translate-x-[18px] peer-checked:bg-white" />
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemories((prev) => prev.filter((_, xi) => xi !== i));
                        }}
                        className="rounded-md border border-[#EF4444] px-2.5 py-1 text-[12px] text-[#EF4444] transition-colors hover:bg-[#EF4444] hover:text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] italic text-[#64748B]">
                Setiap catatan = fakta yang selalu diingat SmartDash. Misal: &quot;User suka bahasa santai&quot;, &quot;Deadline konten tiap Jumat&quot;.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== Modal Skill — Tambah Keahlian / Edit Jiwa / Tambah Catatan ===== */}
      {skillModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSkillModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {skillModal === "addSkill" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">➕ Keahlian baru</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup tambah skill"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Nama keahlian</label>
                    <input
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="cth: Resep konten TikTok viral"
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Kategori</label>
                    <select
                      value={newSkillCat}
                      onChange={(e) => setNewSkillCat(e.target.value)}
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none focus:border-[#F97316]"
                    >
                      {SKILL_CATEGORIES.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="custom">custom (milik sendiri)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi keahlian (cara / langkah / contoh)</label>
                    <textarea
                      value={newSkillBody}
                      onChange={(e) => setNewSkillBody(e.target.value)}
                      placeholder={"# Resep konten TikTok viral\n\n1. Hook 2 detik pertama...\n2. ..."}
                      className="min-h-[120px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 font-mono text-[12.5px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = newSkillName.trim();
                        if (!name) return;
                        const cat = newSkillCat === "custom" ? "Milikmu" : newSkillCat;
                        setSkills((prev) => [...prev, { name, desc: "Keahlian baru (contoh)", on: true, cat }]);
                        setNewSkillName("");
                        setNewSkillBody("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan keahlian
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "editSoul" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">💜 Edit kepribadian</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup edit jiwa"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi SOUL.md (kepribadian &amp; aturan main)</label>
                    <textarea
                      value={editSoulText}
                      onChange={(e) => setEditSoulText(e.target.value)}
                      className="min-h-[220px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 font-mono text-[12.5px] leading-relaxed text-[#A5F3FC] outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan jiwa
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "addMemory" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">📝 Catatan ingatan baru</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup tambah catatan"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi catatan</label>
                    <textarea
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder="cth: User suka dibalas singkat & santai"
                      className="min-h-[100px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = newMemoryText.trim();
                        if (!text) return;
                        setMemories((prev) => [...prev, { text, on: true }]);
                        setNewMemoryText("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan catatan
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "editSkill" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">✏️ Edit keahlian</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup edit skill"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Nama keahlian</label>
                    <input
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="cth: Resep konten TikTok viral"
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Kategori</label>
                    <select
                      value={newSkillCat}
                      onChange={(e) => setNewSkillCat(e.target.value)}
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none focus:border-[#F97316]"
                    >
                      {SKILL_CATEGORIES.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="custom">custom (milik sendiri)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi keahlian (cara / langkah / contoh)</label>
                    <textarea
                      value={newSkillBody}
                      onChange={(e) => setNewSkillBody(e.target.value)}
                      placeholder={"# Resep konten TikTok viral\n\n1. Hook 2 detik pertama...\n2. ..."}
                      className="min-h-[120px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 font-mono text-[12.5px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editSkillIndex === null) return;
                        const name = newSkillName.trim();
                        if (!name) return;
                        const cat = newSkillCat === "custom" ? "Milikmu" : newSkillCat;
                        setSkills((prev) =>
                          prev.map((x, xi) =>
                            xi === editSkillIndex
                              ? { ...x, name, cat, desc: newSkillBody.trim() }
                              : x
                          )
                        );
                        setEditSkillIndex(null);
                        setNewSkillName("");
                        setNewSkillBody("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan perubahan
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "editMemory" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">✏️ Edit catatan</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup edit catatan"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi catatan</label>
                    <textarea
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder="cth: User suka dibalas singkat & santai"
                      className="min-h-[100px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editMemoryIndex === null) return;
                        const text = newMemoryText.trim();
                        if (!text) return;
                        setMemories((prev) =>
                          prev.map((x, xi) => (xi === editMemoryIndex ? { ...x, text } : x))
                        );
                        setEditMemoryIndex(null);
                        setNewMemoryText("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan perubahan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}