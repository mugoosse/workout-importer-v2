import { type Id } from "@/convex/_generated/dataModel";
import { type ExerciseType, type LoggedSet } from "@/store/exerciseLog";
import { checkIfPR } from "./prCalculator";

/**
 * Calculate the number of PR sets in a completed workout
 */
export function calculateWorkoutPRs(
  workoutSets: LoggedSet[],
  exerciseDetails: Record<Id<"exercises">, { exerciseType: ExerciseType }>,
  getSetsByExercise: (exerciseId: Id<"exercises">) => LoggedSet[],
): number {
  let prCount = 0;

  // Group sets by exercise
  const setsByExercise = workoutSets.reduce(
    (acc, set) => {
      if (!acc[set.exerciseId]) {
        acc[set.exerciseId] = [];
      }
      acc[set.exerciseId].push(set);
      return acc;
    },
    {} as Record<Id<"exercises">, LoggedSet[]>,
  );

  // Calculate PRs for each exercise
  Object.entries(setsByExercise).forEach(([exerciseId, sets]) => {
    const exerciseDetail = exerciseDetails[exerciseId as Id<"exercises">];
    if (!exerciseDetail?.exerciseType) return;

    // Get historical sets for this exercise (excluding current workout)
    const historicalSets = getSetsByExercise(
      exerciseId as Id<"exercises">,
    ).filter((set) => !workoutSets.some((ws) => ws.id === set.id));

    // Sort workout sets by timestamp to check PRs in chronological order
    const sortedWorkoutSets = [...sets].sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    // Check each set in the workout to see if it's a PR
    sortedWorkoutSets.forEach((currentSet, index) => {
      // Get all sets that happened before this one (historical + previous in workout)
      const previousWorkoutSets = sortedWorkoutSets.slice(0, index);
      const allPreviousSets = [...historicalSets, ...previousWorkoutSets];

      // Check if this set is a PR
      const isPR = checkIfPR(
        currentSet,
        exerciseDetail.exerciseType,
        allPreviousSets,
      );

      if (isPR) {
        prCount++;
      }
    });
  });

  return prCount;
}

/**
 * Extract exercise details from workout sets for PR calculation
 */
export function extractExerciseDetailsForPR(
  workoutSets: LoggedSet[],
  exerciseDetailsCache: Record<Id<"exercises">, any>,
): Record<Id<"exercises">, { exerciseType: ExerciseType }> {
  const exerciseDetails: Record<
    Id<"exercises">,
    { exerciseType: ExerciseType }
  > = {};

  workoutSets.forEach((set) => {
    if (!exerciseDetails[set.exerciseId]) {
      const cached = exerciseDetailsCache[set.exerciseId];
      if (cached?.exerciseType) {
        exerciseDetails[set.exerciseId] = {
          exerciseType: cached.exerciseType,
        };
      }
    }
  });

  return exerciseDetails;
}
