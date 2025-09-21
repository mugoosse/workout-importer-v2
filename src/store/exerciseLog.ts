import { atom } from "jotai";
import { type Id } from "@/convex/_generated/dataModel";

export type ExerciseType =
  | "Weight Reps"
  | "Reps Only"
  | "Weighted Bodyweight"
  | "Assisted Bodyweight"
  | "Duration"
  | "Weight & Duration"
  | "Distance & Duration"
  | "Weight & Distance";

export interface LoggedSet {
  id: string;
  exerciseId: Id<"exercises">;
  reps?: number; // For reps-based exercises
  weight?: number; // Weight in kg
  duration?: number; // Duration in seconds
  distance?: number; // Distance in meters
  rpe: number; // Rate of Perceived Exertion (1-10 scale)
  timestamp: number;
  date: string; // YYYY-MM-DD format for grouping
}

export interface ExerciseLog {
  id: string;
  exerciseId: Id<"exercises">;
  workoutDate: string; // YYYY-MM-DD format
  notes?: string;
  timestamp: number;
}

export interface ExerciseLogSummary {
  exerciseId: Id<"exercises">;
  totalSets: number;
  lastLoggedDate: string;
  lastLoggedTimestamp: number;
  notes?: string; // Most recent exercise notes
}

// Simple atom for logged sets (will be enhanced with persistence later)
export const loggedSetsAtom = atom<LoggedSet[]>([]);

// Simple atom for exercise logs (client-side only)
export const exerciseLogsAtom = atom<ExerciseLog[]>([]);

// Derived atom for exercise log summaries
export const exerciseLogSummariesAtom = atom<ExerciseLogSummary[]>((get) => {
  const loggedSets = get(loggedSetsAtom);
  const exerciseLogs = get(exerciseLogsAtom);

  // Group sets by exercise
  const exerciseGroups = loggedSets.reduce(
    (acc, set) => {
      if (!acc[set.exerciseId]) {
        acc[set.exerciseId] = [];
      }
      acc[set.exerciseId].push(set);
      return acc;
    },
    {} as Record<string, LoggedSet[]>,
  );

  // Create summaries
  return Object.entries(exerciseGroups)
    .map(([exerciseId, sets]) => {
      const sortedSets = sets.sort((a, b) => b.timestamp - a.timestamp);
      const lastSet = sortedSets[0];

      // Get the most recent exercise log notes for this exercise
      const exerciseLogForExercise = exerciseLogs
        .filter((log) => log.exerciseId === exerciseId)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      return {
        exerciseId: exerciseId as Id<"exercises">,
        totalSets: sets.length,
        lastLoggedDate: lastSet.date,
        lastLoggedTimestamp: lastSet.timestamp,
        notes: exerciseLogForExercise?.notes,
      };
    })
    .sort((a, b) => b.lastLoggedTimestamp - a.lastLoggedTimestamp);
});

// Atom for getting sets by exercise ID
export const getSetsByExerciseAtom = atom(
  (get) => (exerciseId: Id<"exercises">) => {
    const loggedSets = get(loggedSetsAtom);
    return loggedSets
      .filter((set) => set.exerciseId === exerciseId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
);

// Atom for getting today's logged exercises
export const todaysLoggedExercisesAtom = atom((get) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const loggedSets = get(loggedSetsAtom);

  const todaySets = loggedSets.filter((set) => set.date === today);
  const exerciseIds = [...new Set(todaySets.map((set) => set.exerciseId))];

  return exerciseIds;
});

// Utility function to generate unique ID
export const generateSetId = (): string => {
  return `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to format date for logging
export const formatDateForLogging = (date: Date = new Date()): string => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

// Action to log a new set
export const logSetAction = atom(
  null,
  (get, set, logData: Omit<LoggedSet, "id" | "timestamp" | "date">) => {
    const currentSets = get(loggedSetsAtom);
    const now = Date.now();
    const newSet: LoggedSet = {
      ...logData,
      id: generateSetId(),
      timestamp: now,
      date: formatDateForLogging(new Date(now)),
    };

    set(loggedSetsAtom, [...currentSets, newSet]);
    return newSet;
  },
);

// Action to log exercise notes
export const logExerciseAction = atom(
  null,
  (get, set, logData: Omit<ExerciseLog, "id" | "timestamp">) => {
    const currentExerciseLogs = get(exerciseLogsAtom);
    const now = Date.now();
    const newExerciseLog: ExerciseLog = {
      ...logData,
      id: `exercise_log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
    };

    set(exerciseLogsAtom, [...currentExerciseLogs, newExerciseLog]);
    return newExerciseLog;
  },
);

// Action to remove a set
export const removeSetAction = atom(null, (get, set, setId: string) => {
  const currentSets = get(loggedSetsAtom);
  set(
    loggedSetsAtom,
    currentSets.filter((s) => s.id !== setId),
  );
});

// Action to clear all logs (for testing/reset)
export const clearAllLogsAction = atom(null, (get, set) => {
  set(loggedSetsAtom, []);
});

// Atom for getting previous workout session sets for an exercise
export const getLastWorkoutSetsAtom = atom(
  (get) => (exerciseId: Id<"exercises">) => {
    const loggedSets = get(loggedSetsAtom);

    // Get all sets for this exercise, sorted by timestamp
    const exerciseSets = loggedSets
      .filter((set) => set.exerciseId === exerciseId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (exerciseSets.length === 0) {
      return [];
    }

    // Group sets by date to find workout sessions
    const setsByDate = exerciseSets.reduce(
      (acc, set) => {
        if (!acc[set.date]) {
          acc[set.date] = [];
        }
        acc[set.date].push(set);
        return acc;
      },
      {} as Record<string, LoggedSet[]>,
    );

    // Get dates sorted by most recent first
    const sortedDates = Object.keys(setsByDate).sort((a, b) =>
      b.localeCompare(a),
    );

    if (sortedDates.length === 0) {
      return [];
    }

    // Return the most recent workout session's sets
    const lastWorkoutDate = sortedDates[0];
    return setsByDate[lastWorkoutDate].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  },
);
