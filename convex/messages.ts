import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import OpenAI from "openai";

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
  },
  handler: async (ctx, args) => {
    // DBのmessagesコレクションに新しいメッセージを挿入
    const newMessageId = await ctx.db.insert("messages", {
      role: args.role,
      content: args.content,
      chatId: args.chatId,
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

// ユーザーのメッセージを受け取り、OpenAI APIを呼び出してアシスタントの応答を生成、DBに保存するアクション
export const submit = action({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")), // メッセージの送信者(user or assistant)
    content: v.string(), // メッセージの内容
    chatId: v.id("chats"), // メッセージが紐づくチャットID
  },
  handler: async (ctx, args) => {
    // 現在のユーザー情報を取得
    const currentUser = await ctx.runQuery(api.users.currentUser, {});

    // ログインしていない場合はエラー
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    // ユーザーのメッセージをDBに保存
    await ctx.runMutation(internal.messages.send, {
      role: args.role,
      content: args.content,
      chatId: args.chatId,
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

    // OpenAI API に渡す system prompt を設定
    formattedMessages.unshift({
      role: "system",
      content:
        "あなたは親切で役に立つアシスタントです。回答は必ず日本語で返してください。",
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
      messages: formattedMessages, // system prompt を含むメッセージ履歴を渡す
      temperature: 1,
      max_tokens: 420,
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
  args: { messageId: v.id("messages"), content: v.string() }, // メッセージIDと更新する内容を引数として受け取る
  handler: async (ctx, args) => {
    // 指定されたメッセージIDのメッセージの内容を更新
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});
