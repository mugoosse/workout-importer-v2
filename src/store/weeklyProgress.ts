import { atom } from "jotai";
import { type MajorMuscleGroup } from "@/utils/muscleMapping";

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

// Major muscle group progress data
export const weeklyProgressAtom = atom<WeeklyProgressData[]>([
  {
    majorGroup: "chest" as MajorMuscleGroup,
    level: 8,
    xp: 12450,
    nextLevel: 15000,
    percentage: 15,
    streak: 3,
  },
  {
    majorGroup: "back" as MajorMuscleGroup,
    level: 9,
    xp: 16800,
    nextLevel: 20000,
    percentage: 35,
    streak: 2,
  },
  {
    majorGroup: "legs" as MajorMuscleGroup,
    level: 10,
    xp: 22100,
    nextLevel: 25000,
    percentage: 60,
    streak: 6,
  },
  {
    majorGroup: "shoulders" as MajorMuscleGroup,
    level: 6,
    xp: 8200,
    nextLevel: 10000,
    percentage: 85,
    streak: 1,
  },
  {
    majorGroup: "arms" as MajorMuscleGroup,
    level: 7,
    xp: 9800,
    nextLevel: 12000,
    percentage: 105,
    streak: 8,
  },
  {
    majorGroup: "core" as MajorMuscleGroup,
    level: 5,
    xp: 5900,
    nextLevel: 7500,
    percentage: 79,
    streak: 4,
  },
]);

// Note: Exercise count data is now dynamically loaded from the database
// This store maintains progress data, while exercise availability is determined in real-time

// Individual muscle progress data
export const individualMuscleProgressAtom = atom<
  Record<string, IndividualMuscleProgress>
>({
  // Legs
  rectus_femoris: {
    xp: 450,
    goal: 500,
    percentage: 90,
    streak: 3,
    sets: 12,
    hasExercises: true,
  },
  vastus_lateralis: {
    xp: 380,
    goal: 500,
    percentage: 76,
    streak: 2,
    sets: 8,
    hasExercises: true,
  },
  vastus_medialis: {
    xp: 420,
    goal: 500,
    percentage: 84,
    streak: 4,
    sets: 10,
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
    xp: 280,
    goal: 400,
    percentage: 70,
    streak: 1,
    sets: 6,
    hasExercises: true,
  },
  gastrocnemius: {
    xp: 320,
    goal: 400,
    percentage: 80,
    streak: 3,
    sets: 8,
    hasExercises: true,
  },
  soleus: {
    xp: 260,
    goal: 400,
    percentage: 65,
    streak: 2,
    sets: 5,
    hasExercises: true,
  },
  gluteus_maximus: {
    xp: 480,
    goal: 500,
    percentage: 96,
    streak: 5,
    sets: 15,
    hasExercises: true,
  },
  gluteus_medius: {
    xp: 340,
    goal: 400,
    percentage: 85,
    streak: 3,
    sets: 7,
    hasExercises: true,
  },
  adductor_longus_and_pectineus: {
    xp: 200,
    goal: 300,
    percentage: 67,
    streak: 2,
    sets: 4,
    hasExercises: true,
  },
  adductor_magnus: {
    xp: 180,
    goal: 300,
    percentage: 60,
    streak: 1,
    sets: 3,
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
    xp: 140,
    goal: 300,
    percentage: 47,
    streak: 1,
    sets: 2,
    hasExercises: true,
  },
  peroneus_longus: {
    xp: 120,
    goal: 200,
    percentage: 60,
    streak: 2,
    sets: 3,
    hasExercises: true,
  },

  // Chest
  pectoralis_major: {
    xp: 120,
    goal: 500,
    percentage: 24,
    streak: 2,
    sets: 4,
    hasExercises: true,
  },
  serratus_anterior: {
    xp: 80,
    goal: 300,
    percentage: 27,
    streak: 1,
    sets: 2,
    hasExercises: true,
  },

  // Back
  latissimus_dorsi: {
    xp: 180,
    goal: 500,
    percentage: 36,
    streak: 2,
    sets: 6,
    hasExercises: true,
  },
  lower_trapezius: {
    xp: 160,
    goal: 400,
    percentage: 40,
    streak: 2,
    sets: 5,
    hasExercises: true,
  },
  rhomboid_muscles: {
    xp: 140,
    goal: 400,
    percentage: 35,
    streak: 1,
    sets: 4,
    hasExercises: true,
  },
  trapezius: {
    xp: 200,
    goal: 500,
    percentage: 40,
    streak: 3,
    sets: 7,
    hasExercises: true,
  },
  teres_major: {
    xp: 120,
    goal: 300,
    percentage: 40,
    streak: 1,
    sets: 3,
    hasExercises: true,
  },
  erector_spinae: {
    xp: 150,
    goal: 400,
    percentage: 38,
    streak: 2,
    sets: 5,
    hasExercises: true,
  },
  infraspinatus: {
    xp: 100,
    goal: 300,
    percentage: 33,
    streak: 1,
    sets: 3,
    hasExercises: true,
  },

  // Shoulders
  deltoids: {
    xp: 420,
    goal: 500,
    percentage: 84,
    streak: 4,
    sets: 12,
    hasExercises: true,
  },

  // Arms
  biceps_brachii: {
    xp: 520,
    goal: 500,
    percentage: 104,
    streak: 6,
    sets: 18,
    hasExercises: true,
  },
  triceps_brachii: {
    xp: 480,
    goal: 500,
    percentage: 96,
    streak: 5,
    sets: 16,
    hasExercises: true,
  },
  brachialis: {
    xp: 380,
    goal: 400,
    percentage: 95,
    streak: 4,
    sets: 12,
    hasExercises: true,
  },
  brachioradialis: {
    xp: 340,
    goal: 400,
    percentage: 85,
    streak: 3,
    sets: 10,
    hasExercises: true,
  },
  extensor_carpi_radialis: {
    xp: 280,
    goal: 300,
    percentage: 93,
    streak: 4,
    sets: 8,
    hasExercises: true,
  },
  flexor_carpi_radialis: {
    xp: 260,
    goal: 300,
    percentage: 87,
    streak: 3,
    sets: 7,
    hasExercises: true,
  },
  flexor_carpi_ulnaris: {
    xp: 240,
    goal: 300,
    percentage: 80,
    streak: 3,
    sets: 6,
    hasExercises: true,
  },

  // Core
  rectus_abdominis: {
    xp: 320,
    goal: 400,
    percentage: 80,
    streak: 4,
    sets: 10,
    hasExercises: true,
  },
  external_obliques: {
    xp: 280,
    goal: 400,
    percentage: 70,
    streak: 3,
    sets: 8,
    hasExercises: true,
  },
  omohyoid: {
    xp: 200,
    goal: 300,
    percentage: 67,
    streak: 2,
    sets: 5,
    hasExercises: true,
  },
  sternocleidomastoid: {
    xp: 180,
    goal: 300,
    percentage: 60,
    streak: 2,
    sets: 4,
    hasExercises: true,
  },
});

// Utility function to get progress color
export const getProgressColor = (progress: number): string => {
  if (progress >= 100) return "#1FD224";
  if (progress >= 75) return "#98DA00";
  if (progress >= 50) return "#FCD514";
  if (progress >= 25) return "#FF8A1B";
  return "#FF5C14";
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
