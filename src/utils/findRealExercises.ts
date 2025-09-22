// Utility to find real exercise IDs from the database for public routines
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";

// Common exercise names to search for in the database
const EXERCISE_SEARCH_TERMS = {
  // Bodyweight exercises
  pushups: ["push", "pushup"],
  squats: ["squat"],
  plank: ["plank"],
  jumpingJacks: ["jumping", "jack"],
  armCircles: ["arm circle", "shoulder circle"],
  highKnees: ["high knee", "knee"],

  // Weight exercises
  benchPress: ["bench press", "bench"],
  overheadPress: ["overhead press", "military press", "shoulder press"],
  tricepDips: ["tricep dip", "dip"],

  // Cardio
  treadmillRun: ["treadmill", "running", "run"],
};

export interface ExerciseSearchResult {
  id: Id<"exercises">;
  title: string;
  exerciseType: string;
}

export async function findExerciseByNames(
  convex: any,
  searchTerms: string[],
): Promise<ExerciseSearchResult | null> {
  try {
    // Search for exercises using the searchTerm parameter
    for (const term of searchTerms) {
      const exercises = await convex.query(api.exercises.getFilteredExercises, {
        searchTerm: term,
      });

      if (exercises && exercises.length > 0) {
        const exercise = exercises[0]; // Take the first match
        return {
          id: exercise._id,
          title: exercise.title,
          exerciseType: exercise.exerciseType,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error searching for exercise:", searchTerms, error);
    return null;
  }
}

export async function findAllRealExercises(convex: any) {
  const results: Record<string, ExerciseSearchResult | null> = {};

  for (const [key, searchTerms] of Object.entries(EXERCISE_SEARCH_TERMS)) {
    results[key] = await findExerciseByNames(convex, searchTerms);
  }

  return results;
}

// Fallback exercise data for when real exercises aren't found
export const FALLBACK_EXERCISES = {
  pushups: {
    name: "Push-ups",
    type: "Reps Only",
  },
  squats: {
    name: "Bodyweight Squats",
    type: "Reps Only",
  },
  plank: {
    name: "Plank",
    type: "Duration",
  },
  jumpingJacks: {
    name: "Jumping Jacks",
    type: "Duration",
  },
  armCircles: {
    name: "Arm Circles",
    type: "Duration",
  },
  highKnees: {
    name: "High Knees",
    type: "Duration",
  },
  benchPress: {
    name: "Bench Press (Barbell)",
    type: "Weight Reps",
  },
  overheadPress: {
    name: "Overhead Press (Barbell)",
    type: "Weight Reps",
  },
  tricepDips: {
    name: "Tricep Dips",
    type: "Reps Only",
  },
  treadmillRun: {
    name: "Treadmill Run",
    type: "Distance & Duration",
  },
} as const;
