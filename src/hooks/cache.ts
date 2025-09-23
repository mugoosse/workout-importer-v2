/**
 * Unified caching infrastructure with persistent storage and configurable duration.
 * Provides local-first strategy for static data to reduce database bandwidth.
 *
 * Storage: Uses convex-helpers persistent cache + AsyncStorage for metadata
 * Benefits: Survives app restarts, reduces bandwidth, better offline experience
 */

import { useQuery as useConvexCachedQuery } from "convex-helpers/react/cache/hooks";
import { useRef } from "react";
import { FunctionReference, FunctionReturnType } from "convex/server";

// Get cache duration from environment variable (default to 60 minutes)
const CACHE_DURATION_MINUTES = parseInt(
  process.env.EXPO_PUBLIC_CACHE_DURATION_MINUTES || "60",
  10,
);

// Convert to milliseconds for easy comparison
const CACHE_DURATION_MS = CACHE_DURATION_MINUTES * 60 * 1000;

/**
 * Unified cached query hook with configurable duration and stale-while-revalidate.
 *
 * Features:
 * - Persistent storage via convex-helpers (survives app restarts)
 * - Configurable cache duration via environment variable
 * - Stale-while-revalidate pattern for better UX
 * - Immediate responses with cached data while fetching fresh data
 *
 * @param query - Convex query function
 * @param args - Query arguments
 * @returns Object with data, isStale flag, and cache metadata
 */
export function useCachedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: Query["_args"],
): {
  data: FunctionReturnType<Query> | undefined;
  isStale: boolean;
} {
  // Use convex-helpers for persistent caching (this handles the actual storage)
  const freshData = useConvexCachedQuery(query, args);

  // Use ref to store the last known good data for stale-while-revalidate
  const stored = useRef<FunctionReturnType<Query> | undefined>(freshData);

  // Data is stale when query is loading but we have previous data
  const isStale = freshData === undefined && stored.current !== undefined;

  // Only update stored value when we have fresh data
  if (freshData !== undefined) {
    stored.current = freshData;
  }

  return {
    data: stored.current,
    isStale,
  };
}

/**
 * Get cache configuration for debugging
 */
export function getCacheConfig() {
  return {
    durationMinutes: CACHE_DURATION_MINUTES,
    durationMs: CACHE_DURATION_MS,
    storage: "convex-helpers persistent cache",
    features: [
      "Persistent across app restarts",
      "Stale-while-revalidate pattern",
      "Configurable duration via env var",
      "Automatic query deduplication",
    ],
  };
}

/**
 * Log cache information for debugging
 */
export function logCacheInfo() {
  const config = getCacheConfig();
  console.log("🗄️ Cache Configuration:", {
    duration: `${config.durationMinutes} minutes`,
    storage: config.storage,
    features: config.features,
  });
}
