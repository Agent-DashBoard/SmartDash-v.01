"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Fallback saat sidebar collapsed (gambar lebar gak muat di w-16) */
  iconCollapsed?: React.ReactNode;
};

const iconClass = "h-5 w-5 shrink-0";

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/apps",
    label: "Apps",
    // Ikon grid 9 titik (khas "aplikasi") — muat juga saat collapsed (persegi), tanpa fallback khusus
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="5" cy="5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9.5 14.5 4 20" />
        <path d="M14.5 9.5 20 4" />
        <path d="M9 7.5 7.5 9a4 4 0 0 0 0 5.7l1.8 1.8a4 4 0 0 0 5.7 0l1.5-1.5" />
        <path d="m15 16.5 1.5-1.5a4 4 0 0 0 0-5.7l-1.8-1.8a4 4 0 0 0-5.7 0L7.5 9" />
      </svg>
    ),
  },
  {
    href: "/social",
    label: "Social",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17.5" cy="9.5" r="2.5" />
        <path d="M15.5 20a6 6 0 0 1 6-6" />
      </svg>
    ),
  },
  {
    href: "/inbox",
    label: "Inbox",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Sidebar({
  open = true,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-border-subtle bg-surface transition-[width] duration-300 ${
        open ? "w-60" : "w-16"
      }`}
    >
      {/* Brand — kotak logo; tombol toggle di pojok kanan DALAM kotak ini */}
      <div className="relative flex h-24 shrink-0 items-center justify-center border-b border-border-subtle px-5">
        {open && (
          <Image
            src="/images/logo.png"
            alt="SmartDash"
            width={178}
            height={49}
            className="h-10 w-auto"
            priority
          />
        )}
        {/* Tombol tutup/buka sidebar — pojok kanan atas di dalam kotak logo */}
        <button
          type="button"
          onClick={onToggle}
          title={open ? "Tutup sidebar" : "Buka sidebar"}
          aria-label={open ? "Tutup sidebar" : "Buka sidebar"}
          className="absolute right-2 top-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M12 4v16" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                open ? "gap-3" : "justify-center px-2"
              } ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              {open ? item.icon : (item.iconCollapsed ?? item.icon)}
              {open && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-border-subtle ${open ? "px-5 py-4" : "py-4"}`}>
        {open && <p className="text-xs text-muted">SmartDash v0.1</p>}
      </div>
    </aside>
  );
}
