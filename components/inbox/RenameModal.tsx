"use client";

// RenameModal — modal rename sesi (ganti window.prompt).
import { useState } from "react";

export function RenameModal({
  current,
  onSave,
  onCancel,
}: {
  current: string;
  onSave: (t: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(current);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-[12px] border border-[#2E3750] bg-[#1C222B] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 text-[14px] font-bold text-white">✏️ Rename Sesi</div>
        <input
          autoFocus
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(val);
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Masukkan judul baru..."
          className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8]/60"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg border border-[#2E3750] px-3 py-1.5 text-[12px] font-bold text-[#94A3B8] hover:bg-[#232A3D]">
            Batal
          </button>
          <button
            type="button"
            onClick={() => onSave(val)}
            disabled={!val.trim()}
            className="cursor-pointer rounded-lg bg-[#38BDF8] px-3 py-1.5 text-[12px] font-bold text-[#0E1116] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
