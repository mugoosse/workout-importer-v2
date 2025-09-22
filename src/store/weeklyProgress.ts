import { type MajorMuscleGroup } from "@/utils/muscleMapping";
import {
  calculateMajorGroupProgress,
  type XPCalculationResult,
} from "@/utils/xpCalculator";
import { atom } from "jotai";

export interface WeeklyProgressData {
  majorGroup: MajorMuscleGroup;
  level: number;
  xp: number;
  nextLevel: number;
  percentage: number;
  streak: number;
}

export interface IndividualMuscleProgress {
  xp: number;
  goal: number;
  percentage: number;
  streak: number;
  sets: number;
  hasExercises: boolean;
}

// Major muscle group progress data - starting from 0 for client-side tracking
export const weeklyProgressAtom = atom<WeeklyProgressData[]>([
  {
    majorGroup: "chest" as MajorMuscleGroup,
    level: 1,
    xp: 0,
    nextLevel: 100,
    percentage: 0,
    streak: 0,
  },
  {
    majorGroup: "back" as MajorMuscleGroup,
    level: 1,
    xp: 0,
    nextLevel: 100,
    percentage: 0,
    streak: 0,
  },
  {
    majorGroup: "legs" as MajorMuscleGroup,
    level: 1,
    xp: 0,
    nextLevel: 100,
    percentage: 0,
    streak: 0,
  },
  {
    majorGroup: "shoulders" as MajorMuscleGroup,
    level: 1,
    xp: 0,
    nextLevel: 100,
    percentage: 0,
    streak: 0,
  },
  {
    majorGroup: "arms" as MajorMuscleGroup,
    level: 1,
    xp: 0,
    nextLevel: 100,
    percentage: 0,
    streak: 0,
  },
  {
    majorGroup: "core" as MajorMuscleGroup,
    level: 1,
    xp: 0,
    nextLevel: 100,
    percentage: 0,
    streak: 0,
  },
]);

// Note: Exercise count data is now dynamically loaded from the database
// This store maintains progress data, while exercise availability is determined in real-time

// Individual muscle progress data - starting from 0 for client-side tracking
export const individualMuscleProgressAtom = atom<
  Record<string, IndividualMuscleProgress>
>({
  // Legs
  rectus_femoris: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  vastus_lateralis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  vastus_medialis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  biceps_femoris: {
    xp: 0,
    goal: 0,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: false,
  },
  semitendinosus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  gastrocnemius: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  soleus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  gluteus_maximus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  gluteus_medius: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  adductor_longus_and_pectineus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  adductor_magnus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  gracilis: {
    xp: 0,
    goal: 0,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: false,
  },
  sartorius: {
    xp: 0,
    goal: 0,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: false,
  },
  tensor_fasciae_latae: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  peroneus_longus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },

  // Chest
  pectoralis_major: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  serratus_anterior: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },

  // Back
  latissimus_dorsi: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  lower_trapezius: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  rhomboid_muscles: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  trapezius: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  teres_major: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  erector_spinae: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  infraspinatus: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },

  // Shoulders
  deltoids: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },

  // Arms
  biceps_brachii: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  triceps_brachii: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  brachialis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  brachioradialis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  extensor_carpi_radialis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  flexor_carpi_radialis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  flexor_carpi_ulnaris: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },

  // Core
  rectus_abdominis: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  external_obliques: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  omohyoid: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
  sternocleidomastoid: {
    xp: 0,
    goal: 50,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: true,
  },
});

// Utility function to interpolate between two hex colors
export const interpolateColor = (
  color1: string,
  color2: string,
  factor: number,
): string => {
  // Ensure factor is between 0 and 1
  factor = Math.max(0, Math.min(1, factor));

  // Parse hex colors
  const hex1 = color1.replace("#", "");
  const hex2 = color2.replace("#", "");

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  // Interpolate each channel
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

// Legend colors for interpolation
const LEGEND_COLORS = [
  "#FF5C14", // 0-24%
  "#FF8A1B", // 25-49%
  "#FCD514", // 50-74%
  "#98DA00", // 75-99%
  "#1FD224", // 100%+
];

// Utility function to get progress color with smooth interpolation
export const getProgressColor = (progress: number): string => {
  // Handle edge cases
  if (progress <= 0) return LEGEND_COLORS[0];
  if (progress >= 100) return LEGEND_COLORS[4];

  // Determine which color range we're in
  let rangeIndex: number;
  let localProgress: number;

  if (progress < 25) {
    rangeIndex = 0;
    localProgress = progress / 25; // 0-1 within first range
  } else if (progress < 50) {
    rangeIndex = 1;
    localProgress = (progress - 25) / 25; // 0-1 within second range
  } else if (progress < 75) {
    rangeIndex = 2;
    localProgress = (progress - 50) / 25; // 0-1 within third range
  } else {
    rangeIndex = 3;
    localProgress = (progress - 75) / 25; // 0-1 within fourth range
  }

  // Interpolate between the two colors in this range
  return interpolateColor(
    LEGEND_COLORS[rangeIndex],
    LEGEND_COLORS[rangeIndex + 1],
    localProgress,
  );
};

// Utility function to get streak emoji
export const getStreakEmoji = (streak: number): string => {
  if (streak >= 8) return "🔥";
  if (streak >= 4) return "💪";
  if (streak >= 2) return "⭐";
  return "👍";
};

// Helper function to get muscle progress with fallback for muscles without exercises
export const getMuscleProgress = (
  svgId: string,
  progressAtom: Record<string, IndividualMuscleProgress>,
  hasExercises?: boolean,
): IndividualMuscleProgress => {
  const existingProgress = progressAtom[svgId];

  if (existingProgress) {
    return {
      ...existingProgress,
      hasExercises: hasExercises ?? existingProgress.hasExercises,
    };
  }

  // Return default for muscles without exercises
  return {
    xp: 0,
    goal: 0,
    percentage: 0,
    streak: 0,
    sets: 0,
    hasExercises: hasExercises ?? false,
  };
};

// Helper function to get group progress percentage for a muscle based on its major muscle group
export const getGroupProgressForMuscle = (
  muscleId: string,
  weeklyProgress: WeeklyProgressData[],
  muscleToGroupMapping: Record<
    string,
    import("@/utils/muscleMapping").MajorMuscleGroup
  >,
): number => {
  const majorGroup = muscleToGroupMapping[muscleId];
  if (!majorGroup) return 0;

  const groupData = weeklyProgress.find(
    (group) => group.majorGroup === majorGroup,
  );
  return groupData?.percentage || 0;
};

// Helper function to calculate group progress with additional XP for a muscle
export const getGroupProgressWithAdditionalXP = (
  muscleId: string,
  additionalXP: number,
  individualProgress: Record<string, IndividualMuscleProgress>,
  muscleToGroupMapping: Record<
    string,
    import("@/utils/muscleMapping").MajorMuscleGroup
  >,
): number => {
  const majorGroup = muscleToGroupMapping[muscleId];
  if (!majorGroup) return 0;

  // Calculate what the group max XP would be with the additional XP
  let maxGroupXP = 0;
  Object.entries(individualProgress).forEach(([muscleSvgId, progress]) => {
    const muscleMajorGroup = muscleToGroupMapping[muscleSvgId];
    if (muscleMajorGroup === majorGroup && progress.hasExercises) {
      const xpToAdd = muscleSvgId === muscleId ? additionalXP : 0;
      const muscleXP = progress.xp + xpToAdd;
      maxGroupXP = Math.max(maxGroupXP, muscleXP);
    }
  });

  // Fixed target of 100 XP for all major muscle groups
  const fixedTarget = 100;
  return Math.round((maxGroupXP / fixedTarget) * 100);
};

// Action to update muscle progress when workout is completed
export const updateMuscleProgressFromWorkoutAction = atom(
  null,
  (get, set, xpDistributions: XPCalculationResult[]) => {
    const currentIndividualProgress = get(individualMuscleProgressAtom);

    // Aggregate all XP distributions and count sets per muscle from the workout
    const totalXPByMuscle: Record<string, number> = {};
    const setsCountByMuscle: Record<string, number> = {};

    xpDistributions.forEach((xpResult) => {
      xpResult.muscleXPDistribution.forEach((muscle) => {
        totalXPByMuscle[muscle.muscleId] =
          (totalXPByMuscle[muscle.muscleId] || 0) + muscle.xpAwarded;
        setsCountByMuscle[muscle.muscleId] =
          (setsCountByMuscle[muscle.muscleId] || 0) + 1;
      });
    });

    // Update individual muscle progress
    let updatedIndividualProgress = { ...currentIndividualProgress };
    Object.entries(totalXPByMuscle).forEach(([muscleId, totalXP]) => {
      const currentMuscleProgress = updatedIndividualProgress[muscleId];
      if (currentMuscleProgress) {
        const newXP = currentMuscleProgress.xp + totalXP;
        const newSets =
          currentMuscleProgress.sets + (setsCountByMuscle[muscleId] || 0);
        const newPercentage =
          currentMuscleProgress.goal > 0
            ? Math.round((newXP / currentMuscleProgress.goal) * 100)
            : 0;

        updatedIndividualProgress[muscleId] = {
          ...currentMuscleProgress,
          xp: newXP,
          sets: newSets,
          percentage: newPercentage,
        };
      }
    });

    // Recalculate major group progress
    const updatedWeeklyProgress = calculateMajorGroupProgress(
      updatedIndividualProgress,
    );

    // Update both atoms
    set(individualMuscleProgressAtom, updatedIndividualProgress);
    set(weeklyProgressAtom, updatedWeeklyProgress);

    // Return the updated progress for snapshot capture
    return {
      updatedIndividualProgress,
      updatedWeeklyProgress,
    };
  },
);
