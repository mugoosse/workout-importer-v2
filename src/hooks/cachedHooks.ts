/**
 * Cached versions of Convex hooks that provide persistent caching across component unmounts.
 * This solves the navigation issue where going back to a page shows a loading spinner
 * even though the same query was just executed.
 */

import { useQuery as useCachedQuery } from "convex-helpers/react/cache/hooks";
import { useRef } from "react";
import { FunctionReference, FunctionReturnType } from "convex/server";

// Export the cached useQuery hook
export { useCachedQuery };

export function useCachedStableQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: Query["_args"],
): {
  data: FunctionReturnType<Query> | undefined;
  isStale: boolean;
} {
  const result = useCachedQuery(query, args);
  const stored = useRef<FunctionReturnType<Query> | undefined>(result);

  // Data is stale when query is loading but we have previous data
  const isStale = result === undefined && stored.current !== undefined;

  // Only update stored value when we have fresh data
  if (result !== undefined) {
    stored.current = result;
  }

  return {
    data: stored.current,
    isStale,
  };
}
