import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const getVideosForExercise = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("exerciseVideos")
      .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId))
      .collect();

    const videos = await Promise.all(
      relationships.map(async (rel) => {
        const video = await ctx.db.get(rel.videoId);
        return video;
      })
    );

    return videos.filter((video) => video !== null);
  },
});


export const insertVideo = mutation({
  args: {
    position: v.number(),
    title: v.string(),
    link: v.string(),
    thumbnail: v.string(),
    clip: v.optional(v.string()),
    source: v.string(),
    sourceIcon: v.optional(v.string()),
    channel: v.string(),
    searchQuery: v.string(),
    searchDate: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("videos", args);
  },
});

export const findOrCreateVideo = mutation({
  args: {
    position: v.number(),
    title: v.string(),
    link: v.string(),
    thumbnail: v.string(),
    clip: v.optional(v.string()),
    source: v.string(),
    sourceIcon: v.optional(v.string()),
    channel: v.string(),
    searchQuery: v.string(),
    searchDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if video with this link already exists
    const existingVideo = await ctx.db
      .query("videos")
      .withIndex("by_link", (q) => q.eq("link", args.link))
      .first();

    if (existingVideo) {
      // Video already exists, return its ID
      return existingVideo._id;
    }

    // Video doesn't exist, create it
    return await ctx.db.insert("videos", args);
  },
});

export const linkVideoToExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    videoId: v.id("videos"),
  },
  handler: async (ctx, args) => {
    const existingLink = await ctx.db
      .query("exerciseVideos")
      .withIndex("by_both", (q) =>
        q.eq("exerciseId", args.exerciseId).eq("videoId", args.videoId)
      )
      .first();

    if (existingLink) {
      return existingLink._id;
    }

    return await ctx.db.insert("exerciseVideos", args);
  },
});

export const unlinkVideoFromExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    videoId: v.id("videos"),
  },
  handler: async (ctx, args) => {
    const existingLink = await ctx.db
      .query("exerciseVideos")
      .withIndex("by_both", (q) =>
        q.eq("exerciseId", args.exerciseId).eq("videoId", args.videoId)
      )
      .first();

    if (existingLink) {
      await ctx.db.delete(existingLink._id);
      return true;
    }

    return false;
  },
});

export const getAllVideosForQuery = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_search", (q) => q.eq("searchQuery", args.searchQuery))
      .order("asc")
      .collect();
  },
});