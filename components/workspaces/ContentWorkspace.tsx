"use client";

// components/workspaces/ContentWorkspace.tsx
// Bank ide konten + pipeline status (Ide → Draf → Siap → Terposting).
// Simpan di localStorage dulu. Fase 3 pindah ke Supabase.
// Pola & gaya konsisten dengan NotesWorkspace/RevenueWorkspace.

import { useEffect, useMemo, useState } from "react";

type Status = "ide" | "draf" | "siap" | "posting";

type ContentItem = {
  id: string;
  title: string;
  description: string;
  platform: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

const LS_KEY = "smartdash-content";

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  ide: { label: "Ide", color: "#64748B", bg: "#64748B20" },
  draf: { label: "Draf", color: "#F59E0B", bg: "#F59E0B20" },
  siap: { label: "Siap", color: "#3B82F6", bg: "#3B82F620" },
  posting: { label: "Terposting", color: "#22C55E", bg: "#22C55E20" },
};

const STATUS_KEYS: Status[] = ["ide", "draf", "siap", "posting"];

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  lain: "Lainnya",
};

const PLATFORM_OPTIONS = Object.entries(PLATFORM_LABEL).map(([k, v]) => ({ value: k, label: v }));

const emptyForm = {
  title: "",
  description: "",
  platform: "tiktok",
  status: "ide" as Status,
};

export function ContentWorkspace() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Filter
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "kanban">("kanban");

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Muat dari localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function saveItems(next: ContentItem[]) {
    setItems(next);
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  }

  function handleSubmit() {
    const title = form.title.trim();
    if (!title) return setErr("Judul ide wajib diisi");
    const now = new Date().toISOString();

    if (editId) {
      saveItems(
        items.map((i) =>
          i.id === editId
            ? { ...i, title, description: form.description.trim(), platform: form.platform, status: form.status, updatedAt: now }
            : i
        )
      );
      showToast("✓ Ide diperbarui");
    } else {
      const item: ContentItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title,
        description: form.description.trim(),
        platform: form.platform,
        status: form.status,
        createdAt: now,
        updatedAt: now,
      };
      saveItems([item, ...items]);
      showToast("✓ Ide ditambahkan");
    }
    setFormOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setErr("");
  }

  function handleDelete(id: string) {
    saveItems(items.filter((i) => i.id !== id));
    showToast("Ide dihapus");
  }

  function openEdit(item: ContentItem) {
    setEditId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      platform: item.platform,
      status: item.status,
    });
    setErr("");
    setFormOpen(true);
  }

  function moveStatus(id: string, newStatus: Status) {
    const now = new Date().toISOString();
    saveItems(items.map((i) => (i.id === id ? { ...i, status: newStatus, updatedAt: now } : i)));
    showToast(`✓ Dipindah ke ${STATUS_META[newStatus].label}`);
  }

  // Filter & search
  const filtered = useMemo(() => {
    return items
      .filter((i) => (filterStatus === "all" ? true : i.status === filterStatus))
      .filter((i) => (filterPlatform === "all" ? true : i.platform === filterPlatform))
      .filter(
        (i) =>
          !searchQuery ||
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, filterStatus, filterPlatform, searchQuery]);

  // Count per status (untuk badge kanban)
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { ide: 0, draf: 0, siap: 0, posting: 0 };
    for (const i of items) m[i.status] += 1;
    return m;
  }, [items]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* ===== Toolbar ===== */}
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
          ＋ Ide Baru
        </button>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari ide…"
          className="w-[160px] rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none placeholder:text-[#64748B] focus:border-[#4c00b2]/60"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="all">Semua Status</option>
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label} ({statusCounts[s]})</option>
          ))}
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="all">Semua Platform</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Toggle View */}
        <div className="ml-auto flex rounded-lg border border-[#2E3750]">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`cursor-pointer px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              view === "kanban" ? "bg-[#4c00b2] text-white" : "text-[#64748B]"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`cursor-pointer px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              view === "list" ? "bg-[#4c00b2] text-white" : "text-[#64748B]"
            }`}
          >
            List
          </button>
        </div>

        <div className="text-[12px] text-[#94A3B8]">{filtered.length} ide</div>
      </div>

      {/* ===== KANBAN VIEW ===== */}
      {view === "kanban" ? (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-x-auto lg:grid-cols-4">
          {STATUS_KEYS.map((s) => {
            const colItems = filtered.filter((i) => i.status === s);
            return (
              <div key={s} className="flex min-h-0 min-w-[200px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B]">
                <div className="flex shrink-0 items-center justify-between border-b border-[#2E3750] px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s].color }} />
                    <span className="text-[12px] font-bold text-white">{STATUS_META[s].label}</span>
                  </div>
                  <span className="rounded-full bg-[#232A3D] px-1.5 py-0.5 text-[10px] font-bold text-[#94A3B8]">
                    {colItems.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                  {colItems.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-[#64748B]">Kosong</div>
                  ) : (
                    colItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[8px] border border-[#232A3D] bg-[#0E1116] p-2.5 hover:border-[#4c00b2]/40"
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-1">
                          <div className="text-[12px] font-bold text-white leading-tight">{item.title}</div>
                          <div className="flex shrink-0 gap-0.5">
                            <button type="button" onClick={() => openEdit(item)} className="cursor-pointer rounded px-1 text-[10px] text-[#38BDF8] hover:bg-[#232A3D]" title="Edit">✏️</button>
                            <button type="button" onClick={() => handleDelete(item.id)} className="cursor-pointer rounded px-1 text-[10px] text-[#EF4444] hover:bg-[#232A3D]" title="Hapus">🗑️</button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="mb-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-[#94A3B8]">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold" style={{ color: "#8B5CF6" }}>
                            {PLATFORM_LABEL[item.platform] ?? item.platform}
                          </span>
                          {/* Tombol pindah status */}
                          <div className="flex gap-0.5">
                            {STATUS_KEYS.filter((k) => k !== item.status).slice(0, 2).map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => moveStatus(item.id, k)}
                                className="cursor-pointer rounded bg-[#232A3D] px-1 py-0.5 text-[9px] font-semibold text-[#94A3B8] hover:text-white"
                                title={`Pindah ke ${STATUS_META[k].label}`}
                              >
                                →{STATUS_META[k].label.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== LIST VIEW ===== */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B]">
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <div className="text-[26px]">💡</div>
              <div className="text-[13px] text-white/60">Belum ada ide konten.</div>
              <div className="text-[11px] text-[#64748B]">Klik "＋ Ide Baru" buat mulai.</div>
            </div>
          ) : (
            <div className="overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 border-b border-[#2E3750] bg-[#1C222B]">
                  <tr className="text-[11px] uppercase tracking-wide text-[#64748B]">
                    <th className="px-3 py-2 font-semibold">Judul</th>
                    <th className="px-3 py-2 font-semibold">Platform</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Update</th>
                    <th className="px-3 py-2 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-[#232A3D] text-[12px] text-white/80 hover:bg-[#232A3D]/40">
                      <td className="max-w-[300px] px-3 py-2">
                        <div className="font-semibold text-white">{item.title}</div>
                        {item.description && <div className="line-clamp-1 text-[10.5px] text-[#64748B]">{item.description}</div>}
                      </td>
                      <td className="px-3 py-2" style={{ color: "#8B5CF6" }}>{PLATFORM_LABEL[item.platform] ?? item.platform}</td>
                      <td className="px-3 py-2">
                        <select
                          value={item.status}
                          onChange={(e) => moveStatus(item.id, e.target.value as Status)}
                          className="cursor-pointer rounded-full px-2 py-0.5 text-[10.5px] font-semibold outline-none"
                          style={{ color: STATUS_META[item.status].color, background: STATUS_META[item.status].bg }}
                        >
                          {STATUS_KEYS.map((s) => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10.5px] text-[#64748B]">
                        {new Date(item.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <button type="button" onClick={() => openEdit(item)} className="cursor-pointer rounded px-1.5 py-0.5 text-[#38BDF8] hover:bg-[#232A3D]" title="Edit">✏️</button>
                          <button type="button" onClick={() => handleDelete(item.id)} className="cursor-pointer rounded px-1.5 py-0.5 text-[#EF4444] hover:bg-[#232A3D]" title="Hapus">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== Modal Tambah/Edit ===== */}
      {formOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setFormOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-[#2E3750] bg-[#1C222B] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-white">{editId ? "Edit Ide" : "Tambah Ide Baru"}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="cursor-pointer rounded p-1 text-[#94A3B8] hover:bg-[#232A3D]">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Judul Ide">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="cth: Tutorial settingan audio laptop"
                  className="w-full rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8]/60"
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Platform">
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none"
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full cursor-pointer rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none"
                  >
                    {STATUS_KEYS.map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Deskripsi (opsional)">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Catatan tambahan: referensi, gaya konten, deadline, dll."
                  rows={3}
                  className="w-full resize-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8]/60"
                />
              </Field>
              {err && (
                <div className="rounded-[8px] border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[11.5px] text-[#EF4444]">{err}</div>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <button type="button" onClick={() => setFormOpen(false)} className="cursor-pointer rounded-[8px] border border-[#2E3750] px-4 py-1.5 text-[12px] font-bold text-[#94A3B8] hover:bg-[#232A3D]">Batal</button>
                <button type="button" onClick={handleSubmit} className="cursor-pointer rounded-[8px] bg-[#4c00b2] px-4 py-1.5 text-[12px] font-bold text-white hover:brightness-110">
                  {editId ? "Simpan" : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-[#10B981] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">{toast}</div>
      )}
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
