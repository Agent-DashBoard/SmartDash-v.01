// live-data.server.ts — server-side fetch Zernio (data asli) untuk SSR.
// Dipanggil di server page, kirim data sudah terisi ke komponen — chart
// & angka langsung muncul di HTML pertama (tanpa tunggu client-side fetch).

import { LiveAccount, LivePost, LiveData } from "./live-data";

const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY;

type ZernioAccount = {
  _id?: string;
  id?: string;
  platform: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  profileUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  likesCount?: number;
  videoCount?: number;
  metadata?: {
    profileData?: {
      username?: string;
      displayName?: string;
      profilePicture?: string;
      profileUrl?: string;
      bio?: string;
      followersCount?: number;
      followingCount?: number;
      extraData?: {
        likesCount?: number;
        followingCount?: number;
      };
      videoCount?: number;
    };
  };
};

type ZernioPost = {
  id?: string;
  _id?: string;
  createdTime?: string;
  message?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  viewCount?: number;
  picture?: string;
  thumbnail?: string;
  permalink?: string;
  url?: string;
  mediaType?: string;
};

async function zernio<T>(path: string): Promise<T> {
  const res = await fetch(`https://zernio.com/api/v1/${path}`, {
    headers: { Authorization: `Bearer ${ZERNIO_API_KEY}` },
    next: { revalidate: 60 }, // ISR tiap 60 detik (fresh, aman untuk dev)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Zernio ${path} → ${res.status} ${txt.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchLiveData(): Promise<LiveData> {
  try {
    const accountsRaw = await zernio<{ accounts: ZernioAccount[] }>("accounts");

    // Normalisasi akun → LiveAccount
    const accounts: LiveAccount[] = accountsRaw.accounts.map((a) => {
      const pd = a.metadata?.profileData;
      const extra = pd?.extraData ?? {};
      const rawId = a._id ?? a.id ?? "";
      return {
        id: rawId,
        platform: (a.platform ?? "tiktok") as LiveAccount["platform"],
        username: pd?.username ?? a.username ?? a.displayName ?? "",
        displayName: pd?.displayName ?? a.displayName ?? a.username ?? "",
        profilePicture: pd?.profilePicture ?? a.profilePicture ?? "",
        profileUrl: pd?.profileUrl ?? a.profileUrl ?? "",
        bio: pd?.bio ?? a.bio ?? "",
        followersCount: Number(pd?.followersCount ?? a.followersCount ?? 0),
        followingCount: Number(pd?.followingCount ?? extra.followingCount ?? a.followingCount ?? 0),
        likesCount: Number(extra.likesCount ?? a.likesCount ?? 0),
        videoCount: Number(pd?.videoCount ?? a.videoCount ?? 0),
        followersLastUpdated: new Date().toISOString(),
      };
    });

    // Ambil posts per akun (paralel)
    const postsResults = await Promise.all(
      accounts.map(async (acct) => {
        try {
          const postsRaw = await zernio<{ posts: ZernioPost[] }>(
            `accounts/${acct.id}/posts`
          );
          const posts: LivePost[] = postsRaw.posts.map((p) => ({
            id: p.id ?? p._id ?? "",
            platform: acct.platform,
            createdTime: p.createdTime ?? new Date().toISOString(),
            message: p.message ?? "",
            likeCount: Number(p.likeCount ?? 0),
            commentCount: Number(p.commentCount ?? 0),
            shareCount: Number(p.shareCount ?? 0),
            viewCount: Number(p.viewCount ?? 0),
            picture: p.picture ?? p.thumbnail ?? "",
            permalink: p.permalink ?? p.url ?? "",
            mediaType: p.mediaType ?? "",
          }));
          return posts;
        } catch {
          return [] as LivePost[]; // akun error → kosongkan posts, jangan bikin seluruh fetch gagal
        }
      })
    );

    const allPosts: LivePost[] = postsResults.flatMap((p) => p);
    return {
      accounts,
      posts: allPosts,
      loading: false,
      error: null,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    // Fetch gagal total → kembalikan state kosong (komponen pakai data mock fallback)
    const err = e instanceof Error ? e.message : String(e);
    return {
      accounts: [],
      posts: [],
      loading: false,
      error: err,
      updatedAt: new Date().toISOString(),
    };
  }
}
