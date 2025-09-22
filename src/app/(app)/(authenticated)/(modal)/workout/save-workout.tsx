import { WorkoutStatsCard } from "@/components/WorkoutStatsCard";
import { api } from "@/convex/_generated/api";
import {
  activeWorkoutAtom,
  discardWorkoutAction,
  finishWorkoutAction,
} from "@/store/activeWorkout";
import { myRoutinesAtom, publicRoutinesAtom } from "@/store/routines";
import { updateMuscleProgressFromWorkoutAction } from "@/store/weeklyProgress";
import {
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { useConvex } from "convex/react";
import { router, Stack } from "expo-router";
import { useAtom } from "jotai";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SaveWorkoutPage = () => {
  const convex = useConvex();
  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [, finishWorkout] = useAtom(finishWorkoutAction);
  const [, discardWorkout] = useAtom(discardWorkoutAction);
  const [myRoutines] = useAtom(myRoutinesAtom);
  const [publicRoutines] = useAtom(publicRoutinesAtom);
  const [, updateMuscleProgress] = useAtom(
    updateMuscleProgressFromWorkoutAction,
  );

  // Form state
  const [workoutTitle, setWorkoutTitle] = useState(activeWorkout.name || "");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutDate] = useState(new Date(activeWorkout.startTime));
  const [workoutDuration] = useState(Date.now() - activeWorkout.startTime);

  // Initialize notes with routine names if workout came from routines
  React.useEffect(() => {
    if (
      activeWorkout.startMethod === "routines" &&
      activeWorkout.sourceRoutineIds
    ) {
      const allRoutines = [...myRoutines, ...publicRoutines];
      const usedRoutines = activeWorkout.sourceRoutineIds
        .map((id) => allRoutines.find((r) => r.id === id))
        .filter(
          (routine): routine is NonNullable<typeof routine> =>
            routine !== undefined,
        );

      if (usedRoutines.length > 0) {
        const routineNames = usedRoutines.map((r) => r.title).join(", ");
        setWorkoutNotes(`Based on routines: ${routineNames}`);
      }
    }
  }, [activeWorkout, myRoutines, publicRoutines]);

  // Generate smart placeholder for title
  const getPlaceholder = () => {
    if (activeWorkout.startMethod === "quick-start") {
      return "Quick Start Workout";
    }
    if (activeWorkout.startMethod === "routines") {
      return "Routine Workout";
    }

    // Time-based naming
    const hour = workoutDate.getHours();
    if (hour < 12) return "Morning Workout";
    if (hour < 17) return "Afternoon Workout";
    return "Evening Workout";
  };

  const placeholder = getPlaceholder();

  const handleSave = async () => {
    try {
      // Pass the workout details to finishWorkout
      const { workoutSession, loggedSets } = await finishWorkout({
        name: workoutTitle.trim() || placeholder,
        notes: workoutNotes,
        duration: workoutDuration,
        startTime: workoutDate.getTime(),
      });

      // Calculate XP from the logged sets
      try {
        // Fetch exercise details for all unique exercises in the workout
        const uniqueExerciseIds = [
          ...new Set(loggedSets.map((set) => set.exerciseId)),
        ];
        const exerciseDetailsMap: Record<string, any> = {};

        for (const exerciseId of uniqueExerciseIds) {
          // Skip fallback/template exercises as they're not in the Convex database
          if (
            exerciseId.startsWith("template:") ||
            exerciseId.startsWith("fallback:")
          ) {
            continue;
          }

          try {
            const exerciseDetail = await convex.query(
              api.exercises.getExerciseDetails,
              {
                exerciseId,
              },
            );
            if (exerciseDetail) {
              exerciseDetailsMap[exerciseId] = exerciseDetail;
            }
          } catch (error) {
            console.warn(
              `Failed to fetch exercise details for ${exerciseId}:`,
              error,
            );
          }
        }

        // Calculate XP distributions and update muscle progress
        const xpCalculations: any[] = [];

        // Group sets by exercise
        const setsByExercise = loggedSets.reduce(
          (acc, loggedSet) => {
            if (!acc[loggedSet.exerciseId]) {
              acc[loggedSet.exerciseId] = [];
            }
            acc[loggedSet.exerciseId].push(loggedSet);
            return acc;
          },
          {} as Record<string, typeof loggedSets>,
        );

        // Calculate XP for each exercise and its sets
        Object.entries(setsByExercise).forEach(([exerciseId, sets]) => {
          const exerciseDetail = exerciseDetailsMap[exerciseId];
          if (!exerciseDetail?.muscles) return;

          const muscleInvolvements = extractMuscleInvolvement(
            exerciseDetail.muscles,
          );

          sets.forEach((set) => {
            const xpResult = calculateXPDistribution(
              muscleInvolvements,
              set.rpe,
            );
            xpCalculations.push(xpResult);
          });
        });

        // Update muscle progress if we have XP calculations
        if (xpCalculations.length > 0) {
          updateMuscleProgress(xpCalculations);
        }
      } catch (xpError) {
        console.warn("Failed to calculate XP for workout:", xpError);
        // Don't block the workout save if XP calculation fails
      }

      // Clear the entire modal stack and navigate to workout details
      router.dismissAll();
      router.push(
        `/(app)/(authenticated)/(modal)/workout/${workoutSession.id}`,
      );
    } catch {
      Alert.alert("Error", "Failed to save workout");
    }
  };

  const handleDiscard = () => {
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

  const handleBack = () => {
    router.back();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!activeWorkout.isActive) {
    return (
      <View className="flex-1 bg-dark justify-center items-center">
        <Text className="text-white text-lg">No active workout</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-[#6F2DBD] px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-Poppins_500Medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedSets = activeWorkout.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.filter((set) => set.isCompleted).length,
    0,
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Save Workout",
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              className="bg-[#6F2DBD] px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-Poppins_600SemiBold">Save</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-dark">
        <View className="px-4 py-6">
          {/* Workout Title */}
          <View className="mb-6">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
              Title
            </Text>
            <TextInput
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
              placeholder={placeholder}
              placeholderTextColor="#6B7280"
              className="bg-neutral-800 text-white p-4 rounded-xl font-Poppins_400Regular text-lg"
              maxLength={100}
            />
          </View>

          {/* Workout Stats */}
          <View className="mb-6">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
              Workout Summary
            </Text>
            <WorkoutStatsCard
              startTime={workoutDate.getTime()}
              duration={workoutDuration}
              totalSets={completedSets}
            />
          </View>

          {/* When */}
          <View className="mb-6">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
              When
            </Text>
            <View className="bg-neutral-800 rounded-xl p-4">
              <Text className="text-white font-Poppins_500Medium mb-1">
                {formatDate(workoutDate)}
              </Text>
              <Text className="text-gray-400 font-Poppins_400Regular">
                Started at {formatTime(workoutDate)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View className="mb-8">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
              Notes
            </Text>
            <TextInput
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              placeholder="Add notes about your workout..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-neutral-800 text-white p-4 rounded-xl font-Poppins_400Regular"
              maxLength={500}
            />
          </View>

          {/* Discard Button */}
          <TouchableOpacity
            onPress={handleDiscard}
            className="bg-red-600 rounded-xl p-4 items-center"
          >
            <Text className="text-white font-Poppins_600SemiBold text-lg">
              Discard Workout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

export default SaveWorkoutPage;
