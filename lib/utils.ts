import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ExaSearchResults } from "@langchain/exa";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import Exa from "exa-js";
import { pull } from "langchain/hub";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ユーザーの質問からWikipediaで検索するキーワードを抽出する関数
export function extractKeywords(question: string): string[] {
  // TODO: ユーザーの質問から適切なキーワードを抽出するロジックを実装する
  // 例: 形態素解析やキーワード抽出ライブラリを利用する
  return [question]; // とりあえずここでは質問全体をキーワードとして返す
}

// Wikipedia クエリを実行するためのツール
export const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
});

export async function exaSearch(keyword: string) {
  const tools = [
    new ExaSearchResults({
      client: new Exa(process.env.EXASEARCH_API_KEY),
    }),
  ];

  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/openai-functions-agent"
  );

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    streaming: false,
    model: "llama3-70b-8192",
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
    },
    topP: 0.9,
    maxTokens: 8000,
    frequencyPenalty: 0,
    presencePenalty: 0,
    temperature: 0.7,
  });

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const result = await agentExecutor.invoke({ input: keyword });
  console.log(`ExaSearch result for "${keyword}":`, result); // 取得結果を出力
  return result;
}
