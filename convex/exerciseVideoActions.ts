"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { getJson } from "serpapi";

export const searchAndStoreVideos = action({
  args: {
    exerciseId: v.id("exercises"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const serpApiKey = process.env.SERP_API_KEY;
    if (!serpApiKey) {
      throw new Error("SERP_API_KEY environment variable is not set");
    }

    try {
      // Use SerpAPI library with built-in TypeScript types
      const response = await getJson("google_short_videos", {
        api_key: serpApiKey,
        q: args.searchQuery,
        hl: "en",
      });

      const videoResults = response.short_video_results || [];
      const searchDate = Date.now();

      let videosFound = 0;
      let videosSkipped = 0;

      for (let i = 0; i < Math.min(videoResults.length, 10); i++) {
        const video = videoResults[i];

        // Validate required fields
        const missingFields = [];
        if (!video.title) missingFields.push("title");
        if (!video.link) missingFields.push("link");
        if (!video.thumbnail) missingFields.push("thumbnail");
        if (!video.source) missingFields.push("source");
        if (!video.channel) missingFields.push("channel");

        if (missingFields.length > 0) {
          console.error(`Skipping video at position ${video.position || i + 1}: missing required fields: ${missingFields.join(", ")}`, {
            position: video.position || i + 1,
            title: video.title,
            link: video.link,
            source: video.source,
            channel: video.channel,
            missingFields,
          });
          videosSkipped++;
          continue;
        }

        const videoData = {
          position: video.position || i + 1,
          title: video.title,
          link: video.link,
          thumbnail: video.thumbnail,
          clip: video.clip,
          source: video.source,
          sourceIcon: video.source_icon,
          channel: video.channel,
          searchQuery: args.searchQuery,
          searchDate,
        };

        try {
          const videoId = await ctx.runMutation(api.exerciseVideos.findOrCreateVideo, videoData);

          if (videoId) {
            videosFound++;
            await ctx.runMutation(api.exerciseVideos.linkVideoToExercise, {
              exerciseId: args.exerciseId,
              videoId,
            });
          }
        } catch (error) {
          console.error(`Failed to store video at position ${video.position || i + 1}:`, error);
          videosSkipped++;
        }
      }

      return {
        success: true,
        videosFound,
        videosSkipped,
        searchQuery: args.searchQuery,
      };
    } catch (error) {
      console.error("Error searching videos:", error);
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});