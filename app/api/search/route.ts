"use server";
import { SearchResult } from "@/lib/types";
import { fetchAndScrapeSnippet } from "@/lib/utils";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fetch from "node-fetch";

const PAGE_SIZE = 5;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  const encodedQuery = encodeURIComponent(`site:.jp ${query}`);
  const response = await fetch(
    `https://duckduckgo.com/html/?q=${encodedQuery}`
  );
  const html = await response.text();
  const results: SearchResult[] = [];

  const regex =
    /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null && matches.length < PAGE_SIZE) {
    let link = match[1];
    if (link.startsWith("//duckduckgo.com/l/?uddg=")) {
      link = decodeURIComponent(link.split("uddg=")[1].split("&")[0]);
    }
    matches.push({
      title: match[2].replace(/<[^>]*>?/gm, ""),
      link,
      originalSnippet: match[3].replace(/<[^>]*>?/gm, ""),
    });
  }

  // 並列リクエストを実行
  const promises = matches.map(async ({ title, link, originalSnippet }) => {
    let snippet = await fetchAndScrapeSnippet(link);
    if (
      !snippet ||
      snippet.includes("Please enable cookies") ||
      snippet.includes("Sorry, you have been blocked")
    ) {
      snippet = originalSnippet;
    }
    return { title, link, snippet };
  });

  const fetchedResults = await Promise.all(promises);

  return NextResponse.json({ results: fetchedResults });
}
