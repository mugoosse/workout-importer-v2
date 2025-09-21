/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as exerciseHelpers from "../exerciseHelpers.js";
import type * as exerciseVideoActions from "../exerciseVideoActions.js";
import type * as exerciseVideos from "../exerciseVideos.js";
import type * as exercises from "../exercises.js";
import type * as http from "../http.js";
import type * as muscles from "../muscles.js";
import type * as seedEquipment from "../seedEquipment.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  exerciseHelpers: typeof exerciseHelpers;
  exerciseVideoActions: typeof exerciseVideoActions;
  exerciseVideos: typeof exerciseVideos;
  exercises: typeof exercises;
  http: typeof http;
  muscles: typeof muscles;
  seedEquipment: typeof seedEquipment;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
