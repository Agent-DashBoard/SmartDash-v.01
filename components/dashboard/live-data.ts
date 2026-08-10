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

function normalizePost(raw: RawPost, platform?: string): LivePost {
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
    platform: platform ?? raw.platform ?? "",
  };
}

// Hook utama: ambil AKUN + posts untuk SEMUA platform yang terhubung.
// Semua posts digabung ke satu flat array — komponen lain yang filter per platform.
// Ini perbaikan "arah langsung ke TikTok": dulu pakai akun pertama saja; sekarang
// dashboard tampilkan data ASAL AKUN SAAT LOADING BERSEDIATU (bukan selepas).
export function useLiveData(seed?: LiveData): LiveData {
  const [state, setState] = useState<LiveData>(
    seed
      ? { ...seed, loading: false } // Seed dari server (SSR) → data sudah ada, tidak loading
      : {
          accounts: [],
          posts: [],
          loading: true,
          error: null,
          updatedAt: null,
        }
  );

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

        // FIXED: fetch posts untuk SEMUA akun sekaligus (bukan hanya akun pertama).
        // Dulu pakai akun pertama jadi target → dashboard langsung "arah ke TikTok".
        // Sekarang semua posts digabung, komponen filter per-platform sendiri.
        let posts: LivePost[] = [];
        let updatedAt: string | null = null;

        if (accounts.length > 0) {
          // FIXED: pass platform akun ke normalizePost — endpoint posts Zernio
          // TIDAK menyertakan field 'platform' per post, jadi ambil dari akunnya.
          // Sebelumnya platform post = "" → chart & Top Posts gak tau itu YouTube.
          const postsResults = await Promise.all(
            accounts.map((acct) =>
              fetchJson<{ posts: RawPost[] }>(`/api/zernio?path=accounts/${acct.id}/posts`).then(
                (r) => (r?.posts ?? []) as RawPost[],
                () => [] as RawPost[],
              )
            )
          );
          posts = accounts.flatMap((acct, i) =>
            (postsResults[i] ?? []).map((p) => normalizePost(p, acct.platform))
          );

          updatedAt =
            accounts.find((a) => a.followersLastUpdated)?.followersLastUpdated ??
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
