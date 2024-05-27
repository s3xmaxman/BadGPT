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
  const response = await fetch(
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  );
  const html = await response.text();
  const results: SearchResult[] = [];

  const regex =
    /<a rel="nofollow" class="result__a" href="([^"]+)">([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null && count < 5) {
    const title = match[2];
    const link = match[1];
    const snippet = match[3].replace(/<[^>]*>?/gm, "");
    results.push({ title: title, link: link, snippet: snippet });
    count++;
  }

  console.log("API response:", results);
  return NextResponse.json({
    results,
  });
}
