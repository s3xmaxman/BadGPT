"use server";
import { SearchResult } from "@/lib/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

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
  while ((match = regex.exec(html)) !== null && matches.length < 5) {
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

// URL からコンテンツを取得し、スニペットを生成する関数
async function fetchAndScrapeSnippet(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { timeout: 5000 }); // タイムアウト設定
    const html = await response.text();
    const $ = cheerio.load(html);

    let snippet = $('meta[name="description"]').attr("content");

    if (!snippet) {
      const importantText = $("h1, h2, p").text().replace(/\s+/g, " ").trim();
      snippet = importantText.substring(0, 200) + "...";
    }

    return snippet;
  } catch (error) {
    console.error(`Error fetching or scraping ${url}:`, error);
    return null;
  }
}
