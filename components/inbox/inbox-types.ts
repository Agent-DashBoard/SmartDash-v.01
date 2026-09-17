"use client";

// Shared types & constants untuk Inbox
// Dipakai oleh semua komponen inbox.

export type ChatPlatform = "tiktok" | "youtube" | "instagram" | "whatsapp";
export type AccountKey = ChatPlatform | "agent" | "email";
export type Msg = { role: "user" | "agent" | "error"; text: string };

export type Chat = {
  id: number;
  platform: ChatPlatform;
  name: string;
  handle: string;
  preview: string;
  time: string;
  unread: boolean;
};

export type AgentSession = {
  id: number;
  title: string;
  pinned?: boolean;
  hermesSessionId?: string;
};

export const PLATFORM_META: Record<
  ChatPlatform,
  { label: string; icon: string; img: string; color: string; connected: boolean }
> = {
  tiktok: { label: "TikTok", icon: "🎵", img: "/icons/tiktok.png", color: "#00F2EA", connected: true },
  youtube: { label: "YouTube", icon: "▶️", img: "/icons/youtube.png", color: "#FF0000", connected: true },
  instagram: { label: "Instagram", icon: "📸", img: "/icons/instagram.png", color: "#E1306C", connected: false },
  whatsapp: { label: "WhatsApp", icon: "💬", img: "/icons/whatsapp.png", color: "#25D366", connected: false },
};

export const AGENT_META = {
  label: "Agent",
  img: "/icons/Agent.png",
  color: "#F97316",
};

export const AGENT_INITIAL_MSG: Msg = {
  role: "agent",
  text: "Halo! 👋 Aku **SmartDash**, asisten AI-mu. Aku bisa bantu soal dashboard, analitik konten, automasi, atau apa aja yang berhubungan dengan project kamu. Mau tanya apa hari ini?",
};

export const INITIAL_AGENT_SESSIONS: AgentSession[] = [];

export const AGENT_SIDEBAR_W = 260;

export function accountNameFor(platform: ChatPlatform) {
  return platform === "tiktok"
    ? "BangBay | Audio & Cuan"
    : platform === "youtube"
      ? "Bang Panjul"
      : PLATFORM_META[platform].label;
}

export function accountHandleFor(platform: ChatPlatform) {
  return platform === "tiktok"
    ? "@bangbayaudio"
    : platform === "youtube"
      ? "@smart-dashboard"
      : "";
}
