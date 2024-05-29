import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import OpenAI from "openai";
import { extractKeywords, wikipedia } from "../lib/utils";

// 特定のチャットに紐づくメッセージ一覧を取得するクエリ
export const list = query({
  args: { chatId: v.id("chats") }, // chatId を引数として受け取る
  handler: async (ctx, args) => {
    // DB から messages コレクションを取得
    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId)) // chatId でインデックスを作成し、指定された chatId に一致するメッセージのみ取得
      .collect();
  },
});

// メッセージをDBに保存する内部mutation
export const send = internalMutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")), // メッセージの送信者(user or assistant)
    content: v.string(), // メッセージの内容
    chatId: v.id("chats"), // メッセージが紐づくチャットID
    duckGo: v.optional(v.string()),
    wiki: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // DBのmessagesコレクションに新しいメッセージを挿入
    const newMessageId = await ctx.db.insert("messages", {
      role: args.role,
      content: args.content,
      chatId: args.chatId,
      duckGo: args.duckGo,
      wiki: args.wiki,
    });

    // 新しく挿入されたメッセージのIDを返す
    return newMessageId;
  },
});

// チャットの直近3件のメッセージを取得する内部クエリ
export const retrieve = internalQuery({
  args: { chatId: v.id("chats") }, // chatId を引数として受け取る
  handler: async (ctx, args) => {
    // DB から messages コレクションを取得
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId)) // chatId でインデックスを作成し、指定された chatId に一致するメッセージのみ取得
      .order("desc") // 降順にソート（新しいものが先頭に来るように）
      .take(3); // 最大3件まで取得

    // 取得したメッセージを返す
    return messages;
  },
});

export const submit = action({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    chatId: v.id("chats"),
    duckGo: v.optional(v.string()),
    wiki: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 現在のユーザー情報を取得
    const currentUser = await ctx.runQuery(api.users.currentUser, {});

    // ログインしていない場合はエラー
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    // ユーザーの質問から検索するキーワードを抽出
    const keywords = extractKeywords(args.content);

    // WikipediaとExaSearchから情報を取得
    const wikipediaResults = await Promise.all(
      keywords.map(async (keyword) => await wikipedia.invoke(keyword))
    );

    // Wikipediaの検索結果を結合
    const formattedWikipediaResults = wikipediaResults.join("\n\n");

    // ユーザーのメッセージをDBに保存
    await ctx.runMutation(internal.messages.send, {
      role: args.role,
      content: args.content,
      chatId: args.chatId,
      duckGo: args.duckGo,
      wiki: formattedWikipediaResults,
    });

    // 直近のチャットメッセージを取得
    const messages = await ctx.runQuery(internal.messages.retrieve, {
      chatId: args.chatId,
    });

    // メッセージの順番を反転（古いものが先頭に来るように）
    messages.reverse();

    // OpenAI API に渡すメッセージフォーマットに変換
    const formattedMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const contextParts = [
      ...wikipediaResults.map(
        (result, index) => `Wikipedia:${index + 1}: ${result}`
      ),
    ];

    if (args.duckGo) {
      contextParts.push(`DuckDuckGo: ${args.duckGo}`);
    }

    // 情報源が存在しない場合のメッセージを追加
    if (contextParts.length === 0) {
      contextParts.push(
        "情報源が見つかりませんでしたが、以下の応答をご参考ください。"
      );
    }

    const context = contextParts.join("\n\n");

    // OpenAI API に渡す system prompt を設定
    formattedMessages.unshift({
      role: "system",
      content: `You are a kind assistant named BadGPT. Always respond in Japanese.
      Refer to these sources:\n\n${context}\n\n 
      `,
    });

    // OpenAI API クライアントを初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // レスポンスを格納する変数を初期化
    let response = "";

    // OpenAI API を呼び出してアシスタントの応答をストリーミングで取得
    const stream = await openai.chat.completions.create({
      model: currentUser.model,
      stream: true,
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 8000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // 空のメッセージとしてアシスタントのメッセージをDBに保存
    // (ストリーミングで内容を更新していくため)
    const newAssistantMessage = await ctx.runMutation(internal.messages.send, {
      role: "assistant",
      content: "",
      chatId: args.chatId,
    });

    // ストリーミングで受信したレスポンスを処理
    for await (const part of stream) {
      // レスポンスに内容が含まれていない場合はエラー
      if (part.choices[0].delta.content === null) {
        throw new Error("No content in response");
      }

      // レスポンスに内容が含まれている場合
      if (part.choices[0].delta.content !== undefined) {
        // レスポンスをこれまでのレスポンスに追加
        response += part.choices[0].delta.content;

        // DB に保存されているアシスタントのメッセージの内容を更新
        await ctx.runMutation(internal.messages.update, {
          messageId: newAssistantMessage,
          content: response,
        });
      }
    }
  },
});

// メッセージの内容を更新する内部mutation
export const update = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  }, // メッセージIDと更新する内容を引数として受け取る
  handler: async (ctx, args) => {
    // 指定されたメッセージIDのメッセージの内容を更新
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

export const regenerate = action({
  args: {
    chatId: v.id("chats"), // メッセージが紐づくチャットID
  },
  handler: async (ctx, args) => {
    // 現在のユーザー情報を取得
    const currentUser = await ctx.runQuery(api.users.currentUser, {});
    // ログインしていない場合はエラー
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    // 直近のチャットメッセージを取得 (最後の3件)
    const messages = await ctx.runQuery(internal.messages.retrieve, {
      chatId: args.chatId,
    });

    // メッセージが存在しない場合はエラー
    if (messages.length === 0) {
      throw new Error("No messages to regenerate");
    }

    // 最後のメッセージを取得
    const lastMessage = messages[0];

    // 最後のメッセージがアシスタントのものであることを確認
    if (lastMessage.role !== "assistant") {
      throw new Error("Last message is not from the assistant");
    }

    // 最後のメッセージをDBから削除
    await ctx.runMutation(internal.messages.deleteMessage, {
      messageId: lastMessage._id,
    });

    // メッセージの順番を反転（古いものが先頭に来るように）
    messages.reverse();

    // OpenAI API に渡すメッセージフォーマットに変換
    // (最後のメッセージは含めずに、それ以前のメッセージ履歴を使用)
    const messagesForRegenerate = messages.slice(1).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // ユーザーの質問を取得
    const userMessage = messages.find(
      // 変更点: messages から探す
      (message) => message.role === "user"
    );

    if (!userMessage) {
      throw new Error("No user message found");
    }

    // ユーザーの質問からWikipediaで検索するキーワードを抽出
    const keywords = extractKeywords(userMessage.content);

    // WikipediaとExaSearchから情報を取得
    const wikipediaResults = await Promise.all(
      keywords.map((keyword) => wikipedia.invoke(keyword))
    );

    // 取得した情報を整形して context としてまとめる
    const contextParts = [
      ...wikipediaResults.map(
        (result, index) => `Wikipedia:${index + 1}: ${result}`
      ),
    ];

    // 情報源が存在しない場合のメッセージを追加
    if (contextParts.length === 0) {
      contextParts.push(
        "情報源が見つかりませんでしたが、以下の応答をご参考ください。"
      );
    }

    // context を結合
    const context = contextParts.join("\n\n");

    // OpenAI API に渡す system prompt を設定
    messagesForRegenerate.unshift({
      role: "system",
      content: `You are a kind assistant named BadGPT. Always respond in Japanese.
      Refer to these sources:\n\n${context}\n\n
      `,
    });

    // OpenAI API クライアントを初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // レスポンスを格納する変数を初期化
    let response = "";

    // OpenAI API を呼び出してアシスタントの応答をストリーミングで取得
    const stream = await openai.chat.completions.create({
      model: currentUser.model,
      stream: true,
      messages: messagesForRegenerate, // system prompt を含むメッセージ履歴を渡す
      temperature: 0.7,
      max_tokens: 8000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // 空のメッセージとしてアシスタントのメッセージをDBに保存
    // (ストリーミングで内容を更新していくため)
    const newAssistantMessage = await ctx.runMutation(internal.messages.send, {
      role: "assistant",
      content: "",
      chatId: args.chatId,
    });

    // ストリーミングで受信したレスポンスを処理
    for await (const part of stream) {
      // レスポンスに内容が含まれていない場合はエラー
      if (part.choices[0].delta.content === null) {
        throw new Error("No content in response");
      }

      // レスポンスに内容が含まれている場合
      if (part.choices[0].delta.content !== undefined) {
        // レスポンスをこれまでのレスポンスに追加
        response += part.choices[0].delta.content;

        // DB に保存されているアシスタントのメッセージの内容を更新
        await ctx.runMutation(internal.messages.update, {
          messageId: newAssistantMessage,
          content: response,
        });
      }
    }
  },
});

// メッセージを削除するinternalMutation
export const deleteMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});
