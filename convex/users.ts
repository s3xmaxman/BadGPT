import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to create a user");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      return user._id;
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      model: "llama3-8b-8192",
    });

    await ctx.db.insert("chats", {
      userId: userId,
      title: "New Chat",
    });

    return userId;
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called selectGPT without authenticated user");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});

export const selectGPT = mutation({
  args: {
    modal: v.union(v.literal("llama3-8b-8192"), v.literal("llama3-70b-8192")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to create a user");
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

    await ctx.db.patch(user._id, { model: args.modal });

    return user._id;
  },
});

export const upgradeModel = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be logged in to upgrade your model.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user === null) {
      throw new Error("User not found.");
    }

    // モデルが既にアップグレードされている場合は何もしない
    if (user.model === "llama3-70b-8192") {
      return user._id;
    }

    // モデルをアップグレード
    await ctx.db.patch(user._id, { model: "llama3-70b-8192" });

    return user._id;
  },
});

export const updateSubscription = internalMutation({
  args: {
    subscriptionId: v.string(),
    userId: v.id("users"),
    endsOn: v.number(),
  },
  handler: async (ctx, { subscriptionId, userId, endsOn }) => {
    await ctx.db.patch(userId, {
      subscriptionId: subscriptionId,
      endsOn: endsOn,
    });
  },
});

export const updateSubscriptionById = internalMutation({
  args: { subscriptionId: v.string(), endsOn: v.number() },
  handler: async (ctx, { subscriptionId, endsOn }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_subscriptionId", (q) =>
        q.eq("subscriptionId", subscriptionId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found!");
    }

    await ctx.db.patch(user._id, {
      endsOn: endsOn,
    });
  },
});
