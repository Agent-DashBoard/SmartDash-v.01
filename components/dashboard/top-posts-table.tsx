// top-posts-table.tsx — tabel Top Performing Posts.
// Data asli dari Zernio (TikTok @bangbayaudio) kalau tersedia; fallback mock 2 baris.

"use client";

import Image from "next/image";
import { fmtNum } from "./dashboard-data";
import { LiveData } from "./live-data";

const TOP_POSTS_MOCK = [
  { rank: "1", title: "Judul konten nya", type: "Tiktok", likes: "4.5k", reach: "500k", score: "9.2" },
  { rank: "2", title: "Judul konten nya", type: "Youtube", likes: "4.5k", reach: "500k", score: "7.5" },
];

function scoreFor(post: { likeCount: number; commentCount: number; shareCount: number }) {
  // Skor engagement sederhana: like + 2*comment + 3*share
  return (post.likeCount + 2 * post.commentCount + 3 * post.shareCount).toFixed(1);
}

export function TopPostsTable({
  live,
}: {
  live?: LiveData;
}) {
  const livePosts = (live?.posts ?? [])
    .slice()
    .sort((a, b) => b.likeCount - a.likeCount);

  const hasLive = !!live && !live.loading && livePosts.length > 0;

  return (
    <div className="rounded-[10px] bg-[#1C222B] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-bold text-white">Top Performing Posts</h2>
        {hasLive && (
          <span className="rounded-full bg-[#F97316]/15 px-2.5 py-1 text-[10px] font-bold text-[#F97316]">
            ● LIVE — TikTok @bangbayaudio
          </span>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="grid grid-cols-[57px_1fr_130px_120px_110px_76px] items-center border-b border-white/10 py-2 text-center text-[15px] font-bold text-white">
            <span>Rank</span>
            <span>Post</span>
            <span>Type</span>
            <span>Likes</span>
            <span>Comments</span>
            <span>Score</span>
          </div>

          {/* Rows — data asli kalau ada */}
          {hasLive
            ? livePosts.map((row, i) => {
                const score = scoreFor(row);
                return (
                  <a
                    key={row.id}
                    href={row.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid grid-cols-[57px_1fr_130px_120px_110px_76px] items-center border-b border-white/10 py-[10px] text-center text-[15px] font-bold text-white transition-colors hover:bg-[#232A3D]"
                  >
                    <div className="mx-auto flex h-[35px] w-[57px] items-center justify-center rounded-[5px] bg-[#17182C]">
                      {i + 1}
                    </div>
                    <div className="flex min-w-0 items-center gap-2 px-2 text-left">
                      {row.picture && (
                        <Image
                          src={row.picture}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-[5px] object-cover"
                          unoptimized
                        />
                      )}
                      <span className="line-clamp-2 text-[13px] leading-tight text-white/90">
                        {row.message || "Tanpa caption"}
                      </span>
                    </div>
                    <span>TikTok</span>
                    <span>{fmtNum(row.likeCount ?? 0)}</span>
                    <span>{fmtNum(row.commentCount ?? 0)}</span>
                    <div className="mx-auto flex h-[35px] w-[57px] items-center justify-center rounded-[5px] bg-[#0D201F]">
                      {score}
                    </div>
                  </a>
                );
              })
            : TOP_POSTS_MOCK.map((row) => (
                <div
                  key={row.rank}
                  className="grid grid-cols-[57px_1fr_130px_120px_110px_76px] items-center border-b border-white/10 py-[10px] text-center text-[15px] font-bold text-white"
                >
                  <div className="mx-auto flex h-[35px] w-[57px] items-center justify-center rounded-[5px] bg-[#17182C]">
                    {row.rank}
                  </div>
                  <span className="truncate px-2">{row.title}</span>
                  <span>{row.type}</span>
                  <span>{row.likes}</span>
                  <span>{row.reach}</span>
                  <div className="mx-auto flex h-[35px] w-[57px] items-center justify-center rounded-[5px] bg-[#0D201F]">
                    {row.score}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

export default TopPostsTable;
