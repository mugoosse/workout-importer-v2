import { type Id } from "@/convex/_generated/dataModel";
import {
  type ActiveWorkout,
  generateWorkoutId,
  type WorkoutExercise,
  type WorkoutSet,
} from "@/store/activeWorkout";
import { type DistanceUnit, type WeightUnit } from "@/store/units";
import {
  FALLBACK_EXERCISES,
  findAllRealExercises,
} from "@/utils/findRealExercises";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Routine Set - similar to WorkoutSet but without completion/RPE and with optional values
export interface RoutineSet {
  id: string;
  // For strength exercises
  reps?: number;
  weight?: number;
  weightUnit?: WeightUnit;
  // For cardio/duration exercises
  duration?: number; // in seconds
  distance?: number;
  distanceUnit?: DistanceUnit;
  // General
  restSeconds?: number;
  notes?: string;
}

// Routine Exercise - similar to WorkoutExercise but focused on template
export interface RoutineExercise {
  id: string;
  exerciseId: Id<"exercises">;
  exerciseDetails?: {
    name: string;
    type: string;
    equipment?: string[];
    instructions?: string;
  };
  sets: RoutineSet[];
  notes?: string;
  order: number;
}

// Main Routine interface
export interface Routine {
  id: string;
  title: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
  version: number;
  source: "my" | "public";
}

// Draft for creating/editing routines
export interface RoutineDraft {
  id?: string;
  title: string;
  description?: string;
  exercises: RoutineExercise[];
  isUnsaved: boolean;
}

// Storage atoms
export const myRoutinesAtom = atomWithStorage<Routine[]>("routines.v1", []);

// Seeded public routines - using template exercise IDs that will be handled specially
const publicRoutinesData: Routine[] = [
  {
    id: "public:full-body-home",
    title: "Full Body Home Workout",
    description: "Complete bodyweight routine for home training",
    exercises: [
      {
        id: "ex1",
        exerciseId: "template:pushups" as Id<"exercises">,
        exerciseDetails: {
          name: "Push-ups",
          type: "Reps Only",
          equipment: [],
        },
        sets: [
          { id: "set1", reps: 10 },
          { id: "set2", reps: 10 },
          { id: "set3", reps: 10 },
        ],
        order: 0,
      },
      {
        id: "ex2",
        exerciseId: "template:squats" as Id<"exercises">,
        exerciseDetails: {
          name: "Bodyweight Squats",
          type: "Reps Only",
          equipment: [],
        },
        sets: [
          { id: "set1", reps: 15 },
          { id: "set2", reps: 15 },
          { id: "set3", reps: 15 },
        ],
        order: 1,
      },
      {
        id: "ex3",
        exerciseId: "template:plank" as Id<"exercises">,
        exerciseDetails: {
          name: "Plank",
          type: "Duration",
          equipment: [],
        },
        sets: [
          { id: "set1", duration: 30 },
          { id: "set2", duration: 45 },
          { id: "set3", duration: 60 },
        ],
        order: 2,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    source: "public",
  },
  {
    id: "public:warmup-5min",
    title: "Warmup (5 min)",
    description: "Quick dynamic warmup routine",
    exercises: [
      {
        id: "ex1",
        exerciseId: "template:jumping-jacks" as Id<"exercises">,
        exerciseDetails: {
          name: "Jumping Jacks",
          type: "Duration",
          equipment: [],
        },
        sets: [{ id: "set1", duration: 60 }],
        order: 0,
      },
      {
        id: "ex2",
        exerciseId: "template:arm-circles" as Id<"exercises">,
        exerciseDetails: {
          name: "Arm Circles",
          type: "Duration",
          equipment: [],
        },
        sets: [{ id: "set1", duration: 30 }],
        order: 1,
      },
      {
        id: "ex3",
        exerciseId: "template:high-knees" as Id<"exercises">,
        exerciseDetails: {
          name: "High Knees",
          type: "Duration",
          equipment: [],
        },
        sets: [{ id: "set1", duration: 60 }],
        order: 2,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    source: "public",
  },
  {
    id: "public:push-day",
    title: "Push Day (Barbell Focus)",
    description: "Upper body push workout with barbell emphasis",
    exercises: [
      {
        id: "ex1",
        exerciseId: "template:bench-press" as Id<"exercises">,
        exerciseDetails: {
          name: "Bench Press (Barbell)",
          type: "Weight Reps",
          equipment: ["Barbell", "Bench"],
        },
        sets: [
          { id: "set1", reps: 8, weight: 60, weightUnit: "kg" },
          { id: "set2", reps: 8, weight: 60, weightUnit: "kg" },
          { id: "set3", reps: 8, weight: 60, weightUnit: "kg" },
        ],
        order: 0,
      },
      {
        id: "ex2",
        exerciseId: "template:overhead-press" as Id<"exercises">,
        exerciseDetails: {
          name: "Overhead Press (Barbell)",
          type: "Weight Reps",
          equipment: ["Barbell"],
        },
        sets: [
          { id: "set1", reps: 10, weight: 40, weightUnit: "kg" },
          { id: "set2", reps: 10, weight: 40, weightUnit: "kg" },
          { id: "set3", reps: 10, weight: 40, weightUnit: "kg" },
        ],
        order: 1,
      },
      {
        id: "ex3",
        exerciseId: "template:tricep-dips" as Id<"exercises">,
        exerciseDetails: {
          name: "Tricep Dips",
          type: "Reps Only",
          equipment: ["Parallel Bars"],
        },
        sets: [
          { id: "set1", reps: 12 },
          { id: "set2", reps: 12 },
          { id: "set3", reps: 12 },
        ],
        order: 2,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    source: "public",
  },
  {
    id: "public:cardio-20min",
    title: "20-min Zone 2 Cardio",
    description: "Moderate intensity cardio session",
    exercises: [
      {
        id: "ex1",
        exerciseId: "template:treadmill-run" as Id<"exercises">,
        exerciseDetails: {
          name: "Treadmill Run",
          type: "Distance & Duration",
          equipment: ["Treadmill"],
        },
        sets: [
          {
            id: "set1",
            duration: 1200, // 20 minutes
            distance: 3000, // 3km
            distanceUnit: "km",
          },
        ],
        order: 0,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    source: "public",
  },
];

// Public routines atom that will be populated with real exercise IDs
export const publicRoutinesAtom = atom<Routine[]>(publicRoutinesData);

// Atom to track if we've populated real exercise IDs
export const realExerciseIdsPopulatedAtom = atom<boolean>(false);

// Action to populate public routines with real exercise IDs from database
export const populateRealExerciseIdsAction = atom(
  null,
  async (get, set, convex: any) => {
    const isAlreadyPopulated = get(realExerciseIdsPopulatedAtom);
    if (isAlreadyPopulated) return;

    try {
      // Find real exercise IDs
      const realExercises = await findAllRealExercises(convex);

      // Map of template IDs to real exercise data
      const exerciseMapping: Record<
        string,
        {
          id: string;
          name?: string;
          title?: string;
          type?: string;
          exerciseType?: string;
        }
      > = {
        "template:pushups": realExercises.pushups || {
          id: "fallback:pushups",
          ...FALLBACK_EXERCISES.pushups,
        },
        "template:squats": realExercises.squats || {
          id: "fallback:squats",
          ...FALLBACK_EXERCISES.squats,
        },
        "template:plank": realExercises.plank || {
          id: "fallback:plank",
          ...FALLBACK_EXERCISES.plank,
        },
        "template:jumping-jacks": realExercises.jumpingJacks || {
          id: "fallback:jumping-jacks",
          ...FALLBACK_EXERCISES.jumpingJacks,
        },
        "template:arm-circles": realExercises.armCircles || {
          id: "fallback:arm-circles",
          ...FALLBACK_EXERCISES.armCircles,
        },
        "template:high-knees": realExercises.highKnees || {
          id: "fallback:high-knees",
          ...FALLBACK_EXERCISES.highKnees,
        },
        "template:bench-press": realExercises.benchPress || {
          id: "fallback:bench-press",
          ...FALLBACK_EXERCISES.benchPress,
        },
        "template:overhead-press": realExercises.overheadPress || {
          id: "fallback:overhead-press",
          ...FALLBACK_EXERCISES.overheadPress,
        },
        "template:tricep-dips": realExercises.tricepDips || {
          id: "fallback:tricep-dips",
          ...FALLBACK_EXERCISES.tricepDips,
        },
        "template:treadmill-run": realExercises.treadmillRun || {
          id: "fallback:treadmill-run",
          ...FALLBACK_EXERCISES.treadmillRun,
        },
      };

      // Update public routines with real exercise IDs
      const updatedRoutines = publicRoutinesData.map((routine) => ({
        ...routine,
        exercises: routine.exercises.map((exercise) => {
          const realExercise = exerciseMapping[exercise.exerciseId];
          if (realExercise) {
            return {
              ...exercise,
              exerciseId: realExercise.id as Id<"exercises">,
              exerciseDetails: {
                name:
                  realExercise.name ||
                  realExercise.title ||
                  exercise.exerciseDetails?.name ||
                  "Unknown Exercise",
                type:
                  realExercise.exerciseType ||
                  realExercise.type ||
                  exercise.exerciseDetails?.type ||
                  "Reps Only",
                equipment: exercise.exerciseDetails?.equipment,
                instructions: exercise.exerciseDetails?.instructions,
              },
            };
          }
          return exercise;
        }),
      }));

      set(publicRoutinesAtom, updatedRoutines);
      set(realExerciseIdsPopulatedAtom, true);
    } catch (error) {
      console.error("❌ Failed to populate real exercise IDs:", error);
      // Keep the template exercises as fallback
    }
  },
);

// Selection state atoms
export const routineSelectionOpenAtom = atom<boolean>(false);
export const selectedRoutineIdsAtom = atom<Set<string>>(new Set<string>());

// New atoms for handling routine creation flow
export const newlyCreatedRoutineIdAtom = atom<string | null>(null);
export const shouldReopenModalAtom = atom<boolean>(false);

// Editor state atoms
export const routineEditorAtom = atom<RoutineDraft | null>(null);

// Derived atom for routine validation
export const routineValidationAtom = atom((get) => {
  const draft = get(routineEditorAtom);
  if (!draft) return { isValid: true, errors: [] };

  const errors: string[] = [];

  if (!draft.title.trim()) {
    errors.push("Title is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
});

// Action atoms
export const createRoutineAction = atom(
  null,
  (
    get,
    set,
    routine: Omit<
      Routine,
      "id" | "createdAt" | "updatedAt" | "version" | "source"
    >,
  ) => {
    const currentRoutines = get(myRoutinesAtom);
    const now = Date.now();
    const newRoutine: Routine = {
      ...routine,
      id: `routine_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      source: "my",
    };

    set(myRoutinesAtom, [...currentRoutines, newRoutine]);
    return newRoutine;
  },
);

export const updateRoutineAction = atom(null, (get, set, routine: Routine) => {
  const currentRoutines = get(myRoutinesAtom);
  const updatedRoutines = currentRoutines.map((r) =>
    r.id === routine.id ? { ...routine, updatedAt: Date.now() } : r,
  );
  set(myRoutinesAtom, updatedRoutines);
});

export const deleteRoutineAction = atom(null, (get, set, routineId: string) => {
  const currentRoutines = get(myRoutinesAtom);
  const filteredRoutines = currentRoutines.filter((r) => r.id !== routineId);
  set(myRoutinesAtom, filteredRoutines);
});

// Helper to generate unique IDs
export const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Utility functions for stacking routines
export const convertRoutineSetToWorkoutSet = (
  routineSet: RoutineSet,
  clearValues: boolean = false,
): WorkoutSet => {
  const baseSet: WorkoutSet = {
    id: generateId(),
    timestamp: Date.now(),
    isCompleted: false,
  };

  if (clearValues) {
    return baseSet;
  }

  // Preserve values from routine set
  if (routineSet.reps !== undefined) baseSet.reps = routineSet.reps;
  if (routineSet.weight !== undefined) baseSet.weight = routineSet.weight;
  if (routineSet.duration !== undefined) baseSet.duration = routineSet.duration;
  if (routineSet.distance !== undefined) baseSet.distance = routineSet.distance;

  return baseSet;
};

export const convertRoutineExerciseToWorkoutExercise = (
  routineExercise: RoutineExercise,
  order: number,
  clearValues: boolean = false,
  fromRoutineId?: string,
): WorkoutExercise => {
  return {
    id: generateId(), // Generate unique ID for workout exercise instance
    exerciseId: routineExercise.exerciseId,
    exerciseDetails: routineExercise.exerciseDetails,
    sets: routineExercise.sets.map((set) =>
      convertRoutineSetToWorkoutSet(set, clearValues),
    ),
    order,
    notes: routineExercise.notes,
    // Store reference to source routine for traceability
    ...(fromRoutineId && { fromRoutineId }),
  };
};

// Main stacking function
export const stackRoutinesIntoWorkout = (
  routineIds: string[],
  allRoutines: Routine[],
  options: { clearValues?: boolean; workoutName?: string } = {},
): ActiveWorkout => {
  const { clearValues = false, workoutName } = options;

  // Find selected routines maintaining order
  const selectedRoutines = routineIds
    .map((id) => allRoutines.find((routine) => routine.id === id))
    .filter((routine): routine is Routine => routine !== undefined);

  // Stack exercises from all routines
  let currentOrder = 0;
  const stackedExercises: WorkoutExercise[] = [];

  for (const routine of selectedRoutines) {
    for (const routineExercise of routine.exercises) {
      const workoutExercise = convertRoutineExerciseToWorkoutExercise(
        routineExercise,
        currentOrder,
        clearValues,
        routine.id,
      );
      stackedExercises.push(workoutExercise);
      currentOrder++;
    }
  }

  // Generate workout name if not provided
  const generateDefaultName = () => {
    if (selectedRoutines.length === 0) return "Custom Workout";
    if (selectedRoutines.length === 1) return selectedRoutines[0].title;

    // Join routine titles with " + "
    const combinedTitle = selectedRoutines.map((r) => r.title).join(" + ");

    // If combined title is too long (>60 chars), show first routine + count
    if (combinedTitle.length > 60) {
      const remainingCount = selectedRoutines.length - 1;
      return `${selectedRoutines[0].title} + ${remainingCount} more`;
    }

    return combinedTitle;
  };

  const defaultName = generateDefaultName();

  return {
    id: generateWorkoutId(),
    exercises: stackedExercises,
    startTime: Date.now(),
    name: workoutName || defaultName,
    isActive: true,
    startMethod: "routines" as const,
    sourceRoutineIds: routineIds,
  };
};

// Action atom for stacking routines
export const stackRoutinesAction = atom(
  null,
  (get, set, routineIds: string[], options?: { clearValues?: boolean }) => {
    const myRoutines = get(myRoutinesAtom);
    const publicRoutines = get(publicRoutinesAtom);
    const allRoutines = [...myRoutines, ...publicRoutines];

    return stackRoutinesIntoWorkout(routineIds, allRoutines, options);
  },
);

// Action to add exercises to routine draft
export const addExercisesToRoutineAction = atom(
  null,
  (
    get,
    set,
    exerciseIds: Id<"exercises">[],
    exerciseDetails: Record<string, any>,
  ) => {
    const currentDraft = get(routineEditorAtom);

    if (!currentDraft) {
      return;
    }

    const newExercises: RoutineExercise[] = exerciseIds.map(
      (exerciseId, index) => {
        const details = exerciseDetails[exerciseId];
        return {
          id: generateId(),
          exerciseId,
          exerciseDetails: details,
          sets: [
            // Start with one empty set
            {
              id: generateId(),
            },
          ],
          order: currentDraft.exercises.length + index,
        };
      },
    );

    const updatedDraft = {
      ...currentDraft,
      exercises: [...currentDraft.exercises, ...newExercises],
    };

    set(routineEditorAtom, updatedDraft);
  },
);
