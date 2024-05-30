import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ユーザーの質問からWikipediaで検索するキーワードを抽出する関数
export function extractKeywords(question: string): string[] {
  // TODO: ユーザーの質問から適切なキーワードを抽出するロジックを実装する
  return [question]; // とりあえずここでは質問全体をキーワードとして返す
}

// Wikipedia クエリを実行するためのツール
export const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 3000,
});

// DuckDuckGoSearch を実行するためのツール
export const duckGoSearch = async (query: string) => {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.results)) {
      throw new Error("API response is not an array");
    }

    return data.results;
  } catch (error: any) {
    console.error("Failed to fetch search results:", error);
    throw error;
  }
};

// URL からコンテンツを取得し、スニペットを生成する関数
export async function fetchAndScrapeSnippet(
  url: string
): Promise<string | null> {
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
