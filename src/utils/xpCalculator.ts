import { type MuscleId } from "@/components/muscle-body/MuscleBody";
import {
  type MajorMuscleGroup,
  muscleToGroupMapping,
} from "@/utils/muscleMapping";
import {
  type WeeklyProgressData,
  type IndividualMuscleProgress,
} from "@/store/weeklyProgress";

export type MuscleRole = "target" | "synergist" | "stabilizer" | "lengthening";

export interface MuscleInvolvement {
  muscleId: MuscleId;
  role: MuscleRole;
}

export interface XPCalculationResult {
  totalXP: number;
  muscleXPDistribution: {
    muscleId: MuscleId;
    role: MuscleRole;
    xpAwarded: number;
    multiplier: number;
  }[];
}

// Base XP per set
const BASE_XP_PER_SET = 10;

// Multipliers based on muscle role
const ROLE_MULTIPLIERS: Record<MuscleRole, number> = {
  target: 1.0, // Will be adjusted based on number of target muscles
  synergist: 0.5,
  stabilizer: 0.3,
  lengthening: 0.2,
};

// Multiple target muscles factor
const MULTIPLE_TARGET_FACTOR = 0.7;

/**
 * Calculate XP distribution for muscles based on their involvement in an exercise
 */
export const calculateXPDistribution = (
  muscleInvolvements: MuscleInvolvement[],
  rpe = 10, // Rate of Perceived Exertion (1-10 scale), defaults to 10
): XPCalculationResult => {
  // Count target muscles to determine if we need to apply the multiple target factor
  const targetMuscles = muscleInvolvements.filter((m) => m.role === "target");
  const hasMultipleTargets = targetMuscles.length > 1;

  // Calculate RPE multiplier (1-10 scale where 10 = 1.0x, 1 = 0.1x)
  const rpeMultiplier = Math.max(0.1, Math.min(1.0, rpe / 10));

  // Calculate XP for each muscle
  const muscleXPDistribution = muscleInvolvements.map((involvement) => {
    let multiplier = ROLE_MULTIPLIERS[involvement.role];

    // Apply multiple target factor if applicable
    if (involvement.role === "target" && hasMultipleTargets) {
      multiplier = MULTIPLE_TARGET_FACTOR;
    }

    // Apply RPE multiplier
    const finalMultiplier = multiplier * rpeMultiplier;
    const xpAwarded = Math.round(BASE_XP_PER_SET * finalMultiplier);

    return {
      muscleId: involvement.muscleId,
      role: involvement.role,
      xpAwarded,
      multiplier: finalMultiplier,
    };
  });

  const totalXP = muscleXPDistribution.reduce(
    (sum, muscle) => sum + muscle.xpAwarded,
    0,
  );

  return {
    totalXP,
    muscleXPDistribution,
  };
};

/**
 * Update individual muscle progress with XP from a logged set
 */
export const updateMuscleProgress = (
  currentProgress: Record<string, IndividualMuscleProgress>,
  xpDistribution: XPCalculationResult,
): Record<string, IndividualMuscleProgress> => {
  const updatedProgress = { ...currentProgress };

  xpDistribution.muscleXPDistribution.forEach((muscle) => {
    const currentMuscleProgress = updatedProgress[muscle.muscleId];

    if (currentMuscleProgress) {
      const newXP = currentMuscleProgress.xp + muscle.xpAwarded;
      const newSets = currentMuscleProgress.sets + 1;
      const newPercentage =
        currentMuscleProgress.goal > 0
          ? Math.round((newXP / currentMuscleProgress.goal) * 100)
          : 0;

      updatedProgress[muscle.muscleId] = {
        ...currentMuscleProgress,
        xp: newXP,
        sets: newSets,
        percentage: newPercentage,
      };
    }
  });

  return updatedProgress;
};

/**
 * Calculate major muscle group progress from individual muscle progress
 */
export const calculateMajorGroupProgress = (
  individualProgress: Record<string, IndividualMuscleProgress>,
): WeeklyProgressData[] => {
  // Group muscles by major muscle group
  const groupedData: Record<
    MajorMuscleGroup,
    {
      totalXP: number;
      totalGoal: number;
      totalSets: number;
      muscles: string[];
    }
  > = {
    chest: { totalXP: 0, totalGoal: 0, totalSets: 0, muscles: [] },
    back: { totalXP: 0, totalGoal: 0, totalSets: 0, muscles: [] },
    legs: { totalXP: 0, totalGoal: 0, totalSets: 0, muscles: [] },
    shoulders: { totalXP: 0, totalGoal: 0, totalSets: 0, muscles: [] },
    arms: { totalXP: 0, totalGoal: 0, totalSets: 0, muscles: [] },
    core: { totalXP: 0, totalGoal: 0, totalSets: 0, muscles: [] },
  };

  // Aggregate individual muscle data to major groups
  Object.entries(individualProgress).forEach(([muscleId, progress]) => {
    const majorGroup = muscleToGroupMapping[muscleId as MuscleId];
    if (majorGroup && progress.hasExercises) {
      groupedData[majorGroup].totalXP += progress.xp;
      groupedData[majorGroup].totalGoal += progress.goal;
      groupedData[majorGroup].totalSets += progress.sets;
      groupedData[majorGroup].muscles.push(muscleId);
    }
  });

  // Convert to WeeklyProgressData format
  return Object.entries(groupedData).map(([group, data]) => {
    const majorGroup = group as MajorMuscleGroup;
    const percentage =
      data.totalGoal > 0
        ? Math.round((data.totalXP / data.totalGoal) * 100)
        : 0;

    // Simple level calculation based on total XP
    const level = Math.max(1, Math.floor(data.totalXP / 100) + 1);
    const nextLevel = level * 100;

    return {
      majorGroup,
      level,
      xp: data.totalXP,
      nextLevel,
      percentage,
      streak: 0, // TODO: Implement streak calculation based on consecutive days
    };
  });
};

/**
 * Get streak for a muscle based on consecutive days of training
 * This is a placeholder implementation - you might want to enhance it
 */
export const calculateMuscleStreak = (
  muscleId: MuscleId,
  loggedSets: { timestamp: number; exerciseId: string }[],
): number => {
  // TODO: Implement actual streak calculation
  // For now, return 0 as we start fresh
  return 0;
};

/**
 * Helper function to get muscle involvement from exercise details
 */
export const extractMuscleInvolvement = (
  exerciseMuscles: {
    muscle: { svgId: string } | null;
    role: MuscleRole;
  }[],
): MuscleInvolvement[] => {
  return exerciseMuscles
    .filter((em) => em.muscle !== null)
    .map((em) => ({
      muscleId: em.muscle!.svgId as MuscleId,
      role: em.role,
    }));
};

/**
 * Complete XP update flow - updates both individual and major group progress
 */
export const processSetLogging = (
  currentIndividualProgress: Record<string, IndividualMuscleProgress>,
  currentMajorGroupProgress: WeeklyProgressData[],
  muscleInvolvements: MuscleInvolvement[],
  rpe = 10,
): {
  updatedIndividualProgress: Record<string, IndividualMuscleProgress>;
  updatedMajorGroupProgress: WeeklyProgressData[];
  xpCalculation: XPCalculationResult;
} => {
  // Calculate XP distribution
  const xpCalculation = calculateXPDistribution(muscleInvolvements, rpe);

  // Update individual muscle progress
  const updatedIndividualProgress = updateMuscleProgress(
    currentIndividualProgress,
    xpCalculation,
  );

  // Recalculate major group progress
  const updatedMajorGroupProgress = calculateMajorGroupProgress(
    updatedIndividualProgress,
  );

  return {
    updatedIndividualProgress,
    updatedMajorGroupProgress,
    xpCalculation,
  };
};
