import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";

export const list = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});

export const send = internalMutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const newMessageId = await ctx.db.insert("messages", {
      role: args.role,
      content: args.content,
      chatId: args.chatId,
    });

    return newMessageId;
  },
});

export const submit = action({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(api.users.currentUser, {});

    if (!currentUser) {
      throw new Error("Not logged in");
    }

    //send message
    await ctx.runMutation(internal.messages.send, {
      role: args.role,
      content: args.content,
      chatId: args.chatId,
    });
  },
});
