import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { RoutineSelectionModal } from "@/components/RoutineSelectionModal";
import { RPEDrawer } from "@/components/RPEDrawer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WorkoutDuration } from "@/components/WorkoutDuration";
import { api } from "@/convex/_generated/api";
import {
  activeWorkoutAtom,
  addRoutinesToActiveWorkoutAction,
  addSetToExerciseAction,
  discardWorkoutAction,
  removeSetAction,
  updateExerciseNotesAction,
  updateSetAction,
  type WorkoutExercise,
  type WorkoutSet,
} from "@/store/activeWorkout";
import {
  getLastWorkoutSetsAtom,
  getSetsByExerciseAtom,
} from "@/store/exerciseLog";
import { type Routine } from "@/store/routines";
import { unitsConfigAtom } from "@/store/units";
import { getRequiredFields } from "@/utils/exerciseFieldHelpers";
import { calculatePRValue, checkIfPR } from "@/utils/prCalculator";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

// Component that renders individual exercise cards during workout
const WorkoutExerciseCard = ({ exercise }: { exercise: WorkoutExercise }) => {
  const [, updateNotes] = useAtom(updateExerciseNotesAction);
  const [, addSet] = useAtom(addSetToExerciseAction);
  const [, updateSet] = useAtom(updateSetAction);
  const [, removeSet] = useAtom(removeSetAction);
  const [getLastWorkoutSets] = useAtom(getLastWorkoutSetsAtom);
  const [getSetsByExercise] = useAtom(getSetsByExerciseAtom);
  const [unitsConfig] = useAtom(unitsConfigAtom);

  // Skip Convex query for template/fallback exercises from public routines
  const isTemplateExercise =
    exercise.exerciseId.startsWith("template:") ||
    exercise.exerciseId.startsWith("fallback:");
  const convexExerciseDetails = useQuery(
    api.exercises.getExerciseDetails,
    isTemplateExercise ? "skip" : { exerciseId: exercise.exerciseId },
  );

  // Use embedded exercise details for template exercises, otherwise use Convex data
  const exerciseDetails = isTemplateExercise
    ? exercise.exerciseDetails && {
        title: exercise.exerciseDetails.name,
        exerciseType: exercise.exerciseDetails.type,
        equipment: exercise.exerciseDetails.equipment || [],
        instructions: exercise.exerciseDetails.instructions,
        muscles: [], // Template exercises don't have muscle data
      }
    : convexExerciseDetails;

  const [drawerState, setDrawerState] = useState<{
    visible: boolean;
    setId: string | null;
    isEdit: boolean;
  }>({ visible: false, setId: null, isEdit: false });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  // Get previous workout data
  const previousSets = getLastWorkoutSets(exercise.exerciseId);

  const handleNotesChange = (text: string) => {
    updateNotes(exercise.exerciseId, text);
  };

  const handleRemoveExercise = () => {
    // Extract target muscle groups for smart filtering
    const targetMuscleGroups = exerciseDetails?.muscles
      ?.filter((m: any) => m.role === "target" && m.muscle)
      .map((m: any) => m.muscle.majorGroup)
      .filter(Boolean);

    router.push({
      pathname: "/(app)/(authenticated)/(modal)/workout/add-exercises",
      params: {
        removeExerciseId: exercise.exerciseId,
        filterMuscleGroups: targetMuscleGroups?.join(",") || "",
      },
    });
  };

  const handleAddSet = () => {
    addSet(exercise.exerciseId, {});
  };

  const handleRemoveSet = (setId: string) => {
    removeSet(exercise.exerciseId, setId);
  };

  const handleUpdateSet = (
    setId: string,
    updates: Partial<
      Pick<WorkoutSet, "weight" | "reps" | "duration" | "distance">
    >,
  ) => {
    // Clear validation errors for fields that are being updated
    if (validationErrors[setId]) {
      const updatedFields = Object.keys(updates);
      const remainingErrors = validationErrors[setId].filter(
        (field) => !updatedFields.includes(field),
      );

      if (remainingErrors.length !== validationErrors[setId].length) {
        const newValidationErrors = { ...validationErrors };
        if (remainingErrors.length === 0) {
          delete newValidationErrors[setId];
        } else {
          newValidationErrors[setId] = remainingErrors;
        }
        setValidationErrors(newValidationErrors);
      }
    }

    updateSet(exercise.exerciseId, setId, updates);
  };

  const openDrawer = (setId: string, isEdit: boolean) => {
    setDrawerState({ visible: true, setId, isEdit });
  };

  const closeDrawer = () => {
    setDrawerState({ visible: false, setId: null, isEdit: false });
  };

  const handleRPESelect = (rpe: number) => {
    if (!drawerState.setId) return;

    // Double-check validation before completing (safety check)
    const currentSet = exercise.sets.find((s) => s.id === drawerState.setId);
    if (!currentSet) return;

    const exerciseType = exerciseDetails?.exerciseType || "Weight Reps";
    const requiredFields = getRequiredFields(exerciseType as any);

    // Validate that all required fields have meaningful values (> 0)
    const hasValidValues =
      (!requiredFields.needsWeight ||
        (currentSet.weight && currentSet.weight > 0)) &&
      (!requiredFields.needsReps || (currentSet.reps && currentSet.reps > 0)) &&
      (!requiredFields.needsDuration ||
        (currentSet.duration && currentSet.duration > 0)) &&
      (!requiredFields.needsDistance ||
        (currentSet.distance && currentSet.distance > 0));

    if (!hasValidValues) {
      closeDrawer();
      return;
    }

    // Calculate PR information before completing the set
    const exerciseTypeForPR = exerciseDetails?.exerciseType || "Weight Reps";
    const historicalSets = !isTemplateExercise
      ? getSetsByExercise(exercise.exerciseId)
      : [];

    // Get all previously completed sets in the current workout for this exercise
    // Use sets completed before the current set (by index since timestamps aren't set yet)
    const currentSetIndex = exercise.sets.findIndex(
      (s) => s.id === drawerState.setId,
    );
    const currentWorkoutCompletedSets = exercise.sets
      .slice(0, currentSetIndex) // Only sets before current one
      .filter((s) => s.isCompleted && s.rpe !== undefined)
      .map((set) => ({
        ...set,
        exerciseId: exercise.exerciseId,
        workoutSessionId: "",
        date: "",
        rpe: set.rpe!,
      }));

    // Combine historical and current workout sets for PR calculation
    const allPreviousSets = [...historicalSets, ...currentWorkoutCompletedSets];

    // Create a temporary set object with the new RPE for PR calculation
    const setForPRCalculation = {
      ...currentSet,
      rpe,
      isCompleted: true,
    };

    const prValue = calculatePRValue(
      setForPRCalculation,
      exerciseTypeForPR as any,
    );
    const isPR = checkIfPR(
      setForPRCalculation,
      exerciseTypeForPR as any,
      allPreviousSets as LoggedSet[],
    );

    // Complete the set with PR information
    updateSet(exercise.exerciseId, drawerState.setId, {
      rpe,
      isCompleted: true,
      isPR,
      prValue,
    });

    closeDrawer();
  };

  const handleDirectUndo = (setId: string) => {
    const undoneSet = exercise.sets.find((s) => s.id === setId);
    if (!undoneSet || !undoneSet.isCompleted) return;

    // Clear completion and PR status for the undone set
    updateSet(exercise.exerciseId, setId, {
      isCompleted: false,
      rpe: undefined,
      isPR: undefined,
      prValue: undefined,
    });

    // Recalculate PRs for remaining completed sets in the current workout
    const exerciseTypeForRecalc =
      exerciseDetails?.exerciseType || "Weight Reps";
    const historicalSetsForRecalc = !isTemplateExercise
      ? getSetsByExercise(exercise.exerciseId)
      : [];

    // Get all currently completed sets in the workout (excluding the undone one)
    const remainingCompletedSets = exercise.sets.filter(
      (s) => s.id !== setId && s.isCompleted && s.rpe !== undefined,
    );

    // Recalculate PR status for each remaining completed set (in order)
    remainingCompletedSets.forEach((workoutSet, setIndex) => {
      // Get all sets that came before this one (historical + current workout sets before this index)
      const currentWorkoutSetsBefore = remainingCompletedSets
        .slice(0, setIndex) // Only sets before current one in the array
        .map((set) => ({
          ...set,
          exerciseId: exercise.exerciseId,
          workoutSessionId: "",
          date: "",
          rpe: set.rpe!,
        }));

      const allPreviousSets = [
        ...historicalSetsForRecalc,
        ...currentWorkoutSetsBefore,
      ];

      const prValue = calculatePRValue(
        workoutSet,
        exerciseTypeForRecalc as any,
      );
      const isPR = checkIfPR(
        workoutSet,
        exerciseTypeForRecalc as any,
        allPreviousSets as any,
      );

      // Update the set with recalculated PR status
      updateSet(exercise.exerciseId, workoutSet.id, {
        isPR,
        prValue,
      });
    });
  };

  const handleCompleteSet = (setId: string) => {
    const currentSet = exercise.sets.find((s) => s.id === setId);
    if (!currentSet) return;

    // Get exercise type from details
    const exerciseType = exerciseDetails?.exerciseType || "Weight Reps";
    const requiredFields = getRequiredFields(exerciseType as any);

    // Check what fields are empty or invalid (0 values)
    console.log(`[Complete] Set ${setId} current values:`, currentSet);
    const emptyFields: string[] = [];
    if (
      requiredFields.needsWeight &&
      (!currentSet.weight || currentSet.weight <= 0)
    )
      emptyFields.push("weight");
    if (requiredFields.needsReps && (!currentSet.reps || currentSet.reps <= 0))
      emptyFields.push("reps");
    if (
      requiredFields.needsDuration &&
      (!currentSet.duration || currentSet.duration <= 0)
    )
      emptyFields.push("duration");
    if (
      requiredFields.needsDistance &&
      (!currentSet.distance || currentSet.distance <= 0)
    )
      emptyFields.push("distance");

    console.log(`[Complete] Empty fields detected:`, emptyFields);

    // If there are empty fields, check if we can auto-fill them
    if (emptyFields.length > 0) {
      let autoFillValues: Partial<WorkoutSet> = {};

      // First, try to get values from the most recent completed set in this exercise
      const completedSets = exercise.sets.filter(
        (s) => s.isCompleted && s.id !== setId,
      );
      const lastCompletedSet = completedSets[completedSets.length - 1];

      if (lastCompletedSet) {
        // Auto-fill from last completed set (only meaningful values > 0)
        if (
          emptyFields.includes("weight") &&
          lastCompletedSet.weight &&
          lastCompletedSet.weight > 0
        ) {
          autoFillValues.weight = lastCompletedSet.weight;
        }
        if (
          emptyFields.includes("reps") &&
          lastCompletedSet.reps &&
          lastCompletedSet.reps > 0
        ) {
          autoFillValues.reps = lastCompletedSet.reps;
        }
        if (
          emptyFields.includes("duration") &&
          lastCompletedSet.duration &&
          lastCompletedSet.duration > 0
        ) {
          autoFillValues.duration = lastCompletedSet.duration;
        }
        if (
          emptyFields.includes("distance") &&
          lastCompletedSet.distance &&
          lastCompletedSet.distance > 0
        ) {
          autoFillValues.distance = lastCompletedSet.distance;
        }
      } else if (previousSets.length > 0) {
        // No completed sets in current workout, try previous workout data
        const currentSetIndex = exercise.sets.findIndex((s) => s.id === setId);
        const previousData = previousSets[currentSetIndex] || previousSets[0];

        if (previousData) {
          if (
            emptyFields.includes("weight") &&
            previousData.weight &&
            previousData.weight > 0
          ) {
            autoFillValues.weight = previousData.weight;
          }
          if (
            emptyFields.includes("reps") &&
            previousData.reps &&
            previousData.reps > 0
          ) {
            autoFillValues.reps = previousData.reps;
          }
          if (
            emptyFields.includes("duration") &&
            previousData.duration &&
            previousData.duration > 0
          ) {
            autoFillValues.duration = previousData.duration;
          }
          if (
            emptyFields.includes("distance") &&
            previousData.distance &&
            previousData.distance > 0
          ) {
            autoFillValues.distance = previousData.distance;
          }
        }
      }

      // Check if we have auto-fill values for all empty required fields
      const remainingEmptyFields = emptyFields.filter((field) => {
        return !(field in autoFillValues);
      });

      // For remaining empty fields, try to get values from smart placeholders
      if (remainingEmptyFields.length > 0) {
        // Get smart default values from current exercise sets (most recent set with values)
        const getSmartDefault = (field: string): number | undefined => {
          // Look for the most recent set before current set that has a value for this field
          const currentSetIndex = exercise.sets.findIndex(
            (s) => s.id === setId,
          );
          for (let i = currentSetIndex - 1; i >= 0; i--) {
            const prevSet = exercise.sets[i] as any;
            if (
              prevSet?.[field] !== undefined &&
              prevSet?.[field] !== null &&
              prevSet?.[field] > 0
            ) {
              return prevSet[field];
            }
          }
          return undefined;
        };

        remainingEmptyFields.forEach((field) => {
          const smartDefault = getSmartDefault(field);
          if (smartDefault !== undefined && smartDefault > 0) {
            (autoFillValues as any)[field] = smartDefault;
          }
        });

        // Check again which fields still have no values after smart defaults
        const finalEmptyFields = remainingEmptyFields.filter((field) => {
          return !(field in autoFillValues);
        });

        // Only show validation errors for fields that truly have no meaningful defaults
        if (finalEmptyFields.length > 0) {
          setValidationErrors({
            ...validationErrors,
            [setId]: finalEmptyFields,
          });
          return; // Don't open drawer, just show validation errors
        }
      }

      // If we have auto-fill values for all empty fields, apply them now
      if (Object.keys(autoFillValues).length > 0) {
        console.log(
          `[AutoFill] Applying auto-fill values for set ${setId}:`,
          autoFillValues,
        );
        updateSet(exercise.exerciseId, setId, autoFillValues);
      }
    }

    // Clear any existing validation errors for this set
    if (validationErrors[setId]) {
      const newValidationErrors = { ...validationErrors };
      delete newValidationErrors[setId];
      setValidationErrors(newValidationErrors);
    }

    // Open the RPE drawer
    openDrawer(setId, false);
  };

  // Transform exercise data for the ExerciseCard
  const exerciseForCard = {
    ...exercise,
    exerciseDetails: exerciseDetails
      ? {
          title: exerciseDetails.title,
          exerciseType: exerciseDetails.exerciseType,
          equipment: exerciseDetails.equipment,
        }
      : undefined,
  };

  return (
    <>
      <ExerciseCard
        mode="workout"
        exercise={exerciseForCard}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
        onUpdateSet={handleUpdateSet}
        onUpdateNotes={handleNotesChange}
        onRemoveExercise={handleRemoveExercise}
        previousSets={previousSets}
        unitsConfig={unitsConfig}
        onCompleteSet={handleCompleteSet}
        onUndoComplete={handleDirectUndo}
        isTemplateExercise={isTemplateExercise}
        validationErrors={validationErrors}
      />

      {/* RPE Drawer */}
      <RPEDrawer
        visible={drawerState.visible}
        onClose={closeDrawer}
        onSelect={handleRPESelect}
        currentRPE={
          drawerState.setId
            ? exercise.sets.find((s) => s.id === drawerState.setId)?.rpe
            : undefined
        }
        setNumber={
          drawerState.setId
            ? exercise.sets.findIndex((s) => s.id === drawerState.setId) + 1
            : 1
        }
        isEdit={drawerState.isEdit}
      />
    </>
  );
};

const Page = () => {
  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [, discardWorkout] = useAtom(discardWorkoutAction);
  const [, addRoutinesToWorkout] = useAtom(addRoutinesToActiveWorkoutAction);

  // State for routine selection modal
  const [isRoutineModalVisible, setIsRoutineModalVisible] = useState(false);

  const handleFinishWorkout = async () => {
    if (activeWorkout.exercises.length === 0) {
      Alert.alert(
        "Empty Workout",
        "Add some exercises before finishing your workout.",
      );
      return;
    }

    router.push("/(app)/(authenticated)/(modal)/workout/save-workout");
  };

  const handleDiscardWorkout = () => {
    Alert.alert(
      "Discard Workout",
      "Are you sure you want to discard this workout? All progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            discardWorkout();
            router.back();
          },
        },
      ],
    );
  };

  const handleAddExercises = () => {
    router.push("/(app)/(authenticated)/(modal)/workout/add-exercises");
  };

  const handleAddRoutine = () => {
    setIsRoutineModalVisible(true);
  };

  const handleRoutineSelect = (selectedRoutines: Routine[]) => {
    addRoutinesToWorkout(
      selectedRoutines.map((r) => r.id),
      selectedRoutines,
    );
    setIsRoutineModalVisible(false);
  };

  // Calculate workout progress
  const totalSets = activeWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const completedSets = activeWorkout.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.isCompleted).length,
    0,
  );
  const progressPercentage =
    totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Active Workout",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleFinishWorkout}
              className="bg-[#6F2DBD] px-3 py-1.5 rounded-lg"
            >
              <Text className="text-white font-Poppins_500Medium text-sm">
                Finish
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 bg-dark">
        <ScrollView
          className="flex-1"
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
        >
          {/* Workout Stats Header */}
          <View className="px-4 py-3">
            <View className="flex-row items-center space-x-4">
              <View className="flex-1 items-center">
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  Duration
                </Text>
                <WorkoutDuration />
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  Sets
                </Text>
                <Text className="text-white text-sm font-Poppins_500Medium">
                  {completedSets}/{totalSets}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  Progress
                </Text>
                <Text className="text-white text-sm font-Poppins_500Medium">
                  {Math.round(progressPercentage)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <ProgressBar
            value={progressPercentage}
            className="h-0.5 bg-zinc-800"
          />

          {/* Exercise List */}
          <View className="px-4 pt-4">
            {activeWorkout.exercises.map((exercise) => (
              <WorkoutExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </View>

          {/* Add Exercise / Discard Workout Buttons */}
          <View className="px-4 mt-4">
            <TouchableOpacity
              onPress={handleAddExercises}
              className="bg-[#1c1c1e] rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-Poppins_500Medium ml-2">
                Add Exercise
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddRoutine}
              className="bg-[#1c1c1e] rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <Ionicons name="list" size={20} color="white" />
              <Text className="text-white font-Poppins_500Medium ml-2">
                Add Routine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDiscardWorkout}
              className="bg-[#1c1c1e] rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <Ionicons name="trash" size={18} color="#ef4444" />
              <Text className="text-red-500 font-Poppins_500Medium ml-2">
                Discard Workout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Routine Selection Modal */}
        <RoutineSelectionModal
          visible={isRoutineModalVisible}
          onClose={() => setIsRoutineModalVisible(false)}
          onSelect={handleRoutineSelect}
          mode="add-to-workout"
        />
      </View>
    </>
  );
};

export default Page;
