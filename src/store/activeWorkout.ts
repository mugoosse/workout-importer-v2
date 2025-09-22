import { type Id } from "@/convex/_generated/dataModel";
import {
  type ExerciseLog,
  type LoggedSet,
  type WorkoutSession,
  exerciseLogsAtom,
  getLastWorkoutSetsAtom,
  loggedSetsAtom,
  workoutSessionsAtom,
} from "@/store/exerciseLog";
import { atom } from "jotai";

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
  id: string; // Unique ID for this workout exercise instance
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
  fromRoutineId?: string; // Track which routine this exercise came from
}

export interface ActiveWorkout {
  id: string; // Unique workout session ID
  exercises: WorkoutExercise[];
  startTime: number;
  name?: string;
  isActive: boolean;
  startMethod?: "quick-start" | "routines" | "manual"; // Track how workout was started
  sourceRoutineIds?: string[]; // Track routine IDs if started from routines
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

// Utility function to generate unique set ID
export const generateWorkoutSetId = (): string => {
  return `wset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to generate unique workout ID
export const generateWorkoutId = (): string => {
  return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Action to start a new workout
export const startWorkoutAction = atom(
  null,
  (
    get,
    set,
    options?: {
      name?: string;
      startMethod?: "quick-start" | "routines" | "manual";
      sourceRoutineIds?: string[];
    },
  ) => {
    const newWorkout: ActiveWorkout = {
      id: generateWorkoutId(),
      exercises: [],
      startTime: Date.now(),
      name: options?.name,
      isActive: true,
      startMethod: options?.startMethod || "manual",
      sourceRoutineIds: options?.sourceRoutineIds,
    };
    set(activeWorkoutAtom, newWorkout);
    return newWorkout;
  },
);

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
          id: generateWorkoutId(), // Generate unique ID for workout exercise instance
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

    // If updating exercise data (not completion status), propagate to subsequent uncompleted sets
    const dataFields = ["weight", "reps", "duration", "distance"];
    const hasDataUpdates = dataFields.some((field) => field in updates);

    if (hasDataUpdates && !updates.isCompleted) {
      // Only propagate values to subsequent sets that are not completed and don't have values from routine
      for (let i = setIndex + 1; i < updatedSets.length; i++) {
        const subsequentSet = updatedSets[i];
        if (!subsequentSet.isCompleted) {
          // Propagate values only if the subsequent set doesn't already have the value
          const propagatedValues: Partial<WorkoutSet> = {};

          dataFields.forEach((field) => {
            const fieldKey = field as keyof Pick<
              WorkoutSet,
              "weight" | "reps" | "duration" | "distance"
            >;
            if (field in updates && updates[fieldKey] !== undefined) {
              // Only propagate if the subsequent set doesn't have this value
              if (!subsequentSet[fieldKey]) {
                (propagatedValues as any)[fieldKey] = updates[fieldKey];
              }
            }
          });

          // Only update if there are values to propagate
          if (Object.keys(propagatedValues).length > 0) {
            updatedSets[i] = { ...subsequentSet, ...propagatedValues };
          }
        }
      }
    }

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
export const finishWorkoutAction = atom(
  null,
  (
    get,
    set,
    options?: {
      name?: string;
      notes?: string;
      duration?: number;
      startTime?: number;
    },
  ) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout to finish");
    }

    const endTime = Date.now();
    const currentDate = new Date().toISOString().split("T")[0];

    // Filter out exercises with no completed sets
    const exercisesWithCompletedSets = currentWorkout.exercises.filter(
      (exercise) => exercise.sets.some((set) => set.isCompleted),
    );

    // Calculate totals for the workout session
    const completedSets = exercisesWithCompletedSets.flatMap((exercise) =>
      exercise.sets.filter((set) => set.isCompleted),
    );

    const totalSets = completedSets.length;
    const totalVolume = completedSets.reduce((vol, set) => {
      if (set.weight && set.reps) {
        return vol + set.weight * set.reps;
      }
      return vol;
    }, 0);

    const exerciseIds = exercisesWithCompletedSets.map((ex) => ex.exerciseId);

    // Use provided options or fall back to current workout values
    const workoutName = options?.name || currentWorkout.name;
    const workoutStartTime = options?.startTime || currentWorkout.startTime;
    const workoutEndTime = options?.duration
      ? workoutStartTime + options.duration
      : endTime;

    // Create workout session record
    const workoutSession: WorkoutSession = {
      id: currentWorkout.id,
      name: workoutName,
      startTime: workoutStartTime,
      endTime: workoutEndTime,
      exercises: exerciseIds,
      totalSets,
      totalVolume,
      totalXP: 0, // Will be calculated by the workout page
      date: currentDate,
    };

    // Convert workout sets to logged sets format
    const loggedSets: LoggedSet[] = [];

    exercisesWithCompletedSets.forEach((exercise) => {
      exercise.sets
        .filter(
          (workoutSet) => workoutSet.isCompleted && workoutSet.rpe != null,
        )
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

    // Note: XP calculation will be handled by a separate async function
    // after the workout is saved, since we need to fetch exercise details
    // from the database to get muscle information. This will be done
    // by the component that calls finishWorkoutAction.

    // Update atoms
    const currentWorkoutSessions = get(workoutSessionsAtom);
    const currentLoggedSets = get(loggedSetsAtom);

    set(workoutSessionsAtom, [...currentWorkoutSessions, workoutSession]);
    set(loggedSetsAtom, [...currentLoggedSets, ...loggedSets]);
    set(exerciseLogsAtom, [...currentExerciseLogs, ...exerciseLogs]);

    // Clear the active workout
    set(activeWorkoutAtom, initialWorkout);

    return { loggedSets, workoutSession };
  },
);

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
      id: generateWorkoutId(), // Generate unique ID for replacement exercise
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

// Action to add routines to active workout
export const addRoutinesToActiveWorkoutAction = atom(
  null,
  (get, set, routineIds: string[], routinesData: any[]) => {
    const currentWorkout = get(activeWorkoutAtom);
    if (!currentWorkout.isActive) {
      throw new Error("No active workout to add routines to");
    }

    // Get the function to fetch last workout sets
    const getLastWorkoutSets = get(getLastWorkoutSetsAtom);

    // Extract all exercises from the selected routines
    const routineExercises: {
      exerciseId: Id<"exercises">;
      exerciseDetails?: any;
    }[] = [];

    routinesData.forEach((routine) => {
      if (routine.exercises) {
        routine.exercises.forEach((exercise: any) => {
          routineExercises.push({
            exerciseId: exercise.exerciseId,
            exerciseDetails: exercise.exerciseDetails,
          });
        });
      }
    });

    // Create new workout exercises from routine exercises
    const newExercises: WorkoutExercise[] = routineExercises.map(
      ({ exerciseId, exerciseDetails }, index) => {
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
          id: generateWorkoutId(), // Generate unique ID for workout exercise instance
          exerciseId,
          exerciseDetails,
          sets: initialSets,
          order: currentWorkout.exercises.length + index,
        };
      },
    );

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, ...newExercises],
      // Update source routine IDs to include the new ones
      sourceRoutineIds: [
        ...(currentWorkout.sourceRoutineIds || []),
        ...routineIds,
      ],
    };

    set(activeWorkoutAtom, updatedWorkout);
    return updatedWorkout;
  },
);
