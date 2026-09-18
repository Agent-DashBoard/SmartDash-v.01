"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop: collapse/expand
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: drawer buka/tutup

  return (
    <div className="flex h-full">
      {/* Sidebar — desktop: persistent & collapsible. Mobile: overlay drawer */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Backdrop gelap di belakang drawer mobile — klik buat nutup */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Area konten */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — cuma tampil di mobile, isinya tombol hamburger buat buka drawer */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            title="Buka menu"
            aria-label="Buka menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-foreground">SmartDash</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}