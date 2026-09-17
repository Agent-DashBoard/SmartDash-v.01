"use client";

// components/workspaces/RevenueWorkspace.tsx
// Revenue Tracker — catat penghasilan per konten (afiliasi/sponsor/product).
// Fase 2: simpan di localStorage dulu. Fase 3 nanti dipindah ke Supabase.
// Pola & gaya: konsisten dengan NotesWorkspace/CalendarWorkspace.

import { useEffect, useMemo, useState } from "react";

// ===== Types =====
type RevenueType = "afiliasi" | "sponsor" | "product" | "lain";
type PaymentStatus = "lunas" | "belum";
type RevenueEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  platform: string; // tiktok / youtube / dll
  type: RevenueType;
  subcategory: string; // sumber: Shopee / Tokopedia / dll
  status: PaymentStatus; // lunas / belum
  title: string; // nama konten/produk
  amount: number; // nominal (Rupiah)
  note?: string;
};

const LS_KEY = "smartdash-revenue";

const TYPE_META: Record<RevenueType, { label: string; color: string }> = {
  afiliasi: { label: "Afiliasi", color: "#22C55E" },
  sponsor: { label: "Sponsor", color: "#3B82F6" },
  product: { label: "Produk", color: "#8B5CF6" },
  lain: { label: "Lainnya", color: "#94A3B8" },
};

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  lain: "Lainnya",
};

// ===== Sub-kategori sumber duit (opsional, muncul kalau afiliasi/sponsor) =====
const SUBCATEGORY_OPTIONS: Record<RevenueType, string[]> = {
  afiliasi: ["Shopee", "Tokopedia", "Amazon", "Lazada", "Lainnya"],
  sponsor: ["Brand Audio", "Brand HP", "Brand Gaming", "Brand F&B", "Lainnya"],
  product: ["Preset Audio", "E-book", "Kursus", "Template", "Lainnya"],
  lain: [],
};

const STATUS_META: Record<PaymentStatus, { label: string; color: string }> = {
  lunas: { label: "Lunas", color: "#22C55E" },
  belum: { label: "Belum", color: "#F59E0B" },
};

// Talang supaya type JSX gampang
const TYPE_KEYS: RevenueType[] = ["afiliasi", "sponsor", "product", "lain"];

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "lunas", label: "Lunas" },
  { value: "belum", label: "Belum Cair" },
];

// Monthly target (disimpan terpisah dari entries)
const LS_TARGET_KEY = "smartdash-revenue-target";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  platform: "tiktok",
  type: "afiliasi" as RevenueType,
  subcategory: "",
  status: "belum" as PaymentStatus,
  title: "",
  amount: "",
  note: "",
};

const rupiah = (n: number) =>
  "Rp" + n.toLocaleString("id-ID");

export function RevenueWorkspace() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Filter
  const [month, setMonth] = useState(""); // "" = semua, else "YYYY-MM"
  const [filterType, setFilterType] = useState<RevenueType | "all">("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "all">("all");

  // Monthly target
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [targetEdit, setTargetEdit] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Muat dari localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
    try {
      const raw = window.localStorage.getItem(LS_TARGET_KEY);
      if (raw) {
        setMonthlyTarget(raw);
        setTargetInput(raw);
      }
    } catch {}
    setHydrated(true);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function saveEntries(next: RevenueEntry[]) {
    setEntries(next);
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  }

  // Tambah / update
  function handleSubmit() {
    const amount = Number(form.amount);
    if (!form.title.trim()) return setErr("Nama konten/produk wajib diisi");
    if (!form.date) return setErr("Tanggal wajib diisi");
    if (!amount || isNaN(amount) || amount <= 0)
      return setErr("Nominal wajib diisi & lebih dari 0");

    if (editId) {
      saveEntries(
        entries.map((e) =>
          e.id === editId
            ? { ...e, date: form.date, platform: form.platform, type: form.type, subcategory: form.subcategory, status: form.status, title: form.title.trim(), amount, note: form.note.trim() }
            : e
        )
      );
      showToast("✓ Pendapatan diperbarui");
    } else {
      const entry: RevenueEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        date: form.date,
        platform: form.platform,
        type: form.type,
        subcategory: form.subcategory,
        status: form.status,
        title: form.title.trim(),
        amount,
        note: form.note.trim(),
      };
      saveEntries([...entries, entry]);
      showToast("✓ Pendapatan ditambahkan");
    }
    setFormOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setErr("");
  }

  function handleDelete(id: string) {
    saveEntries(entries.filter((e) => e.id !== id));
    showToast("Pendapatan dihapus");
  }

  function openEdit(e: RevenueEntry) {
    setEditId(e.id);
    setForm({
      date: e.date,
      platform: e.platform,
      type: e.type,
      subcategory: e.subcategory ?? "",
      status: e.status ?? "belum",
      title: e.title,
      amount: String(e.amount),
      note: e.note ?? "",
    });
    setErr("");
    setFormOpen(true);
  }

  // Filter & ringkasan
  const filtered = useMemo(() => {
    return entries
      .filter((e) => (month ? e.date.startsWith(month) : true))
      .filter((e) => (filterType === "all" ? true : e.type === filterType))
      .filter((e) => (filterPlatform === "all" ? true : e.platform === filterPlatform))
      .filter((e) => (filterStatus === "all" ? true : e.status === filterStatus))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [entries, month, filterType, filterPlatform, filterStatus]);

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const totalAll = entries.reduce((s, e) => s + e.amount, 0);
  const totalUnpaid = entries.filter((e) => e.status === "belum").reduce((s, e) => s + e.amount, 0);

  // Total per jenis (semua data, buat summary cards)
  const byType = useMemo(() => {
    const m: Record<string, number> = { afiliasi: 0, sponsor: 0, product: 0, lain: 0 };
    for (const e of entries) m[e.type] += e.amount;
    return m;
  }, [entries]);

  // Daftar bulan yang ada (untuk filter dropdown)
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(e.date.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [entries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* ===== 6 Kartu Ringkasan ===== */}
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-6">
        <SummaryCard label="Total Pendapatan" value={totalAll} color="#22C55E" />
        <SummaryCard label="Afiliasi" value={byType.afiliasi} color="#22C55E" />
        <SummaryCard label="Sponsor" value={byType.sponsor} color="#3B82F6" />
        <SummaryCard label="Produk" value={byType.product} color="#8B5CF6" />
        <SummaryCard label="Belum Cair" value={totalUnpaid} color="#F59E0B" />
        <TargetCard
          monthlyTarget={monthlyTarget}
          totalAll={totalAll}
          targetEdit={targetEdit}
          targetInput={targetInput}
          setTargetInput={setTargetInput}
          setTargetEdit={setTargetEdit}
          setMonthlyTarget={setMonthlyTarget}
        />
      </div>

      {/* ===== Toolbar: Tombol Tambah + Filter ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm(emptyForm);
            setErr("");
            setFormOpen(true);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#4c00b2] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:brightness-110"
        >
          ＋ Tambah Pendapatan
        </button>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="">Semua Bulan</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as RevenueType | "all")}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="all">Semua Jenis</option>
          {TYPE_KEYS.map((t) => (
            <option key={t} value={t}>{TYPE_META[t].label}</option>
          ))}
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="all">Semua Platform</option>
          {Object.entries(PLATFORM_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | "all")}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="all">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="ml-auto text-[12px] text-[#94A3B8]">
          {filtered.length} item · {rupiah(totalFiltered)}
        </div>
      </div>

      {/* ===== Daftar / Tabel ===== */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B]">
        {!hydrated ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-[#64748B]">Memuat…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <div className="text-[26px]">💰</div>
            <div className="text-[13px] text-white/60">Belum ada data pendapatan.</div>
            <div className="text-[11px] text-[#64748B]">
              Klik "＋ Tambah Pendapatan" untuk mulai catat penghasilan dari konten lu.
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 border-b border-[#2E3750] bg-[#1C222B]">
                <tr className="text-[11px] uppercase tracking-wide text-[#64748B]">
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Konten</th>
                  <th className="px-3 py-2 font-semibold">Jenis</th>
                  <th className="px-3 py-2 font-semibold">Sumber</th>
                  <th className="px-3 py-2 font-semibold">Platform</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-semibold">Nominal</th>
                  <th className="px-3 py-2 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-[#232A3D] text-[12px] text-white/80 hover:bg-[#232A3D]/40">
                    <td className="whitespace-nowrap px-3 py-2">{e.date}</td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-white">{e.title}</div>
                      {e.note && <div className="text-[10.5px] text-[#64748B]">{e.note}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{ color: TYPE_META[e.type].color, background: TYPE_META[e.type].color + "1a" }}
                      >
                        {TYPE_META[e.type].label}
                      </span>
                    </td>
                    <td className="px-3 py-2">{e.subcategory || "-"}</td>
                    <td className="px-3 py-2">{PLATFORM_LABEL[e.platform] ?? e.platform}</td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{ color: STATUS_META[e.status ?? "belum"].color, background: STATUS_META[e.status ?? "belum"].color + "1a" }}
                      >
                        {STATUS_META[e.status ?? "belum"].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-white">{rupiah(e.amount)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          className="cursor-pointer rounded px-1.5 py-0.5 text-[#38BDF8] hover:bg-[#232A3D]"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          className="cursor-pointer rounded px-1.5 py-0.5 text-[#EF4444] hover:bg-[#232A3D]"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal Tambah/Edit ===== */}
      {formOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setFormOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-[#2E3750] bg-[#1C222B] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-white">
                {editId ? "Edit Pendapatan" : "Tambah Pendapatan"}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="cursor-pointer rounded p-1 text-[#94A3B8] hover:bg-[#232A3D]"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Field label="Tanggal">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none focus:border-[#38BDF8]/60"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Jenis">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as RevenueType })}
                    className="w-full cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none"
                  >
                    {TYPE_KEYS.map((t) => (
                      <option key={t} value={t}>{TYPE_META[t].label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Platform">
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none"
                  >
                    {Object.entries(PLATFORM_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Sumber + Status (baru) */}
              {SUBCATEGORY_OPTIONS[form.type].length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Sumber (opsional)">
                    <select
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none"
                    >
                      <option value="">Pilih sumber…</option>
                      {SUBCATEGORY_OPTIONS[form.type].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status Pembayaran">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}
                      className="w-full cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              <Field label="Nama Konten / Produk">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="cth: Review Speaker Jumbo (sponsor)"
                  className="w-full rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8]/60"
                />
              </Field>

              <Field label="Nominal (Rupiah)">
                <input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="cth: 500000"
                  className="w-full appearance-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8]/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                />
              </Field>

              <Field label="Catatan (opsional)">
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="cth: link afiliasi Shopee, deal sponsor brand X"
                  rows={2}
                  className="w-full resize-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8]/60"
                />
              </Field>

              {err && (
                <div className="rounded-[8px] border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[11.5px] text-[#EF4444]">
                  {err}
                </div>
              )}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="cursor-pointer rounded-[8px] border border-[#2E3750] px-4 py-1.5 text-[12px] font-bold text-[#94A3B8] hover:bg-[#232A3D]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="cursor-pointer rounded-[8px] bg-[#4c00b2] px-4 py-1.5 text-[12px] font-bold text-white hover:brightness-110"
                >
                  {editId ? "Simpan" : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-[#10B981] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
      <span className="text-[11px] text-[#64748B]">{label}</span>
      <span className="truncate text-[20px] font-bold leading-none" style={{ color }}>
        {rupiah(value)}
      </span>
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

function TargetCard({
  monthlyTarget,
  totalAll,
  targetEdit,
  targetInput,
  setTargetInput,
  setTargetEdit,
  setMonthlyTarget,
}: {
  monthlyTarget: string;
  totalAll: number;
  targetEdit: boolean;
  targetInput: string;
  setTargetInput: (v: string) => void;
  setTargetEdit: (v: boolean) => void;
  setMonthlyTarget: (v: string) => void;
}) {
  const target = Number(monthlyTarget) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((totalAll / target) * 100)) : 0;

  function saveTarget() {
    const n = Number(targetInput);
    if (!isNaN(n) && n > 0) {
      setMonthlyTarget(String(n));
      try {
        window.localStorage.setItem(LS_TARGET_KEY, String(n));
      } catch {}
    }
    setTargetEdit(false);
  }

  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
      <span className="text-[11px] text-[#64748B]">Target / Bulan</span>
      {targetEdit ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            autoFocus
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveTarget(); }}
            placeholder="cth 20000000"
            className="w-full min-w-0 appearance-none rounded-[6px] border border-[#2E3750] bg-[#0E1116] px-2 py-1 text-[14px] font-bold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
          />
          <button
            type="button"
            onClick={saveTarget}
            className="shrink-0 cursor-pointer rounded-[6px] bg-[#4c00b2] px-2 py-1 text-[11px] font-bold text-white hover:brightness-110"
          >
            OK
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setTargetInput(monthlyTarget); setTargetEdit(true); }}
          className="cursor-pointer text-left"
          title="Klik untuk set target"
        >
          {target > 0 ? (
            <span className="text-[20px] font-bold leading-none text-white">{rupiah(target)}</span>
          ) : (
            <span className="text-[13px] font-semibold text-[#64748B]">Set target…</span>
          )}
        </button>
      )}
      {target > 0 && !targetEdit && (
        <div className="mt-0.5 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#232A3D]">
            <div className="h-full rounded-full bg-[#4c00b2]" style={{ width: pct + "%" }} />
          </div>
          <span className="text-[10px] font-semibold text-[#94A3B8]">{pct}%</span>
        </div>
      )}
    </div>
  );
}
