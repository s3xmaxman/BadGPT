import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

//Create
export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to create a chat");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user === null) {
      throw new Error("User not found");
    }

    const chatId = await ctx.db.insert("chats", {
      userId: user._id,
      title: "New Chat",
    });

    return chatId;
  },
});

//GetAll
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to list chats");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user === null) {
      throw new Error("User not found");
    }

    return ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

//Rename
export const rename = mutation({
  args: { id: v.id("chats"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

//Remove
export const remove = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
