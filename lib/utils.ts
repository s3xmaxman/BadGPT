import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import * as Exa from "exa-js"; // ここを修正しました
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { createRetrieverTool } from "langchain/tools/retriever";
import { ExaRetriever } from "@langchain/exa";

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
  maxDocContentLength: 4000,
});

// ExaSearch を実行するためのツール
export async function exaSearch(keyword: string) {
  const client = new Exa.default(process.env.EXASEARCH_API_KEY); // ここも修正

  const exaRetriever = new ExaRetriever({
    client,
    searchArgs: {
      numResults: 2,
    },
  });

  const searchTool = createRetrieverTool(exaRetriever, {
    name: "search",
    description: "Get the contents of a webpage given a string search query.",
  });

  const tools = [searchTool];

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "llama3-70b-8192",
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
    },
    maxTokens: 8000,
    temperature: 0,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a web researcher who answers user questions by looking up information on the internet and retrieving contents of helpful documents. Cite your sources.`,
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agentExecutor = new AgentExecutor({
    agent: await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    }),
    tools,
  });

  const result = await agentExecutor.invoke({ input: keyword });
  console.log(`ExaSearch result for "${keyword}":`, result);
  return result;
}
