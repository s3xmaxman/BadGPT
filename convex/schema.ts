import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    model: v.union(v.literal("llama3-8b-8192"), v.literal("llama3-70b-8192")),
    endsOn: v.optional(v.number()),
    subscriptionId: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_subscriptionId", ["subscriptionId"]),
  chats: defineTable({
    userId: v.id("users"),
    title: v.string(),
  }).index("by_userId", ["userId"]),
  messages: defineTable({
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    chatId: v.id("chats"),
  }).index("by_chatId", ["chatId"]),
});
