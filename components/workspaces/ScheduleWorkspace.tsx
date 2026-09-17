"use client";

// components/workspaces/ScheduleWorkspace.tsx
// Jadwal posting terpusat — CRUD + kalender minggu + filter platform + status.
// Simpan di localStorage (nanti pindah Supabase di Fase 3).

import { useState, useEffect } from "react";

type Status = "terjadwal" | "diposting" | "terlewat";

interface ScheduleItem {
  id: string;
  title: string;
  platform: "tiktok" | "youtube" | "instagram";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: Status;
  note?: string;
}

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  tiktok: { label: "TikTok", icon: "🎵", color: "#8B5CF6" },
  youtube: { label: "YouTube", icon: "📺", color: "#EF4444" },
  instagram: { label: "Instagram", icon: "📸", color: "#F59E0B" },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  terjadwal: { label: "Terjadwal", color: "#3B82F6", bg: "#3B82F6/12" },
  diposting: { label: "Diposting", color: "#22C55E", bg: "#22C55E/12" },
  terlewat: { label: "Terlewat", color: "#EF4444", bg: "#EF4444/12" },
};

const STORAGE_KEY = "smartdash_schedule_v1";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekDates(anchor: string): string[] {
  const base = new Date(anchor + "T00:00:00");
  const day = base.getDay(); // 0=Sun
  const start = new Date(base);
  start.setDate(base.getDate() - day); // mulai Minggu
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
}

function isPastDate(iso: string) {
  return iso < todayStr();
}

export function ScheduleWorkspace() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [anchor, setAnchor] = useState(todayStr());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    platform: "tiktok" as ScheduleItem["platform"],
    date: todayStr(),
    time: "19:00",
    status: "terjadwal" as Status,
    note: "",
  });

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, loaded]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setForm({
      title: "",
      platform: "tiktok",
      date: todayStr(),
      time: "19:00",
      status: "terjadwal",
      note: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      platform: item.platform,
      date: item.date,
      time: item.time,
      status: item.status,
      note: item.note || "",
    });
    setShowForm(true);
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("⚠️ Judul jadwal wajib diisi");
      return;
    }
    if (editingId) {
      setItems((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, ...form, title: form.title.trim() } : it))
      );
      showToast("✅ Jadwal diperbarui");
    } else {
      const id = "sch_" + Date.now().toString(36);
      setItems((prev) => [...prev, { id, ...form, title: form.title.trim() }]);
      showToast("✅ Jadwal ditambahkan");
    }
    resetForm();
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast("🗑️ Jadwal dihapus");
  }

  function cycleStatus(id: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next: Status =
          it.status === "terjadwal" ? "diposting" : it.status === "diposting" ? "terlewat" : "terjadwal";
        return { ...it, status: next };
      })
    );
  }

  const week = weekDates(anchor);

  const filtered = items
    .filter((it) => (filterPlatform === "all" ? true : it.platform === filterPlatform))
    .filter((it) => (filterStatus === "all" ? true : it.status === filterStatus))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const weekCounts = week.map((d) => items.filter((it) => it.date === d).length);

  const totalAll = items.length;
  const totalPosted = items.filter((it) => it.status === "diposting").length;
  const totalUpcoming = items.filter((it) => it.status === "terjadwal" && !isPastDate(it.date)).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {/* ===== Stat ringkas ===== */}
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <StatCard label="Total Jadwal" value={totalAll} />
        <StatCard label="Terjadwal" value={totalUpcoming} color="#3B82F6" />
        <StatCard label="Udah Posting" value={totalPosted} color="#22C55E" />
      </div>

      {/* ===== Kalender minggu ===== */}
      <div className="shrink-0 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-white">
            {fmtDate(week[0])} — {fmtDate(week[6])}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const d = new Date(anchor + "T00:00:00");
                d.setDate(d.getDate() - 7);
                setAnchor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
              }}
              className="cursor-pointer rounded-md border border-[#2E3750] px-2 py-1 text-[11px] font-bold text-[#94A3B8] hover:bg-[#232A3D]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setAnchor(todayStr())}
              className="cursor-pointer rounded-md border border-[#2E3750] px-2 py-1 text-[11px] font-bold text-white hover:bg-[#232A3D]"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date(anchor + "T00:00:00");
                d.setDate(d.getDate() + 7);
                setAnchor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
              }}
              className="cursor-pointer rounded-md border border-[#2E3750] px-2 py-1 text-[11px] font-bold text-[#94A3B8] hover:bg-[#232A3D]"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d, i) => {
            const today = d === todayStr();
            const count = weekCounts[i];
            return (
              <div
                key={d}
                className={`rounded-lg border p-1.5 text-center ${
                  today ? "border-[#4c00b2] bg-[#4c00b2]/10" : "border-[#2E3750] bg-[#161B24]"
                }`}
              >
                <div className={`text-[9.5px] font-bold uppercase tracking-wide ${today ? "text-[#a78bfa]" : "text-[#64748B]"}`}>
                  {d === todayStr() ? "Hari Ini" : new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" })}
                </div>
                <div className="mt-0.5 text-[12px] font-bold text-white">
                  {new Date(d + "T00:00:00").getDate()}
                </div>
                {count > 0 ? (
                  <div className="mt-0.5 rounded-full bg-[#4c00b2] px-1 text-[9px] font-bold text-white">{count}</div>
                ) : (
                  <div className="mt-0.5 text-[9px] text-[#2E3750]">·</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="cursor-pointer rounded-lg bg-[#4c00b2] px-3 py-1.5 text-[12px] font-bold text-white hover:brightness-110"
        >
          ＋ Tambah Jadwal
        </button>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[11px] text-white outline-none"
        >
          <option value="all">Semua Platform</option>
          <option value="tiktok">🎵 TikTok</option>
          <option value="youtube">📺 YouTube</option>
          <option value="instagram">📸 Instagram</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[11px] text-white outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="terjadwal">Terjadwal</option>
          <option value="diposting">Diposting</option>
          <option value="terlewat">Terlewat</option>
        </select>
      </div>

      {/* ===== Form (modal inline) ===== */}
      {showForm && (
        <form
          onSubmit={submitForm}
          className="shrink-0 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-white">
              {editingId ? "✏️ Edit Jadwal" : "＋ Jadwal Baru"}
            </span>
            <button type="button" onClick={resetForm} className="cursor-pointer text-[12px] font-bold text-[#64748B] hover:text-white">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Field label="Judul Konten *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="cth: Review Speaker JBL Go 3"
                  className="w-full rounded-lg border border-[#2E3750] bg-[#161B24] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#4c00b2]/60"
                />
              </Field>
            </div>
            <Field label="Platform">
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value as ScheduleItem["platform"] })}
                className="w-full cursor-pointer rounded-lg border border-[#2E3750] bg-[#161B24] px-2 py-2 text-[12px] text-white outline-none"
              >
                <option value="tiktok">🎵 TikTok</option>
                <option value="youtube">📺 YouTube</option>
                <option value="instagram">📸 Instagram</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                className="w-full cursor-pointer rounded-lg border border-[#2E3750] bg-[#161B24] px-2 py-2 text-[12px] text-white outline-none"
              >
                <option value="terjadwal">Terjadwal</option>
                <option value="diposting">Diposting</option>
                <option value="terlewat">Terlewat</option>
              </select>
            </Field>
            <Field label="Tanggal">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-[#2E3750] bg-[#161B24] px-2 py-2 text-[12px] text-white outline-none [color-scheme:dark]"
              />
            </Field>
            <Field label="Jam">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full rounded-lg border border-[#2E3750] bg-[#161B24] px-2 py-2 text-[12px] text-white outline-none [color-scheme:dark]"
              />
            </Field>
            <div className="col-span-2">
              <Field label="Catatan (opsional)">
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="cth: pakai thumbnail baru / caption siap"
                  className="w-full rounded-lg border border-[#2E3750] bg-[#161B24] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#4c00b2]/60"
                />
              </Field>
            </div>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <button
              type="submit"
              className="flex-1 cursor-pointer rounded-lg bg-[#4c00b2] px-3 py-2 text-[12px] font-bold text-white hover:brightness-110"
            >
              {editingId ? "Simpan Perubahan" : "Tambah Jadwal"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer rounded-lg border border-[#2E3750] px-3 py-2 text-[12px] font-bold text-[#94A3B8] hover:bg-[#232A3D]"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* ===== List jadwal ===== */}
      <div className="min-h-0 flex flex-col">
        <span className="mb-1 block text-[11px] font-semibold text-white/60">
          Daftar Jadwal {filtered.length > 0 && `(${filtered.length})`}
        </span>
        {filtered.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#2E3750] bg-[#161B24] p-5 text-center text-[11.5px] text-[#64748B]">
            Belum ada jadwal. Klik <span className="font-bold text-white">＋ Tambah Jadwal</span> buat mulai.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((it) => {
              const pm = PLATFORM_META[it.platform];
              const sm = STATUS_META[it.status];
              return (
                <div key={it.id} className="flex items-center gap-2.5 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[16px]"
                    style={{ background: pm.color + "22" }}
                  >
                    {pm.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-bold text-white">{it.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                      <span>{pm.label}</span>
                      <span>·</span>
                      <span>{fmtDate(it.date)}</span>
                      <span>·</span>
                      <span>{it.time}</span>
                      {isPastDate(it.date) && it.status !== "diposting" && (
                        <span className="text-[#EF4444]">(terlewat)</span>
                      )}
                    </div>
                    {it.note && <div className="mt-0.5 truncate text-[10px] text-[#64748B]">📝 {it.note}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => cycleStatus(it.id)}
                      className="cursor-pointer rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                      style={{ color: sm.color, background: sm.bg }}
                    >
                      {sm.label} ↻
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(it)}
                        className="cursor-pointer rounded-md border border-[#2E3750] px-1.5 py-0.5 text-[9.5px] font-bold text-[#94A3B8] hover:bg-[#232A3D]"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(it.id)}
                        className="cursor-pointer rounded-md border border-[#2E3750] px-1.5 py-0.5 text-[9.5px] font-bold text-[#EF4444] hover:bg-[#232A3D]"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-[#10B981] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "#4c00b2" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</div>
      <div className="mt-0.5 text-[22px] font-bold leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold text-[#94A3B8]">{label}</span>
      {children}
    </label>
  );
}