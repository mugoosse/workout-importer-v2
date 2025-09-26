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

export const previewExerciseImport = query({
  args: {
    exercises: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    // Load all reference data ONCE
    const [allMuscles, allEquipment, existingExercises] = await Promise.all([
      ctx.db.query("muscles").collect(),
      ctx.db.query("equipment").collect(),
      ctx.db.query("exercises").collect(),
    ]);

    // Create lookup maps
    const muscleMap = new Map(allMuscles.map(m => [m.name, m._id]));
    const equipmentMap = new Map(allEquipment.map(e => [e.name, e._id]));
    const exerciseMap = new Map(existingExercises.map(e => [e.title, e]));

    // Analyze import data
    const stats = {
      totalExercises: args.exercises.length,
      existingExercises: [] as string[],
      newExercises: [] as string[],
      unmappedMuscles: new Set<string>(),
      unmappedEquipment: new Set<string>(),
      muscleStats: {
        total: 0,
        mapped: 0,
        unmapped: 0,
      },
      equipmentStats: {
        total: 0,
        mapped: 0,
        unmapped: 0,
      },
    };

    // Check each exercise and collect unmapped items
    for (const exercise of args.exercises) {
      if (exerciseMap.has(exercise.title)) {
        stats.existingExercises.push(exercise.title);
      } else {
        stats.newExercises.push(exercise.title);
      }

      // Check all muscles from all roles
      const allMuscleNames = [
        ...exercise.muscles.target,
        ...exercise.muscles.lengthening,
        ...exercise.muscles.synergist,
        ...exercise.muscles.stabilizer,
      ].filter(name => name && name.trim());

      for (const muscleName of allMuscleNames) {
        const normalized = normalizeMuscleName(muscleName);
        stats.muscleStats.total++;

        if (muscleMap.has(normalized)) {
          stats.muscleStats.mapped++;
        } else {
          stats.muscleStats.unmapped++;
          stats.unmappedMuscles.add(muscleName);
        }
      }

      // Check equipment
      for (const equipName of exercise.equipmentNames) {
        if (!equipName || !equipName.trim()) continue;

        stats.equipmentStats.total++;
        if (equipmentMap.has(equipName.trim())) {
          stats.equipmentStats.mapped++;
        } else {
          stats.equipmentStats.unmapped++;
          stats.unmappedEquipment.add(equipName);
        }
      }
    }

    return {
      ...stats,
      unmappedMuscles: Array.from(stats.unmappedMuscles),
      unmappedEquipment: Array.from(stats.unmappedEquipment),
    };
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

export const importExercisesBulk = mutation({
  args: {
    exercises: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    // Load all reference data ONCE
    const [allMuscles, allEquipment, existingExercises, existingMuscleRels, existingEquipRels] = await Promise.all([
      ctx.db.query("muscles").collect(),
      ctx.db.query("equipment").collect(),
      ctx.db.query("exercises").collect(),
      ctx.db.query("exerciseMuscles").collect(),
      ctx.db.query("exerciseEquipment").collect(),
    ]);

    // Create lookup maps
    const muscleMap = new Map(allMuscles.map(m => [m.name, m._id]));
    const equipmentMap = new Map(allEquipment.map(e => [e.name, e._id]));
    const exerciseMap = new Map(existingExercises.map(e => [e.title, e._id]));

    // Create relationship lookup sets for duplicate prevention
    const muscleRelKeys = new Set(
      existingMuscleRels.map(r => `${r.exerciseId}:${r.muscleId}:${r.role}`)
    );
    const equipRelKeys = new Set(
      existingEquipRels.map(r => `${r.exerciseId}:${r.equipmentId}`)
    );

    const results = {
      created: 0,
      skipped: 0,
      muscleRelationsCreated: 0,
      equipmentRelationsCreated: 0,
      errors: [] as string[],
    };

    // Process each exercise
    for (const exercise of args.exercises) {
      try {
        // Check if exercise already exists
        let exerciseId = exerciseMap.get(exercise.title);

        if (exerciseId) {
          results.skipped++;
        } else {
          // Create new exercise
          exerciseId = await ctx.db.insert("exercises", {
            title: exercise.title,
            url: exercise.url,
            description: exercise.description,
            source: "muscleandmotion.com",
            exerciseType: parseExerciseType(exercise.exerciseType),
          });

          // Add to our local map for subsequent lookups
          exerciseMap.set(exercise.title, exerciseId);
          results.created++;
        }

        // Process equipment relationships
        for (const equipName of exercise.equipmentNames) {
          if (!equipName || !equipName.trim()) continue;

          const equipmentId = equipmentMap.get(equipName.trim());
          if (equipmentId) {
            const relKey = `${exerciseId}:${equipmentId}`;
            if (!equipRelKeys.has(relKey)) {
              await ctx.db.insert("exerciseEquipment", {
                exerciseId,
                equipmentId,
              });
              equipRelKeys.add(relKey);
              results.equipmentRelationsCreated++;
            }
          } else {
            results.errors.push(`Equipment not found: ${equipName} (exercise: ${exercise.title})`);
          }
        }

        // Process muscle relationships
        for (const [role, muscleNames] of Object.entries(exercise.muscles)) {
          for (const muscleName of muscleNames) {
            if (!muscleName || !muscleName.trim()) continue;

            const normalized = normalizeMuscleName(muscleName);
            const muscleId = muscleMap.get(normalized);

            if (muscleId) {
              const relKey = `${exerciseId}:${muscleId}:${role}`;
              if (!muscleRelKeys.has(relKey)) {
                await ctx.db.insert("exerciseMuscles", {
                  exerciseId,
                  muscleId,
                  role: role as MuscleRole,
                });
                muscleRelKeys.add(relKey);
                results.muscleRelationsCreated++;
              }
            } else {
              results.errors.push(`Muscle not found: ${muscleName} (role: ${role}, exercise: ${exercise.title})`);
            }
          }
        }
      } catch (error) {
        results.errors.push(`Failed to process exercise "${exercise.title}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
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

export const getAllEquipmentWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const [equipment, exerciseEquipmentRelationships, exercises] = await Promise.all([
      ctx.db.query("equipment").collect(),
      ctx.db.query("exerciseEquipment").collect(),
      ctx.db.query("exercises").collect(),
    ]);

    // Create exercise ID to exercise map for quick lookup
    const exerciseMap = new Map(exercises.map(ex => [ex._id, ex]));

    // Count exercises and collect exercise types for each equipment
    const equipmentData = new Map<string, { count: number; exerciseTypes: Set<string> }>();

    exerciseEquipmentRelationships.forEach((rel) => {
      const existing = equipmentData.get(rel.equipmentId) || { count: 0, exerciseTypes: new Set() };
      existing.count += 1;

      // Get exercise type from the exercise
      const exercise = exerciseMap.get(rel.exerciseId);
      if (exercise?.exerciseType) {
        existing.exerciseTypes.add(exercise.exerciseType);
      }

      equipmentData.set(rel.equipmentId, existing);
    });

    // Combine equipment with their exercise counts and types
    const equipmentWithCounts = equipment.map((equip) => {
      const data = equipmentData.get(equip._id) || { count: 0, exerciseTypes: new Set() };
      return {
        ...equip,
        exerciseCount: data.count,
        exerciseTypes: Array.from(data.exerciseTypes),
      };
    });

    return equipmentWithCounts;
  },
});

export const getMuscleGroupsWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const [muscles, exerciseMuscleRelationships] = await Promise.all([
      ctx.db.query("muscles").collect(),
      ctx.db.query("exerciseMuscles").collect(),
    ]);

    // Group muscles by major group and count unique exercises
    const majorGroups = ["chest", "back", "legs", "shoulders", "arms", "core"];

    const muscleGroupsWithCounts = majorGroups.map((majorGroup) => {
      // Get all muscle IDs for this major group
      const muscleIds = muscles
        .filter(muscle => muscle.majorGroup === majorGroup)
        .map(muscle => muscle._id);

      // Get unique exercise IDs that use any muscle from this group
      const uniqueExerciseIds = new Set(
        exerciseMuscleRelationships
          .filter(rel => muscleIds.includes(rel.muscleId))
          .map(rel => rel.exerciseId)
      );

      return {
        majorGroup,
        exerciseCount: uniqueExerciseIds.size,
      };
    });

    return muscleGroupsWithCounts;
  },
});

export const getExerciseTypesWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();

    // Count exercises by type
    const typeCounts = new Map<string, number>();
    exercises.forEach((exercise) => {
      const count = typeCounts.get(exercise.exerciseType) || 0;
      typeCounts.set(exercise.exerciseType, count + 1);
    });

    // Exercise type descriptions
    const typeDescriptions: Record<string, string> = {
      "Weight Reps": "Traditional weight training with sets and reps",
      "Reps Only": "Bodyweight exercises counted by repetitions",
      "Weighted Bodyweight": "Bodyweight exercises with added weight",
      "Assisted Bodyweight": "Bodyweight exercises with assistance",
      "Duration": "Time-based exercises like planks or holds",
      "Weight & Duration": "Weighted exercises held for time",
      "Distance & Duration": "Cardio exercises tracking distance and time",
      "Weight & Distance": "Weighted exercises over distance",
    };

    // Create exercise types with counts
    const exerciseTypesWithCounts = Array.from(typeCounts.entries()).map(([exerciseType, count]) => ({
      exerciseType,
      description: typeDescriptions[exerciseType] || "Exercise type",
      exerciseCount: count,
    }));

    // Sort by count descending
    exerciseTypesWithCounts.sort((a, b) => b.exerciseCount - a.exerciseCount);

    return exerciseTypesWithCounts;
  },
});

export const getAllMusclesWithCountsByAllDetailLevels = query({
  args: {},
  handler: async (ctx) => {
    const [muscles, exerciseMuscleRelationships] = await Promise.all([
      ctx.db.query("muscles").collect(),
      ctx.db.query("exerciseMuscles").collect(),
    ]);

    // Pre-filter only target relationships for better performance
    const targetRelationships = exerciseMuscleRelationships.filter(rel => rel.role === "target");

    // Basic: Group by majorGroup (6 items)
    const majorGroups = ["chest", "back", "legs", "shoulders", "arms", "core"];
    const basicItems = majorGroups.map((majorGroup) => {
      const muscleIds = muscles
        .filter(muscle => muscle.majorGroup === majorGroup)
        .map(muscle => muscle._id);

      const uniqueExerciseIds = new Set(
        targetRelationships
          .filter(rel => muscleIds.includes(rel.muscleId))
          .map(rel => rel.exerciseId)
      );

      return {
        id: majorGroup,
        name: majorGroup.charAt(0).toUpperCase() + majorGroup.slice(1),
        type: "majorGroup" as const,
        exerciseCount: uniqueExerciseIds.size,
        muscleIds,
      };
    });

    // Intermediate: Group by group (16 items)
    const groups = [...new Set(muscles.map(m => m.group))].filter(Boolean);
    const intermediateItems = groups.map((group) => {
      const musclesInGroup = muscles.filter(muscle => muscle.group === group);
      const muscleIds = musclesInGroup.map(muscle => muscle._id);

      const uniqueExerciseIds = new Set(
        targetRelationships
          .filter(rel => muscleIds.includes(rel.muscleId))
          .map(rel => rel.exerciseId)
      );

      return {
        id: group,
        name: group.charAt(0).toUpperCase() + group.slice(1).replace(/_/g, ' '),
        type: "group" as const,
        exerciseCount: uniqueExerciseIds.size,
        muscleIds,
        majorGroup: musclesInGroup[0]?.majorGroup,
      };
    }).sort((a, b) => b.exerciseCount - a.exerciseCount);

    // Advanced: Individual muscles
    const advancedItems = muscles
      .filter(muscle => {
        // Only include muscles that have target exercises
        const targetExerciseCount = targetRelationships
          .filter(rel => rel.muscleId === muscle._id).length;
        return targetExerciseCount > 0;
      })
      .map((muscle) => {
        const exerciseCount = targetRelationships
          .filter(rel => rel.muscleId === muscle._id).length;

        return {
          id: muscle._id,
          name: muscle.name,
          type: "individual" as const,
          exerciseCount,
          muscleIds: [muscle._id],
          majorGroup: muscle.majorGroup,
          group: muscle.group,
          svgId: muscle.svgId,
        };
      })
      .sort((a, b) => b.exerciseCount - a.exerciseCount);

    return {
      basic: basicItems,
      intermediate: intermediateItems,
      advanced: advancedItems,
    };
  },
});

export const getMusclesWithCountsByDetailLevel = query({
  args: { detailLevel: v.union(v.literal("basic"), v.literal("intermediate"), v.literal("advanced")) },
  handler: async (ctx, args) => {
    const [muscles, exerciseMuscleRelationships] = await Promise.all([
      ctx.db.query("muscles").collect(),
      ctx.db.query("exerciseMuscles").collect(),
    ]);

    if (args.detailLevel === "basic") {
      // Basic: Group by majorGroup (6 items) - filter by target function only
      const majorGroups = ["chest", "back", "legs", "shoulders", "arms", "core"];

      return majorGroups.map((majorGroup) => {
        const muscleIds = muscles
          .filter(muscle => muscle.majorGroup === majorGroup)
          .map(muscle => muscle._id);

        const uniqueExerciseIds = new Set(
          exerciseMuscleRelationships
            .filter(rel => muscleIds.includes(rel.muscleId) && rel.role === "target")
            .map(rel => rel.exerciseId)
        );

        return {
          id: majorGroup,
          name: majorGroup.charAt(0).toUpperCase() + majorGroup.slice(1),
          type: "majorGroup" as const,
          exerciseCount: uniqueExerciseIds.size,
          muscleIds,
        };
      });
    } else if (args.detailLevel === "intermediate") {
      // Intermediate: Group by group (16 items) - filter by target function only
      const groups = [...new Set(muscles.map(m => m.group))].filter(Boolean);

      return groups.map((group) => {
        const musclesInGroup = muscles.filter(muscle => muscle.group === group);
        const muscleIds = musclesInGroup.map(muscle => muscle._id);

        const uniqueExerciseIds = new Set(
          exerciseMuscleRelationships
            .filter(rel => muscleIds.includes(rel.muscleId) && rel.role === "target")
            .map(rel => rel.exerciseId)
        );

        return {
          id: group,
          name: group.charAt(0).toUpperCase() + group.slice(1).replace(/_/g, ' '),
          type: "group" as const,
          exerciseCount: uniqueExerciseIds.size,
          muscleIds,
          majorGroup: musclesInGroup[0]?.majorGroup,
        };
      }).sort((a, b) => b.exerciseCount - a.exerciseCount);
    } else {
      // Advanced: Individual muscles (36+ items) - filter by target function only
      return muscles
        .filter(muscle => {
          // Only include muscles that have target exercises
          const targetExerciseCount = exerciseMuscleRelationships
            .filter(rel => rel.muscleId === muscle._id && rel.role === "target").length;
          return targetExerciseCount > 0;
        })
        .map((muscle) => {
          const exerciseCount = exerciseMuscleRelationships
            .filter(rel => rel.muscleId === muscle._id && rel.role === "target").length;

          return {
            id: muscle._id,
            name: muscle.name,
            type: "individual" as const,
            exerciseCount,
            muscleIds: [muscle._id],
            majorGroup: muscle.majorGroup,
            group: muscle.group,
            svgId: muscle.svgId,
          };
        })
        .sort((a, b) => b.exerciseCount - a.exerciseCount);
    }
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
    groups: v.optional(v.array(v.string())),
    muscleIds: v.optional(v.array(v.id("muscles"))),
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
    let filteredExerciseIds = new Set<Id<"exercises">>();
    let firstFilter = true;

    // Pre-fetch data that might be needed for multiple filters
    let allMuscles: any[] | null = null;
    let allMuscleRelationships: any[] | null = null;
    let allEquipmentRelationships: any[] | null = null;

    // Filter by major muscle groups
    if (args.majorGroups && args.majorGroups.length > 0) {
      const allMajorGroupExerciseIds = new Set<Id<"exercises">>();

      // Batch fetch muscles and muscle relationships once
      if (!allMuscles || !allMuscleRelationships) {
        [allMuscles, allMuscleRelationships] = await Promise.all([
          ctx.db.query("muscles").collect(),
          ctx.db.query("exerciseMuscles").collect(),
        ]);
      }

      for (const majorGroup of args.majorGroups) {
        const muscleIds = allMuscles
          .filter(m => m.majorGroup === majorGroup)
          .map(m => m._id);

        const majorGroupExerciseIds = allMuscleRelationships
          .filter((rel) => {
            const matchesMuscle = muscleIds.includes(rel.muscleId);
            const matchesFunction = args.muscleFunctions && args.muscleFunctions.length > 0
              ? args.muscleFunctions.includes(rel.role as any)
              : true;
            return matchesMuscle && matchesFunction;
          })
          .map((rel) => rel.exerciseId);

        majorGroupExerciseIds.forEach((id) => allMajorGroupExerciseIds.add(id));
      }

      if (firstFilter) {
        filteredExerciseIds = allMajorGroupExerciseIds;
        firstFilter = false;
      } else {
        filteredExerciseIds = new Set(
          Array.from(allMajorGroupExerciseIds).filter((id) =>
            filteredExerciseIds.has(id),
          ),
        );
      }
    }

    // Filter by specific muscle groups (group field)
    if (args.groups && args.groups.length > 0) {
      const allGroupExerciseIds = new Set<Id<"exercises">>();

      // Batch fetch muscles and muscle relationships if not already fetched
      if (!allMuscles || !allMuscleRelationships) {
        [allMuscles, allMuscleRelationships] = await Promise.all([
          ctx.db.query("muscles").collect(),
          ctx.db.query("exerciseMuscles").collect(),
        ]);
      }

      for (const group of args.groups) {
        const muscleIds = allMuscles
          .filter(m => m.group === group)
          .map(m => m._id);

        const groupExerciseIds = allMuscleRelationships
          .filter((rel) => {
            const matchesMuscle = muscleIds.includes(rel.muscleId);
            const matchesFunction = args.muscleFunctions && args.muscleFunctions.length > 0
              ? args.muscleFunctions.includes(rel.role as any)
              : true;
            return matchesMuscle && matchesFunction;
          })
          .map((rel) => rel.exerciseId);

        groupExerciseIds.forEach((id) => allGroupExerciseIds.add(id));
      }

      if (firstFilter) {
        filteredExerciseIds = allGroupExerciseIds;
        firstFilter = false;
      } else {
        filteredExerciseIds = new Set(
          Array.from(allGroupExerciseIds).filter((id) =>
            filteredExerciseIds.has(id),
          ),
        );
      }
    }

    // Filter by specific muscle IDs
    if (args.muscleIds && args.muscleIds.length > 0) {
      const allMuscleIdExerciseIds = new Set<Id<"exercises">>();

      // Batch fetch muscle relationships if not already fetched
      if (!allMuscleRelationships) {
        allMuscleRelationships = await ctx.db.query("exerciseMuscles").collect();
      }

      for (const muscleId of args.muscleIds) {
        const muscleExerciseIds = allMuscleRelationships
          .filter((rel) => {
            const matchesMuscle = rel.muscleId === muscleId;
            const matchesFunction = args.muscleFunctions && args.muscleFunctions.length > 0
              ? args.muscleFunctions.includes(rel.role as any)
              : true;
            return matchesMuscle && matchesFunction;
          })
          .map((rel) => rel.exerciseId);

        muscleExerciseIds.forEach((id) => allMuscleIdExerciseIds.add(id));
      }

      if (firstFilter) {
        filteredExerciseIds = allMuscleIdExerciseIds;
        firstFilter = false;
      } else {
        filteredExerciseIds = new Set(
          Array.from(allMuscleIdExerciseIds).filter((id) =>
            filteredExerciseIds.has(id),
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
        muscleExerciseIds.forEach((id) => filteredExerciseIds.add(id));
        firstFilter = false;
      } else {
        filteredExerciseIds = new Set(
          muscleExerciseIds.filter((id) => filteredExerciseIds.has(id)),
        );
      }
    }

    // Filter by muscle functions
    if (args.muscleFunctions && args.muscleFunctions.length > 0) {
      const allMuscleFunctionExerciseIds = new Set<Id<"exercises">>();

      // Reuse muscle relationships if already fetched, otherwise fetch once
      if (!allMuscleRelationships) {
        allMuscleRelationships = await ctx.db.query("exerciseMuscles").collect();
      }

      for (const role of args.muscleFunctions) {
        const functionExerciseIds = allMuscleRelationships
          .filter((rel) => rel.role === role)
          .map((rel) => rel.exerciseId);

        functionExerciseIds.forEach((id) => allMuscleFunctionExerciseIds.add(id));
      }

      if (firstFilter) {
        filteredExerciseIds = allMuscleFunctionExerciseIds;
        firstFilter = false;
      } else {
        filteredExerciseIds = new Set(
          Array.from(allMuscleFunctionExerciseIds).filter((id) =>
            filteredExerciseIds.has(id),
          ),
        );
      }
    }

    // Filter by equipment
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      const allEquipmentExerciseIds = new Set<Id<"exercises">>();

      // Reuse equipment relationships if already fetched, otherwise fetch once
      if (!allEquipmentRelationships) {
        allEquipmentRelationships = await ctx.db.query("exerciseEquipment").collect();
      }

      for (const equipmentId of args.equipmentIds) {
        const equipmentExerciseIds = allEquipmentRelationships
          .filter((rel) => rel.equipmentId === equipmentId)
          .map((rel) => rel.exerciseId);

        equipmentExerciseIds.forEach((id) => allEquipmentExerciseIds.add(id));
      }

      if (firstFilter) {
        filteredExerciseIds = allEquipmentExerciseIds;
        firstFilter = false;
      } else {
        filteredExerciseIds = new Set(
          Array.from(allEquipmentExerciseIds).filter((id) =>
            filteredExerciseIds.has(id),
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
        Array.from(filteredExerciseIds).map((id) => ctx.db.get(id)),
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

    // Get exercise details with muscles and equipment efficiently
    const finalExerciseIds = exercises.map(ex => ex._id);
    const exerciseIdSet = new Set(finalExerciseIds);

    // Batch fetch all relationships for these exercises (reuse if already fetched)
    if (!allMuscleRelationships) {
      allMuscleRelationships = await ctx.db.query("exerciseMuscles").collect();
    }
    if (!allEquipmentRelationships) {
      allEquipmentRelationships = await ctx.db.query("exerciseEquipment").collect();
    }
    if (!allMuscles) {
      allMuscles = await ctx.db.query("muscles").collect();
    }
    const allEquipment = await ctx.db.query("equipment").collect();

    // Create lookup maps
    const muscleMap = new Map(allMuscles.map(m => [m._id, m]));
    const equipmentMap = new Map(allEquipment.map(e => [e._id, e]));

    // Group relationships by exercise ID
    const musclesByExercise = new Map<Id<"exercises">, Array<{muscle: any, role: string}>>();
    const equipmentByExercise = new Map<Id<"exercises">, any[]>();

    // Initialize maps for all exercises
    finalExerciseIds.forEach(id => {
      musclesByExercise.set(id, []);
      equipmentByExercise.set(id, []);
    });

    // Populate muscle relationships
    allMuscleRelationships
      .filter(rel => exerciseIdSet.has(rel.exerciseId))
      .forEach(rel => {
        const muscle = muscleMap.get(rel.muscleId);
        if (muscle) {
          musclesByExercise.get(rel.exerciseId)?.push({
            muscle,
            role: rel.role,
          });
        }
      });

    // Populate equipment relationships
    allEquipmentRelationships
      .filter(rel => exerciseIdSet.has(rel.exerciseId))
      .forEach(rel => {
        const equipment = equipmentMap.get(rel.equipmentId);
        if (equipment) {
          equipmentByExercise.get(rel.exerciseId)?.push(equipment);
        }
      });

    // Combine exercises with their relationships
    const exercisesWithDetails = exercises.map(exercise => ({
      ...exercise,
      muscles: musclesByExercise.get(exercise._id) || [],
      equipment: equipmentByExercise.get(exercise._id) || [],
    }));

    return exercisesWithDetails;
  },
});
