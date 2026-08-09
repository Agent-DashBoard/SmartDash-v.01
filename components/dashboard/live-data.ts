// live-data.ts — data asli dashboard dari Zernio API (via /api/zernio proxy).
// Fetch akun terhubung + posts → dinormalisasi untuk komponen dashboard.
// Fallback: kalau API gagal → null (komponen pakai data mock seperti sebelumnya).

"use client";

import { useEffect, useState } from "react";

export type LiveAccount = {
  id: string;
  platform: "tiktok" | "youtube";
  username: string;
  displayName: string;
  profilePicture: string;
  profileUrl: string;
  bio?: string;
  followersCount: number;
  followingCount?: number;
  likesCount?: number;
  videoCount?: number;
  followersLastUpdated?: string;
};

export type LivePost = {
  id: string;
  message: string;
  createdTime: string;
  permalink: string;
  mediaType: string;
  picture: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  platform: string;
};

export type LiveData = {
  accounts: LiveAccount[];
  posts: LivePost[];
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
};

// Tipe mentah dari Zernio (subset field yang kita pakai — sengaja longgar)
type RawProfileData = {
  username?: string;
  displayName?: string;
  profilePicture?: string;
  profileUrl?: string;
  bio?: string;
  followersCount?: number;
  extraData?: {
    followingCount?: number;
    likesCount?: number;
    videoCount?: number;
  };
};
type RawAccount = {
  _id?: string;
  platform?: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  followersCount?: number;
  followersLastUpdated?: string;
  metadata?: { profileData?: RawProfileData };
};
type RawPost = {
  id?: string;
  message?: string;
  createdTime?: string;
  permalink?: string;
  mediaType?: string;
  picture?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  platform?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function normalizeAccount(raw: RawAccount): LiveAccount {
  const pd = raw.metadata?.profileData ?? {};
  const ed = pd.extraData ?? {};
  return {
    id: raw._id ?? "",
    platform: (raw.platform === "youtube" ? "youtube" : "tiktok") as "tiktok" | "youtube",
    username: pd.username ?? raw.username ?? "",
    displayName: pd.displayName ?? raw.displayName ?? "",
    profilePicture: pd.profilePicture ?? raw.profilePicture ?? "",
    profileUrl: pd.profileUrl ?? "",
    bio: pd.bio,
    followersCount: raw.followersCount ?? pd.followersCount ?? 0,
    followingCount: ed.followingCount,
    likesCount: ed.likesCount,
    videoCount: ed.videoCount,
    followersLastUpdated: raw.followersLastUpdated,
  };
}

function normalizePost(raw: RawPost): LivePost {
  return {
    id: raw.id ?? "",
    message: raw.message ?? "",
    createdTime: raw.createdTime ?? "",
    permalink: raw.permalink ?? "",
    mediaType: raw.mediaType ?? "",
    picture: raw.picture ?? "",
    likeCount: raw.likeCount ?? 0,
    commentCount: raw.commentCount ?? 0,
    shareCount: raw.shareCount ?? 0,
    platform: raw.platform ?? "",
  };
}

// Hook utama: ambil akun + posts (akun pertama yang punya posts, atau akun tiktok).
export function useLiveData(): LiveData {
  const [state, setState] = useState<LiveData>({
    accounts: [],
    posts: [],
    loading: true,
    error: null,
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [accRes, analyticsRes] = await Promise.all([
          fetchJson<{ accounts: RawAccount[] }>("/api/zernio?path=accounts"),
          fetchJson<{ accounts: RawAccount[] }>("/api/zernio?path=analytics"),
        ]);
        if (cancelled) return;

        const rawAccounts = accRes.accounts ?? [];
        const accounts = rawAccounts.map(normalizeAccount);

        // Cari akun pertama yang aktif (tiktok dulu, lalu youtube)
        const target =
          accounts.find((a) => a.platform === "tiktok") ??
          accounts.find((a) => a.platform === "youtube");

        let posts: LivePost[] = [];
        let updatedAt: string | null = null;

        if (target) {
          try {
            const postsRes = await fetchJson<{ posts: RawPost[] }>(
              `/api/zernio?path=accounts/${target.id}/posts`
            );
            posts = (postsRes.posts ?? []).map(normalizePost);
          } catch {
            posts = [];
          }
          updatedAt =
            target.followersLastUpdated ??
            (analyticsRes.accounts?.[0] as RawAccount | undefined)?.followersLastUpdated ??
            null;
        }

        if (!cancelled) {
          setState({ accounts, posts, loading: false, error: null, updatedAt });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setState({
            accounts: [],
            posts: [],
            loading: false,
            error: err instanceof Error ? err.message : "Gagal ambil data",
            updatedAt: null,
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
