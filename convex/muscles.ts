import { v } from "convex/values";
import { query } from "./_generated/server";

// Get a single muscle by ID
export const get = query({
  args: { muscleId: v.id("muscles") },
  handler: async (ctx, args) => {
    const muscle = await ctx.db.get(args.muscleId);
    return muscle;
  },
});

// List all muscles
export const list = query(async (ctx) => {
  const muscles = await ctx.db.query("muscles").collect();

  return muscles;
});

// Get exercise counts for a specific muscle by role
export const getExerciseCounts = query({
  args: { muscleId: v.id("muscles") },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("exerciseMuscles")
      .withIndex("by_muscle", (q) => q.eq("muscleId", args.muscleId))
      .collect();

    const counts = {
      target: 0,
      lengthening: 0,
      synergist: 0,
      stabilizer: 0,
      total: 0,
    };

    relationships.forEach((rel) => {
      counts[rel.role]++;
      counts.total++;
    });

    return counts;
  },
});

// Get exercise counts for all muscles (for efficient bulk loading)
export const getAllExerciseCounts = query(async (ctx) => {
  const muscles = await ctx.db.query("muscles").collect();
  const allRelationships = await ctx.db.query("exerciseMuscles").collect();

  const muscleExerciseCounts: Record<
    string,
    {
      target: number;
      lengthening: number;
      synergist: number;
      stabilizer: number;
      total: number;
      hasAnyExercises: boolean;
    }
  > = {};

  // Initialize counts for all muscles
  muscles.forEach((muscle) => {
    muscleExerciseCounts[muscle._id] = {
      target: 0,
      lengthening: 0,
      synergist: 0,
      stabilizer: 0,
      total: 0,
      hasAnyExercises: false,
    };
  });

  // Count relationships
  allRelationships.forEach((rel) => {
    if (muscleExerciseCounts[rel.muscleId]) {
      muscleExerciseCounts[rel.muscleId][rel.role]++;
      muscleExerciseCounts[rel.muscleId].total++;
      muscleExerciseCounts[rel.muscleId].hasAnyExercises = true;
    }
  });

  return muscleExerciseCounts;
});
