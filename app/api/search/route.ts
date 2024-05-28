"use server";
import { SearchResult } from "@/lib/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fetch from "node-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  // DuckDuckGo の検索クエリに日本語サイトのみに絞り込むための条件を追加
  const encodedQuery = encodeURIComponent(`site:.jp ${query}`);

  const response = await fetch(
    `https://duckduckgo.com/html/?q=${encodedQuery}`
  );
  const html = await response.text();
  const results: SearchResult[] = [];

  // リンクの正規表現を修正
  const regex =
    /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null && count < 5) {
    let link = match[1];

    if (link.startsWith("//duckduckgo.com/l/?uddg=")) {
      link = decodeURIComponent(link.split("uddg=")[1].split("&")[0]);
    }

    const title = match[2].replace(/<[^>]*>?/gm, "");
    const snippet = match[3].replace(/<[^>]*>?/gm, "");

    results.push({ title, link, snippet });
    count++;
  }

  // 検索結果を返す
  return NextResponse.json({ results });
}
