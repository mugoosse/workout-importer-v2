import { type MuscleId } from "@/components/muscle-body/MuscleBody";
import { RPE_SCALE } from "@/constants/rpe";
import { exerciseLogSummariesAtom, loggedSetsAtom } from "@/store/exerciseLog";
import { calculateXPDistribution, type MuscleRole } from "@/utils/xpCalculator";
import { useAtom } from "jotai";

export interface WorkoutSummary {
  exerciseId: string;
  setsCount: number;
  lastLoggedDate: string;
  muscleRole: MuscleRole;
  totalXP: number;
  prCount: number;
  notes?: string;
}

// Helper function to aggregate recent workouts for a muscle
export const useAggregateRecentWorkouts = (
  muscle: any,
  maxWorkouts: number = 6,
): WorkoutSummary[] => {
  const [loggedSets] = useAtom(loggedSetsAtom);
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);

  if (!muscle) return [];

  // Group logged sets by exercise and calculate XP for this muscle
  const exerciseGroups = new Map<
    string,
    {
      exerciseId: string;
      setsCount: number;
      lastLoggedDate: string;
      muscleRole: MuscleRole;
      totalXP: number;
      prCount: number;
      notes?: string;
    }
  >();

  // For now, we'll use a simplified approach to determine muscle involvement
  // In a real implementation, you'd query the exercise-muscle relationships from the database
  loggedSets.forEach((set) => {
    // Simplified role assignment - in practice, you'd query this from the database
    const muscleRole: MuscleRole = "target"; // Default to target for demo

    // Calculate XP for this set for this specific muscle
    const xpResult = calculateXPDistribution(
      [{ muscleId: muscle.svgId as MuscleId, role: muscleRole }],
      set.rpe || RPE_SCALE.MAX,
      set.isPR || false,
    );

    const muscleXP =
      xpResult.muscleXPDistribution.find((m) => m.muscleId === muscle.svgId)
        ?.xpAwarded || 0;

    const key = set.exerciseId;
    const existing = exerciseGroups.get(key);

    if (existing) {
      existing.setsCount += 1;
      existing.totalXP += muscleXP;
      if (set.isPR) {
        existing.prCount += 1;
      }
      // Keep the most recent date
      if (set.timestamp > new Date(existing.lastLoggedDate).getTime()) {
        existing.lastLoggedDate = new Date(set.timestamp).toISOString();
      }
    } else {
      exerciseGroups.set(key, {
        exerciseId: set.exerciseId,
        setsCount: 1,
        lastLoggedDate: new Date(set.timestamp).toISOString(),
        muscleRole,
        totalXP: muscleXP,
        prCount: set.isPR ? 1 : 0,
      });
    }
  });

  // Convert to array, add notes from exercise log summaries, and sort by most recent first
  return Array.from(exerciseGroups.values())
    .map((group) => {
      // Get notes from exercise log summary
      const exerciseLogSummary = exerciseLogSummaries.find(
        (summary) => summary.exerciseId === group.exerciseId,
      );
      return {
        ...group,
        notes: exerciseLogSummary?.notes,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastLoggedDate).getTime() -
        new Date(a.lastLoggedDate).getTime(),
    )
    .slice(0, maxWorkouts);
};

// Helper function to calculate muscle XP
export const calculateMuscleXP = (muscle: any, set: any): number => {
  const muscleRole: MuscleRole = "target"; // Simplified - should be queried from DB

  const xpResult = calculateXPDistribution(
    [{ muscleId: muscle.svgId as MuscleId, role: muscleRole }],
    set.rpe || RPE_SCALE.MAX,
    set.isPR || false,
  );

  return (
    xpResult.muscleXPDistribution.find((m) => m.muscleId === muscle.svgId)
      ?.xpAwarded || 0
  );
};

// Helper function to format last logged date
export const formatLastLoggedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};
