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
import { getLastWorkoutSetsAtom } from "@/store/exerciseLog";
import { type Routine } from "@/store/routines";
import { unitsConfigAtom } from "@/store/units";
import { getRequiredFields } from "@/utils/exerciseFieldHelpers";
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

    const currentSet = exercise.sets.find((s) => s.id === drawerState.setId);
    if (!currentSet) return;

    // Get exercise type from details
    const exerciseType = exerciseDetails?.exerciseType || "Weight Reps";
    const requiredFields = getRequiredFields(exerciseType as any);

    // Check what fields are empty
    const emptyFields: string[] = [];
    if (requiredFields.needsWeight && !currentSet.weight)
      emptyFields.push("weight");
    if (requiredFields.needsReps && !currentSet.reps) emptyFields.push("reps");
    if (requiredFields.needsDuration && !currentSet.duration)
      emptyFields.push("duration");
    if (requiredFields.needsDistance && !currentSet.distance)
      emptyFields.push("distance");

    // If there are empty fields, try to auto-fill them
    let autoFillValues: Partial<WorkoutSet> = {};

    if (emptyFields.length > 0) {
      // First, try to get values from the most recent completed set in this exercise
      const completedSets = exercise.sets.filter(
        (s) => s.isCompleted && s.id !== drawerState.setId,
      );
      const lastCompletedSet = completedSets[completedSets.length - 1];

      if (lastCompletedSet) {
        // Auto-fill from last completed set
        if (emptyFields.includes("weight") && lastCompletedSet.weight) {
          autoFillValues.weight = lastCompletedSet.weight;
        }
        if (emptyFields.includes("reps") && lastCompletedSet.reps) {
          autoFillValues.reps = lastCompletedSet.reps;
        }
        if (emptyFields.includes("duration") && lastCompletedSet.duration) {
          autoFillValues.duration = lastCompletedSet.duration;
        }
        if (emptyFields.includes("distance") && lastCompletedSet.distance) {
          autoFillValues.distance = lastCompletedSet.distance;
        }
      } else if (previousSets.length > 0) {
        // No completed sets in current workout, try previous workout data
        const currentSetIndex = exercise.sets.findIndex(
          (s) => s.id === drawerState.setId,
        );
        const previousData = previousSets[currentSetIndex] || previousSets[0];

        if (previousData) {
          if (emptyFields.includes("weight") && previousData.weight) {
            autoFillValues.weight = previousData.weight;
          }
          if (emptyFields.includes("reps") && previousData.reps) {
            autoFillValues.reps = previousData.reps;
          }
          if (emptyFields.includes("duration") && previousData.duration) {
            autoFillValues.duration = previousData.duration;
          }
          if (emptyFields.includes("distance") && previousData.distance) {
            autoFillValues.distance = previousData.distance;
          }
        }
      }
    }

    // Update the set with auto-filled values and completion status
    updateSet(exercise.exerciseId, drawerState.setId, {
      ...autoFillValues,
      rpe,
      isCompleted: true,
    });

    closeDrawer();
  };

  const handleDirectUndo = (setId: string) => {
    updateSet(exercise.exerciseId, setId, {
      isCompleted: false,
      rpe: undefined,
    });
  };

  const handleCompleteSet = (setId: string) => {
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
