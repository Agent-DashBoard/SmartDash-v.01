// app/api/zernio/route.ts — proxy Zernio API (server-side, key aman).
// Menyajikan data asli dashboard: akun terhubung + posts (TikTok/YouTube).
// Endpoint Zernio yang dipakai:
//   GET /accounts            → daftar akun + followers
//   GET /accounts/{id}/posts → daftar video/post + like/comment/share
//   GET /analytics           → overview + akun

import { NextResponse } from "next/server";

const ZERNIO_BASE = "https://zernio.com/api/v1";

async function fetchZernio(path: string) {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json(
      { error: "ZERNIO_API_KEY not configured or invalid. Set it in .env.local" },
      { status: 400 }
    );
  }
  const res = await fetch(`${ZERNIO_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error || `Zernio API error: ${res.status}` },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}

// GET /api/zernio?path=accounts        → daftar akun
// GET /api/zernio?path=accounts/{id}/posts → posts akun
// GET /api/zernio?path=analytics       → overview + akun
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "accounts";
  // Whitelist path biar nggak jadi proxy bebas
  if (!/^[a-zA-Z0-9_\-/]+$/.test(path) || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  return fetchZernio(`/${path}`);
}
