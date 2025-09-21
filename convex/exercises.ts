import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  normalizeMuscleName,
  parseExerciseType,
  parseEquipment,
  parseMuscles,
  findMuscleByName,
  findEquipmentByName,
  type ExerciseType,
  type MuscleRole,
} from "./exerciseHelpers";

export const get = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.exerciseId);
  },
});

export const getExercisesByIds = query({
  args: { exerciseIds: v.array(v.id("exercises")) },
  handler: async (ctx, args) => {
    const exercises = await Promise.all(
      args.exerciseIds.map((id) => ctx.db.get(id))
    );

    // Filter out null exercises and get their details
    const validExercises = exercises.filter(
      (exercise): exercise is NonNullable<typeof exercise> => exercise !== null
    );

    const exercisesWithDetails = await Promise.all(
      validExercises.map(async (exercise) => {
        const [muscleRelationships, equipmentRelationships] = await Promise.all([
          ctx.db
            .query("exerciseMuscles")
            .withIndex("by_exercise", (q) => q.eq("exerciseId", exercise._id))
            .collect(),
          ctx.db
            .query("exerciseEquipment")
            .withIndex("by_exercise", (q) => q.eq("exerciseId", exercise._id))
            .collect(),
        ]);

        const [muscles, equipment] = await Promise.all([
          Promise.all(
            muscleRelationships.map(async (rel) => ({
              muscle: await ctx.db.get(rel.muscleId),
              role: rel.role,
            }))
          ),
          Promise.all(
            equipmentRelationships.map((rel) => ctx.db.get(rel.equipmentId))
          ),
        ]);

        return {
          ...exercise,
          muscles: muscles.filter((m) => m.muscle),
          equipment: equipment.filter(Boolean),
        };
      })
    );

    return exercisesWithDetails;
  },
});

export const importExercise = mutation({
  args: {
    title: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    exerciseType: v.string(),
    equipmentNames: v.array(v.string()),
    muscles: v.object({
      target: v.array(v.string()),
      lengthening: v.array(v.string()),
      synergist: v.array(v.string()),
      stabilizer: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const exerciseId = await ctx.db.insert("exercises", {
      title: args.title,
      url: args.url,
      description: args.description,
      source: "muscleandmotion.com",
      exerciseType: parseExerciseType(args.exerciseType),
    });

    const errors: string[] = [];

    for (const equipName of args.equipmentNames) {
      const equipmentId = await findEquipmentByName(ctx, equipName);
      if (equipmentId) {
        await ctx.db.insert("exerciseEquipment", {
          exerciseId,
          equipmentId,
        });
      } else {
        errors.push(`Equipment not found: ${equipName}`);
      }
    }

    for (const [role, muscleNames] of Object.entries(args.muscles)) {
      for (const muscleName of muscleNames) {
        if (!muscleName) continue;

        const muscleId = await findMuscleByName(ctx, muscleName);
        if (muscleId) {
          await ctx.db.insert("exerciseMuscles", {
            exerciseId,
            muscleId,
            role: role as MuscleRole,
          });
        } else {
          errors.push(`Muscle not found: ${muscleName} (role: ${role})`);
        }
      }
    }

    return {
      exerciseId,
      errors,
    };
  },
});

export const getExercisesByMuscle = query({
  args: {
    muscleId: v.id("muscles"),
    role: v.optional(
      v.union(
        v.literal("target"),
        v.literal("lengthening"),
        v.literal("synergist"),
        v.literal("stabilizer"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("exerciseMuscles")
      .withIndex("by_muscle", (q) => {
        const base = q.eq("muscleId", args.muscleId);
        return args.role ? base.eq("role", args.role) : base;
      });

    const relationships = await query.collect();
    const exercises = await Promise.all(
      relationships.map((r) => ctx.db.get(r.exerciseId)),
    );

    return exercises.filter(Boolean);
  },
});

export const getExercisesByEquipment = query({
  args: { equipmentId: v.id("equipment") },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("exerciseEquipment")
      .withIndex("by_equipment", (q) => q.eq("equipmentId", args.equipmentId))
      .collect();

    const exercises = await Promise.all(
      relationships.map((r) => ctx.db.get(r.exerciseId)),
    );

    return exercises.filter(Boolean);
  },
});

export const getExercisesByType = query({
  args: {
    exerciseType: v.union(
      v.literal("Weight Reps"),
      v.literal("Reps Only"),
      v.literal("Weighted Bodyweight"),
      v.literal("Assisted Bodyweight"),
      v.literal("Duration"),
      v.literal("Weight & Duration"),
      v.literal("Distance & Duration"),
      v.literal("Weight & Distance"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exercises")
      .withIndex("by_type", (q) => q.eq("exerciseType", args.exerciseType))
      .collect();
  },
});

export const getExerciseDetails = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) return null;

    const [muscleRelationships, equipmentRelationships] = await Promise.all([
      ctx.db
        .query("exerciseMuscles")
        .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId))
        .collect(),
      ctx.db
        .query("exerciseEquipment")
        .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId))
        .collect(),
    ]);

    const [muscles, equipment] = await Promise.all([
      Promise.all(
        muscleRelationships.map(async (rel) => ({
          muscle: await ctx.db.get(rel.muscleId),
          role: rel.role,
        })),
      ),
      Promise.all(
        equipmentRelationships.map((rel) => ctx.db.get(rel.equipmentId)),
      ),
    ]);

    return {
      ...exercise,
      muscles: muscles.filter((m) => m.muscle),
      equipment: equipment.filter(Boolean),
    };
  },
});

export const searchExercises = query({
  args: {
    searchTerm: v.string(),
    exerciseType: v.optional(
      v.union(
        v.literal("Weight Reps"),
        v.literal("Reps Only"),
        v.literal("Weighted Bodyweight"),
        v.literal("Assisted Bodyweight"),
        v.literal("Duration"),
        v.literal("Weight & Duration"),
        v.literal("Distance & Duration"),
        v.literal("Weight & Distance"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const searchQuery = ctx.db
      .query("exercises")
      .withSearchIndex("search_exercises", (q) => {
        const search = q.search("title", args.searchTerm);
        return args.exerciseType
          ? search.eq("exerciseType", args.exerciseType)
          : search;
      });

    return await searchQuery.collect();
  },
});

export const getAllExercises = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("exercises").collect();
  },
});

export const getAllEquipment = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("equipment").collect();
  },
});

export const linkExerciseToMuscle = mutation({
  args: {
    exerciseId: v.id("exercises"),
    muscleName: v.string(),
    role: v.union(
      v.literal("target"),
      v.literal("lengthening"),
      v.literal("synergist"),
      v.literal("stabilizer"),
    ),
  },
  handler: async (ctx, args) => {
    try {
      const muscleId = await findMuscleByName(ctx, args.muscleName);

      if (!muscleId) {
        return {
          success: false,
          error: `Muscle not found: ${args.muscleName}`,
        };
      }

      // Check if link already exists
      const existing = await ctx.db
        .query("exerciseMuscles")
        .withIndex("by_exercise_and_muscle", (q) =>
          q.eq("exerciseId", args.exerciseId).eq("muscleId", muscleId),
        )
        .filter((q) => q.eq(q.field("role"), args.role))
        .first();

      if (existing) {
        return {
          success: true,
          message: "Link already exists",
        };
      }

      await ctx.db.insert("exerciseMuscles", {
        exerciseId: args.exerciseId,
        muscleId,
        role: args.role,
      });

      return {
        success: true,
        message: "Link created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const findDuplicateExercises = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();

    // Group by title
    const titleGroups: Record<string, any[]> = {};
    for (const exercise of exercises) {
      if (!titleGroups[exercise.title]) {
        titleGroups[exercise.title] = [];
      }
      titleGroups[exercise.title].push(exercise);
    }

    // Find duplicates
    const duplicates = [];
    const uniqueTitles = [];

    for (const [title, exerciseGroup] of Object.entries(titleGroups)) {
      if (exerciseGroup.length > 1) {
        duplicates.push({
          title,
          count: exerciseGroup.length,
          exercises: exerciseGroup.sort(
            (a, b) => a._creationTime - b._creationTime,
          ),
        });
      } else {
        uniqueTitles.push(title);
      }
    }

    return {
      totalExercises: exercises.length,
      uniqueTitles: Object.keys(titleGroups).length,
      duplicateGroups: duplicates.length,
      totalDuplicates: duplicates.reduce(
        (sum, group) => sum + group.count - 1,
        0,
      ),
      duplicates: duplicates.sort((a, b) => b.count - a.count),
      sampleUnique: uniqueTitles.slice(0, 5),
    };
  },
});

export const analyzeExerciseRelationships = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    const muscleRelationships = await ctx.db.query("exerciseMuscles").collect();
    const equipmentRelationships = await ctx.db
      .query("exerciseEquipment")
      .collect();

    // Group relationships by exercise
    const exerciseStats = exercises.map((exercise) => {
      const muscleCount = muscleRelationships.filter(
        (rel) => rel.exerciseId === exercise._id,
      ).length;
      const equipmentCount = equipmentRelationships.filter(
        (rel) => rel.exerciseId === exercise._id,
      ).length;

      return {
        id: exercise._id,
        title: exercise.title,
        creationTime: exercise._creationTime,
        muscleRelationships: muscleCount,
        equipmentRelationships: equipmentCount,
        totalRelationships: muscleCount + equipmentCount,
      };
    });

    const exercisesWithNoRelationships = exerciseStats.filter(
      (ex) => ex.totalRelationships === 0,
    );
    const exercisesWithRelationships = exerciseStats.filter(
      (ex) => ex.totalRelationships > 0,
    );

    return {
      totalExercises: exercises.length,
      totalMuscleRelationships: muscleRelationships.length,
      totalEquipmentRelationships: equipmentRelationships.length,
      exercisesWithNoRelationships: exercisesWithNoRelationships.length,
      exercisesWithRelationships: exercisesWithRelationships.length,
      sampleNoRelationships: exercisesWithNoRelationships
        .slice(0, 10)
        .map((ex) => ({
          title: ex.title,
          id: ex.id,
        })),
      relationshipDistribution: {
        noRelationships: exercisesWithNoRelationships.length,
        onlyMuscle: exerciseStats.filter(
          (ex) => ex.muscleRelationships > 0 && ex.equipmentRelationships === 0,
        ).length,
        onlyEquipment: exerciseStats.filter(
          (ex) => ex.muscleRelationships === 0 && ex.equipmentRelationships > 0,
        ).length,
        both: exerciseStats.filter(
          (ex) => ex.muscleRelationships > 0 && ex.equipmentRelationships > 0,
        ).length,
      },
    };
  },
});

export const analyzeDuplicateRelationships = query({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const duplicateExercises = await ctx.db
      .query("exercises")
      .withIndex("by_title", (q) => q.eq("title", args.title))
      .collect();

    if (duplicateExercises.length <= 1) {
      return { error: "No duplicates found for this title" };
    }

    const detailedAnalysis = await Promise.all(
      duplicateExercises.map(async (exercise) => {
        const [muscleRels, equipmentRels] = await Promise.all([
          ctx.db
            .query("exerciseMuscles")
            .withIndex("by_exercise", (q) => q.eq("exerciseId", exercise._id))
            .collect(),
          ctx.db
            .query("exerciseEquipment")
            .withIndex("by_exercise", (q) => q.eq("exerciseId", exercise._id))
            .collect(),
        ]);

        return {
          id: exercise._id,
          creationTime: exercise._creationTime,
          url: exercise.url,
          description: exercise.description,
          exerciseType: exercise.exerciseType,
          muscleRelationships: muscleRels.length,
          equipmentRelationships: equipmentRels.length,
          muscleDetails: muscleRels.map((rel) => ({
            muscleId: rel.muscleId,
            role: rel.role,
          })),
          equipmentDetails: equipmentRels.map((rel) => ({
            equipmentId: rel.equipmentId,
          })),
        };
      }),
    );

    return {
      title: args.title,
      duplicateCount: duplicateExercises.length,
      exercises: detailedAnalysis.sort(
        (a, b) => a.creationTime - b.creationTime,
      ),
    };
  },
});

export const getFilteredExercises = query({
  args: {
    majorGroups: v.optional(v.array(v.string())),
    muscleId: v.optional(v.id("muscles")),
    muscleRole: v.optional(
      v.union(
        v.literal("target"),
        v.literal("lengthening"),
        v.literal("synergist"),
        v.literal("stabilizer"),
      ),
    ),
    muscleFunctions: v.optional(
      v.array(
        v.union(
          v.literal("target"),
          v.literal("lengthening"),
          v.literal("synergist"),
          v.literal("stabilizer"),
        ),
      ),
    ),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    exerciseTypes: v.optional(
      v.array(
        v.union(
          v.literal("Weight Reps"),
          v.literal("Reps Only"),
          v.literal("Weighted Bodyweight"),
          v.literal("Assisted Bodyweight"),
          v.literal("Duration"),
          v.literal("Weight & Duration"),
          v.literal("Distance & Duration"),
          v.literal("Weight & Distance"),
        ),
      ),
    ),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let exerciseIds = new Set<Id<"exercises">>();
    let firstFilter = true;

    // Filter by major muscle groups
    if (args.majorGroups && args.majorGroups.length > 0) {
      const allMajorGroupExerciseIds = new Set<Id<"exercises">>();

      for (const majorGroup of args.majorGroups) {
        const muscles = await ctx.db
          .query("muscles")
          .filter((q) => q.eq(q.field("majorGroup"), majorGroup))
          .collect();

        const muscleIds = muscles.map((m) => m._id);
        const muscleRelationships = await ctx.db
          .query("exerciseMuscles")
          .collect();

        const majorGroupExerciseIds = muscleRelationships
          .filter((rel) => muscleIds.includes(rel.muscleId))
          .map((rel) => rel.exerciseId);

        majorGroupExerciseIds.forEach((id) => allMajorGroupExerciseIds.add(id));
      }

      if (firstFilter) {
        exerciseIds = allMajorGroupExerciseIds;
        firstFilter = false;
      } else {
        exerciseIds = new Set(
          Array.from(allMajorGroupExerciseIds).filter((id) =>
            exerciseIds.has(id),
          ),
        );
      }
    }

    // Filter by specific muscle and role
    if (args.muscleId && args.muscleRole) {
      const muscleRelationships = await ctx.db
        .query("exerciseMuscles")
        .withIndex("by_muscle", (q) => q.eq("muscleId", args.muscleId!))
        .filter((q) => q.eq(q.field("role"), args.muscleRole!))
        .collect();

      const muscleExerciseIds = muscleRelationships.map(
        (rel) => rel.exerciseId,
      );

      if (firstFilter) {
        muscleExerciseIds.forEach((id) => exerciseIds.add(id));
        firstFilter = false;
      } else {
        exerciseIds = new Set(
          muscleExerciseIds.filter((id) => exerciseIds.has(id)),
        );
      }
    }

    // Filter by muscle functions
    if (args.muscleFunctions && args.muscleFunctions.length > 0) {
      const allMuscleFunctionExerciseIds = new Set<Id<"exercises">>();

      for (const role of args.muscleFunctions) {
        const muscleRelationships = await ctx.db
          .query("exerciseMuscles")
          .filter((q) => q.eq(q.field("role"), role))
          .collect();

        const functionExerciseIds = muscleRelationships.map(
          (rel) => rel.exerciseId,
        );
        functionExerciseIds.forEach((id) => allMuscleFunctionExerciseIds.add(id));
      }

      if (firstFilter) {
        exerciseIds = allMuscleFunctionExerciseIds;
        firstFilter = false;
      } else {
        exerciseIds = new Set(
          Array.from(allMuscleFunctionExerciseIds).filter((id) =>
            exerciseIds.has(id),
          ),
        );
      }
    }

    // Filter by equipment
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      const allEquipmentExerciseIds = new Set<Id<"exercises">>();

      for (const equipmentId of args.equipmentIds) {
        const equipmentRelationships = await ctx.db
          .query("exerciseEquipment")
          .withIndex("by_equipment", (q) => q.eq("equipmentId", equipmentId))
          .collect();

        const equipmentExerciseIds = equipmentRelationships.map(
          (rel) => rel.exerciseId,
        );
        equipmentExerciseIds.forEach((id) => allEquipmentExerciseIds.add(id));
      }

      if (firstFilter) {
        exerciseIds = allEquipmentExerciseIds;
        firstFilter = false;
      } else {
        exerciseIds = new Set(
          Array.from(allEquipmentExerciseIds).filter((id) =>
            exerciseIds.has(id),
          ),
        );
      }
    }

    // If no filters applied, get all exercises
    let exercises;
    if (firstFilter) {
      exercises = await ctx.db.query("exercises").collect();
    } else {
      const exerciseResults = await Promise.all(
        Array.from(exerciseIds).map((id) => ctx.db.get(id)),
      );
      exercises = exerciseResults.filter(
        (ex): ex is NonNullable<typeof ex> => ex !== null,
      );
    }

    // Apply exercise type filter
    if (args.exerciseTypes && args.exerciseTypes.length > 0) {
      exercises = exercises.filter((ex) =>
        args.exerciseTypes!.includes(ex.exerciseType),
      );
    }

    // Apply search filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      exercises = exercises.filter((ex) =>
        ex.title.toLowerCase().includes(searchLower),
      );
    }

    // Get exercise details with muscles and equipment
    const exercisesWithDetails = await Promise.all(
      exercises.map(async (exercise) => {
        const [muscleRelationships, equipmentRelationships] = await Promise.all(
          [
            ctx.db
              .query("exerciseMuscles")
              .withIndex("by_exercise", (q) => q.eq("exerciseId", exercise._id))
              .collect(),
            ctx.db
              .query("exerciseEquipment")
              .withIndex("by_exercise", (q) => q.eq("exerciseId", exercise._id))
              .collect(),
          ],
        );

        const [muscles, equipment] = await Promise.all([
          Promise.all(
            muscleRelationships.map(async (rel) => ({
              muscle: await ctx.db.get(rel.muscleId),
              role: rel.role,
            })),
          ),
          Promise.all(
            equipmentRelationships.map((rel) => ctx.db.get(rel.equipmentId)),
          ),
        ]);

        return {
          ...exercise,
          muscles: muscles.filter((m) => m.muscle),
          equipment: equipment.filter(Boolean),
        };
      }),
    );

    return exercisesWithDetails;
  },
});
