import { type Id } from "@/convex/_generated/dataModel";
import { type WorkoutSet } from "@/store/activeWorkout";
import { type LoggedSet, type ExerciseType } from "@/store/exerciseLog";

/**
 * Calculate the PR value for a set based on the exercise type
 * PR is defined as the product of all input fields except RPE
 */
export function calculatePRValue(
  set: WorkoutSet | LoggedSet,
  exerciseType: ExerciseType,
): number {
  switch (exerciseType) {
    case "Weight Reps":
    case "Weighted Bodyweight":
    case "Assisted Bodyweight":
      // PR = weight × reps (volume)
      return (set.weight || 0) * (set.reps || 0);

    case "Reps Only":
      // PR = reps
      return set.reps || 0;

    case "Duration":
      // PR = duration (in seconds)
      return set.duration || 0;

    case "Weight & Duration":
      // PR = weight × duration
      return (set.weight || 0) * (set.duration || 0);

    case "Distance & Duration":
      // PR = distance × duration (total distance-time work)
      return (set.distance || 0) * (set.duration || 0);

    case "Weight & Distance":
      // PR = weight × distance
      return (set.weight || 0) * (set.distance || 0);

    default:
      return 0;
  }
}

/**
 * Check if a set represents a new personal record
 */
export function checkIfPR(
  currentSet: WorkoutSet,
  exerciseType: ExerciseType,
  historicalSets: LoggedSet[],
): boolean {
  const currentPRValue = calculatePRValue(currentSet, exerciseType);

  // If the current set has no meaningful value, it can't be a PR
  if (currentPRValue === 0) {
    return false;
  }

  // Get the highest PR value from historical sets
  const historicalBest = Math.max(
    0,
    ...historicalSets.map((set) => calculatePRValue(set, exerciseType)),
  );

  return currentPRValue > historicalBest;
}

/**
 * Find the current PR holder for an exercise
 */
export function findCurrentPR(
  exerciseType: ExerciseType,
  historicalSets: LoggedSet[],
): LoggedSet | null {
  if (historicalSets.length === 0) {
    return null;
  }

  let bestSet: LoggedSet | null = null;
  let bestValue = 0;

  for (const set of historicalSets) {
    const prValue = calculatePRValue(set, exerciseType);
    if (prValue > bestValue) {
      bestValue = prValue;
      bestSet = set;
    }
  }

  return bestSet;
}

/**
 * Recalculate PR flags for sets after an undo operation
 * Returns updated sets with recalculated isPR flags
 */
export function recalculatePRsAfterUndo(
  exerciseId: Id<"exercises">,
  exerciseType: ExerciseType,
  undoneSetTimestamp: number,
  allSetsForExercise: LoggedSet[],
): LoggedSet[] {
  // Filter out the undone set and get sets that were completed after it
  const remainingSets = allSetsForExercise.filter(
    (set) => set.timestamp !== undoneSetTimestamp,
  );

  const setsToRecalculate = remainingSets.filter(
    (set) => set.timestamp > undoneSetTimestamp,
  );

  // Create a copy of all sets to modify
  const updatedSets = [...remainingSets];

  // Clear PR flags for sets that need recalculation
  setsToRecalculate.forEach((set) => {
    const setIndex = updatedSets.findIndex((s) => s.id === set.id);
    if (setIndex !== -1) {
      updatedSets[setIndex] = { ...updatedSets[setIndex], isPR: false };
    }
  });

  // Sort sets by timestamp to recalculate PRs in chronological order
  const sortedSets = updatedSets.sort((a, b) => a.timestamp - b.timestamp);

  // Recalculate PRs for each set in chronological order
  for (let i = 0; i < sortedSets.length; i++) {
    const currentSet = sortedSets[i];

    // Skip if this set wasn't affected by the undo
    if (currentSet.timestamp <= undoneSetTimestamp) {
      continue;
    }

    // Get all sets that came before this one
    const previousSets = sortedSets.slice(0, i);

    // Check if this set is a PR compared to all previous sets
    const currentPRValue = calculatePRValue(currentSet, exerciseType);
    const isPR =
      currentPRValue > 0 &&
      previousSets.every(
        (prevSet) => calculatePRValue(prevSet, exerciseType) < currentPRValue,
      );

    // Update the set with new PR status
    sortedSets[i] = {
      ...currentSet,
      isPR,
      prValue: isPR ? currentPRValue : currentSet.prValue,
    };
  }

  return sortedSets;
}

/**
 * Update PR values for all sets in a workout exercise
 * This is called during set completion to ensure proper PR tracking
 */
export function updatePRsForExercise(
  exerciseType: ExerciseType,
  workoutSets: WorkoutSet[],
  historicalSets: LoggedSet[],
): WorkoutSet[] {
  // Combine historical and current workout sets for PR calculation
  const allSetsForComparison = [
    ...historicalSets,
    ...workoutSets
      .filter((set) => set.isCompleted && set.rpe !== undefined)
      .map((set) => ({
        ...set,
        exerciseId: "" as Id<"exercises">, // Placeholder for type compatibility
        workoutSessionId: "",
        date: "",
        rpe: set.rpe!,
      })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Update each workout set with PR information
  return workoutSets.map((workoutSet) => {
    if (!workoutSet.isCompleted || workoutSet.rpe === undefined) {
      return workoutSet;
    }

    // Get all sets that came before this one (by timestamp)
    const previousSets = allSetsForComparison.filter(
      (set) => set.timestamp < workoutSet.timestamp,
    );

    const currentPRValue = calculatePRValue(workoutSet, exerciseType);
    const isPR = checkIfPR(
      workoutSet,
      exerciseType,
      previousSets as LoggedSet[],
    );

    return {
      ...workoutSet,
      isPR,
      prValue: currentPRValue,
    };
  });
}
