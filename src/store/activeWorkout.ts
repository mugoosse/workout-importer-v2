import { atom } from "jotai";
import { type Id } from "@/convex/_generated/dataModel";
import {
  type LoggedSet,
  type ExerciseLog,
  type WorkoutSession,
  getLastWorkoutSetsAtom,
  exerciseLogsAtom,
  workoutSessionsAtom,
  loggedSetsAtom,
} from "@/store/exerciseLog";

export interface WorkoutSet {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rpe?: number;
  timestamp: number;
  isCompleted: boolean;
}

export interface WorkoutExercise {
  exerciseId: Id<"exercises">;
  exerciseDetails?: {
    name: string;
    type: string;
    equipment?: string[];
    instructions?: string;
  };
  sets: WorkoutSet[];
  order: number;
  notes?: string;
}

export interface ActiveWorkout {
  id: string; // Unique workout session ID
  exercises: WorkoutExercise[];
  startTime: number;
  name?: string;
  isActive: boolean;
}

// Initial state
const initialWorkout: ActiveWorkout = {
  id: "",
  exercises: [],
  startTime: 0,
  isActive: false,
};

// Main active workout atom
export const activeWorkoutAtom = atom<ActiveWorkout>(initialWorkout);

// Timer atom to force duration recalculation
const timerAtom = atom(0);

// Action to tick the timer
export const tickTimerAction = atom(null, (get, set) => {
  set(timerAtom, Date.now());
});

// Derived atom for workout duration
export const workoutDurationAtom = atom((get) => {
  get(timerAtom); // Subscribe to timer updates
  const workout = get(activeWorkoutAtom);
  if (!workout.isActive || workout.startTime === 0) {
    return 0;
  }
  return Date.now() - workout.startTime;
});

// Derived atom for total volume (weight * reps)
export const workoutVolumeAtom = atom((get) => {
  const workout = get(activeWorkoutAtom);
  return workout.exercises.reduce((totalVolume, exercise) => {
    const exerciseVolume = exercise.sets
      .filter((set) => set.isCompleted && set.weight && set.reps)
      .reduce((vol, set) => vol + set.weight! * set.reps!, 0);
    return totalVolume + exerciseVolume;
  }, 0);
});

// Derived atom for total completed sets
export const workoutSetsCountAtom = atom((get) => {
  const workout = get(activeWorkoutAtom);
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((set) => set.isCompleted).length;
  }, 0);
});

// Utility function to generate unique set ID
export const generateWorkoutSetId = (): string => {
  return `wset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to generate unique workout ID
export const generateWorkoutId = (): string => {
  return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Action to start a new workout
export const startWorkoutAction = atom(null, (get, set, name?: string) => {
  const newWorkout: ActiveWorkout = {
    id: generateWorkoutId(),
    exercises: [],
    startTime: Date.now(),
    name,
    isActive: true,
  };
  set(activeWorkoutAtom, newWorkout);
  return newWorkout;
});

// Action to add exercises to workout
export const addExercisesToWorkoutAction = atom(
  null,
  (
    get,
    set,
    exerciseIds: Id<"exercises">[],
    exerciseDetails?: Record<Id<"exercises">, any>,
  ) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout to add exercises to");
    }

    // Get the function to fetch last workout sets
    const getLastWorkoutSets = get(getLastWorkoutSetsAtom);

    const newExercises: WorkoutExercise[] = exerciseIds.map(
      (exerciseId, index) => {
        // Get previous workout sets for this exercise
        const previousSets = getLastWorkoutSets(exerciseId);

        // Initialize sets based on previous workout history
        let initialSets: WorkoutSet[] = [];

        if (previousSets.length > 0) {
          // Create the same number of empty sets as the previous workout
          initialSets = previousSets.map(() => ({
            id: generateWorkoutSetId(),
            rpe: undefined,
            timestamp: Date.now(),
            isCompleted: false,
          }));
        } else {
          // No previous data, create one empty set
          initialSets = [
            {
              id: generateWorkoutSetId(),
              rpe: undefined,
              timestamp: Date.now(),
              isCompleted: false,
            },
          ];
        }

        return {
          exerciseId,
          exerciseDetails: exerciseDetails?.[exerciseId],
          sets: initialSets,
          order: currentWorkout.exercises.length + index,
        };
      },
    );

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, ...newExercises],
    };

    set(activeWorkoutAtom, updatedWorkout);
    return updatedWorkout;
  },
);

// Action to add a set to an exercise
export const addSetToExerciseAction = atom(
  null,
  (get, set, exerciseId: Id<"exercises">, setData: Partial<WorkoutSet>) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout");
    }

    const exerciseIndex = currentWorkout.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId,
    );

    if (exerciseIndex === -1) {
      throw new Error("Exercise not found in workout");
    }

    const newSet: WorkoutSet = {
      id: generateWorkoutSetId(),
      reps: setData.reps,
      weight: setData.weight,
      duration: setData.duration,
      distance: setData.distance,
      rpe: setData.rpe,
      timestamp: Date.now(),
      isCompleted: setData.isCompleted || false,
    };

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: [...updatedExercises[exerciseIndex].sets, newSet],
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    set(activeWorkoutAtom, updatedWorkout);
    return newSet;
  },
);

// Action to update a set
export const updateSetAction = atom(
  null,
  (
    get,
    set,
    exerciseId: Id<"exercises">,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout");
    }

    const exerciseIndex = currentWorkout.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId,
    );

    if (exerciseIndex === -1) {
      throw new Error("Exercise not found in workout");
    }

    const setIndex = currentWorkout.exercises[exerciseIndex].sets.findIndex(
      (s) => s.id === setId,
    );

    if (setIndex === -1) {
      throw new Error("Set not found");
    }

    const updatedExercises = [...currentWorkout.exercises];
    const updatedSets = [...updatedExercises[exerciseIndex].sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], ...updates };
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedSets,
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    set(activeWorkoutAtom, updatedWorkout);
  },
);

// Action to remove a set
export const removeSetAction = atom(
  null,
  (get, set, exerciseId: Id<"exercises">, setId: string) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout");
    }

    const exerciseIndex = currentWorkout.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId,
    );

    if (exerciseIndex === -1) {
      throw new Error("Exercise not found in workout");
    }

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedExercises[exerciseIndex].sets.filter((s) => s.id !== setId),
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    set(activeWorkoutAtom, updatedWorkout);
  },
);

// Action to update exercise notes
export const updateExerciseNotesAction = atom(
  null,
  (get, set, exerciseId: Id<"exercises">, notes: string) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout");
    }

    const exerciseIndex = currentWorkout.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId,
    );

    if (exerciseIndex === -1) {
      throw new Error("Exercise not found in workout");
    }

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      notes,
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    set(activeWorkoutAtom, updatedWorkout);
  },
);

// Action to finish workout and convert to logged sets
export const finishWorkoutAction = atom(null, (get, set) => {
  const currentWorkout = get(activeWorkoutAtom);
  if (!currentWorkout.isActive) {
    throw new Error("No active workout to finish");
  }

  const endTime = Date.now();
  const currentDate = new Date().toISOString().split("T")[0];

  // Calculate totals for the workout session
  const completedSets = currentWorkout.exercises.flatMap((exercise) =>
    exercise.sets.filter((set) => set.isCompleted),
  );

  const totalSets = completedSets.length;
  const totalVolume = completedSets.reduce((vol, set) => {
    if (set.weight && set.reps) {
      return vol + set.weight * set.reps;
    }
    return vol;
  }, 0);

  const exerciseIds = currentWorkout.exercises.map((ex) => ex.exerciseId);

  // Create workout session record
  const workoutSession: WorkoutSession = {
    id: currentWorkout.id,
    name: currentWorkout.name,
    startTime: currentWorkout.startTime,
    endTime,
    exercises: exerciseIds,
    totalSets,
    totalVolume,
    totalXP: 0, // Will be calculated by the workout page
    date: currentDate,
  };

  // Convert workout sets to logged sets format
  const loggedSets: LoggedSet[] = [];

  currentWorkout.exercises.forEach((exercise) => {
    exercise.sets
      .filter((workoutSet) => workoutSet.isCompleted && workoutSet.rpe != null)
      .forEach((workoutSet) => {
        const loggedSet: LoggedSet = {
          id: workoutSet.id,
          exerciseId: exercise.exerciseId,
          workoutSessionId: currentWorkout.id,
          reps: workoutSet.reps,
          weight: workoutSet.weight,
          duration: workoutSet.duration,
          distance: workoutSet.distance,
          rpe: workoutSet.rpe!, // We know it's not null due to filter
          timestamp: workoutSet.timestamp,
          date: currentDate,
        };
        loggedSets.push(loggedSet);
      });
  });

  // Log exercise notes separately
  const currentExerciseLogs = get(exerciseLogsAtom);
  const exerciseLogs: ExerciseLog[] = [];

  currentWorkout.exercises.forEach((exercise) => {
    if (exercise.notes && exercise.sets.some((set) => set.isCompleted)) {
      const exerciseLog: ExerciseLog = {
        id: `exercise_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: exercise.exerciseId,
        workoutDate: currentDate,
        notes: exercise.notes,
        timestamp: Date.now(),
      };
      exerciseLogs.push(exerciseLog);
    }
  });

  // Update atoms
  const currentWorkoutSessions = get(workoutSessionsAtom);
  const currentLoggedSets = get(loggedSetsAtom);

  set(workoutSessionsAtom, [...currentWorkoutSessions, workoutSession]);
  set(loggedSetsAtom, [...currentLoggedSets, ...loggedSets]);
  set(exerciseLogsAtom, [...currentExerciseLogs, ...exerciseLogs]);

  // Clear the active workout
  set(activeWorkoutAtom, initialWorkout);

  return { loggedSets, workoutSession };
});

// Action to discard workout
export const discardWorkoutAction = atom(null, (get, set) => {
  set(activeWorkoutAtom, initialWorkout);
});

// Action to remove exercise from workout
export const removeExerciseFromWorkoutAction = atom(
  null,
  (get, set, exerciseId: Id<"exercises">) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout");
    }

    const updatedExercises = currentWorkout.exercises
      .filter((ex) => ex.exerciseId !== exerciseId)
      .map((ex, index) => ({ ...ex, order: index })); // Reorder remaining exercises

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    set(activeWorkoutAtom, updatedWorkout);
  },
);

// Action to replace exercise in workout
export const replaceExerciseInWorkoutAction = atom(
  null,
  (
    get,
    set,
    oldExerciseId: Id<"exercises">,
    newExerciseId: Id<"exercises">,
    newExerciseDetails?: any,
  ) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout");
    }

    const exerciseIndex = currentWorkout.exercises.findIndex(
      (ex) => ex.exerciseId === oldExerciseId,
    );
    if (exerciseIndex === -1) {
      throw new Error("Exercise not found");
    }

    const getLastWorkoutSets = get(getLastWorkoutSetsAtom);
    const previousSets = getLastWorkoutSets(newExerciseId);

    // Create initial sets based on history or keep existing structure
    const currentSets = currentWorkout.exercises[exerciseIndex].sets;
    let initialSets: WorkoutSet[];

    if (previousSets.length > 0) {
      // Use previous workout history for new exercise
      initialSets = previousSets.map(() => ({
        id: generateWorkoutSetId(),
        rpe: undefined,
        timestamp: Date.now(),
        isCompleted: false,
      }));
    } else {
      // No history, adapt current set structure but reset values
      initialSets = currentSets.map(() => ({
        id: generateWorkoutSetId(),
        rpe: undefined,
        timestamp: Date.now(),
        isCompleted: false,
      }));
    }

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex] = {
      exerciseId: newExerciseId,
      exerciseDetails: newExerciseDetails,
      sets: initialSets,
      order: updatedExercises[exerciseIndex].order,
      notes: undefined, // Clear notes for new exercise
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
    };

    set(activeWorkoutAtom, updatedWorkout);
  },
);
