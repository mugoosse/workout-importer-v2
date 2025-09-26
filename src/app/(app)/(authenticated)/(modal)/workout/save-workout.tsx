import { WorkoutSummary } from "@/components/WorkoutSummary";
import { api } from "@/convex/_generated/api";
import {
  activeWorkoutAtom,
  discardWorkoutAction,
  finishWorkoutAction,
} from "@/store/activeWorkout";
import {
  getSetsByExerciseAtom,
  type WorkoutProgressSnapshot,
  workoutSessionsAtom,
} from "@/store/exerciseLog";
import { myRoutinesAtom, publicRoutinesAtom } from "@/store/routines";
import {
  majorGroupProgressAtom,
  svgIdProgressAtom,
  updateMuscleProgressFromWorkoutAction,
} from "@/store/weeklyProgress";
import {
  calculateWorkoutPRs,
  extractExerciseDetailsForPR,
} from "@/utils/workoutPRCalculator";
import {
  calculateMajorGroupProgress,
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { useConvex } from "convex/react";
import { router, Stack } from "expo-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
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
  const [svgIdProgress] = useAtom(svgIdProgressAtom);
  const [majorGroupProgress] = useAtom(majorGroupProgressAtom);
  const [getSetsByExercise] = useAtom(getSetsByExerciseAtom);
  const workoutSessions = useAtomValue(workoutSessionsAtom);
  const setWorkoutSessions = useSetAtom(workoutSessionsAtom);

  // Form state
  const [workoutTitle, setWorkoutTitle] = useState(activeWorkout.name || "");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutDate] = useState(new Date(activeWorkout.startTime));
  const [workoutDuration] = useState(Date.now() - activeWorkout.startTime);
  const [prCount, setPrCount] = useState<number>(0);

  // No debouncing needed for title and notes - they're simple text inputs

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
        const initialNotes = `Based on routines: ${routineNames}`;
        setWorkoutNotes(initialNotes);
      }
    }
  }, [activeWorkout, myRoutines, publicRoutines]);

  // Calculate PR count for the active workout
  React.useEffect(() => {
    const calculatePRs = async () => {
      try {
        // Convert active workout sets to LoggedSet format for PR calculation
        const loggedSets = activeWorkout.exercises.flatMap((exercise) =>
          exercise.sets
            .filter((set) => set.isCompleted && set.rpe !== undefined)
            .map((set) => ({
              id: set.id,
              exerciseId: exercise.exerciseId,
              reps: set.reps,
              weight: set.weight,
              duration: set.duration,
              distance: set.distance,
              rpe: set.rpe!,
              timestamp: set.timestamp,
              date: new Date(activeWorkout.startTime)
                .toISOString()
                .split("T")[0],
              isPR: set.isPR,
              prValue: set.prValue,
            })),
        );

        if (loggedSets.length === 0) {
          setPrCount(0);
          return;
        }

        // Fetch exercise details for PR calculation
        const uniqueExerciseIds = [
          ...new Set(loggedSets.map((set) => set.exerciseId)),
        ];
        const exerciseDetailsMap: Record<string, any> = {};

        for (const exerciseId of uniqueExerciseIds) {
          if (
            exerciseId.startsWith("template:") ||
            exerciseId.startsWith("fallback:")
          ) {
            continue;
          }

          try {
            const exerciseDetail = await convex.query(
              api.exercises.getExerciseDetails,
              { exerciseId },
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

        // Calculate PRs
        const exerciseDetailsForPR = extractExerciseDetailsForPR(
          loggedSets,
          exerciseDetailsMap,
        );
        const workoutPRCount = calculateWorkoutPRs(
          loggedSets,
          exerciseDetailsForPR,
          getSetsByExercise,
        );
        setPrCount(workoutPRCount);
      } catch (error) {
        console.warn("Failed to calculate PRs:", error);
        setPrCount(0);
      }
    };

    calculatePRs();
  }, [activeWorkout, convex, getSetsByExercise]);

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
      const { workoutSession, loggedSets } = finishWorkout({
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
              set.isPR,
            );
            xpCalculations.push(xpResult);
          });
        });

        // Calculate total XP for the workout from all sets
        const totalWorkoutXP = xpCalculations.reduce(
          (total, xpResult) => total + xpResult.totalXP,
          0,
        );

        // Capture progress snapshots if we have XP calculations
        let progressSnapshots:
          | { before: WorkoutProgressSnapshot; after: WorkoutProgressSnapshot }
          | undefined;

        if (xpCalculations.length > 0) {
          // Capture "before" snapshot
          const beforeSnapshot: WorkoutProgressSnapshot = {
            individualMuscleProgress: Object.fromEntries(
              Object.entries(svgIdProgress).map(([muscleId, progress]) => [
                muscleId,
                { xp: progress.xp, percentage: progress.percentage },
              ]),
            ),
            weeklyProgress: majorGroupProgress.map((group) => ({
              majorGroup: group.majorGroup,
              xp: group.xp,
              percentage: group.percentage,
            })),
          };

          // Update muscle progress
          updateMuscleProgress(xpCalculations);

          // We need to manually calculate the "after" state since we can't get it from the action
          // Calculate what the new individual progress would be
          const updatedIndividualProgress = { ...svgIdProgress };

          // Aggregate all XP distributions
          const totalXPByMuscle: Record<string, number> = {};
          const setsCountByMuscle: Record<string, number> = {};

          xpCalculations.forEach((xpResult) => {
            xpResult.muscleXPDistribution.forEach((muscle: any) => {
              totalXPByMuscle[muscle.muscleId] =
                (totalXPByMuscle[muscle.muscleId] || 0) + muscle.xpAwarded;
              setsCountByMuscle[muscle.muscleId] =
                (setsCountByMuscle[muscle.muscleId] || 0) + 1;
            });
          });

          // Update individual muscle progress
          Object.entries(totalXPByMuscle).forEach(([muscleId, totalXP]) => {
            const currentMuscleProgress = updatedIndividualProgress[muscleId];
            if (currentMuscleProgress) {
              const newXP = currentMuscleProgress.xp + totalXP;
              const newPercentage =
                currentMuscleProgress.goal > 0
                  ? Math.round((newXP / currentMuscleProgress.goal) * 100)
                  : 0;

              updatedIndividualProgress[muscleId] = {
                ...currentMuscleProgress,
                xp: newXP,
                percentage: newPercentage,
              };
            }
          });

          // Calculate updated weekly progress
          const updatedWeeklyProgress = calculateMajorGroupProgress(
            updatedIndividualProgress,
          );

          // Capture "after" snapshot
          const afterSnapshot: WorkoutProgressSnapshot = {
            individualMuscleProgress: Object.fromEntries(
              Object.entries(updatedIndividualProgress).map(
                ([muscleId, progress]) => [
                  muscleId,
                  { xp: progress.xp, percentage: progress.percentage },
                ],
              ),
            ),
            weeklyProgress: updatedWeeklyProgress.map((group) => ({
              majorGroup: group.majorGroup,
              xp: group.xp,
              percentage: group.percentage,
            })),
          };

          progressSnapshots = {
            before: beforeSnapshot,
            after: afterSnapshot,
          };
        }

        // Update the workout session with progress snapshots and total XP, then navigate
        if (progressSnapshots) {
          // Get fresh workoutSessions from atom and find the existing session
          const existingIndex = workoutSessions.findIndex(
            (s) => s.id === workoutSession.id,
          );

          if (existingIndex >= 0) {
            // Update existing session
            const updatedSessions = [...workoutSessions];
            updatedSessions[existingIndex] = {
              ...workoutSession,
              totalXP: totalWorkoutXP,
              progressSnapshot: progressSnapshots,
            };
            setWorkoutSessions(updatedSessions);
          } else {
            // Session not found, add it with snapshots (fallback case)
            setWorkoutSessions([
              ...workoutSessions,
              {
                ...workoutSession,
                totalXP: totalWorkoutXP,
                progressSnapshot: progressSnapshots,
              },
            ]);
          }

          // Use requestAnimationFrame to ensure React state update is processed
          requestAnimationFrame(() => {
            router.dismissAll();
            router.push(
              `/(app)/(authenticated)/(modal)/workout/${workoutSession.id}`,
            );
          });
        } else {
          // No snapshots, but still update totalXP if we calculated it
          if (xpCalculations.length > 0) {
            // Update the workout session with the calculated total XP
            const existingIndex = workoutSessions.findIndex(
              (s) => s.id === workoutSession.id,
            );

            if (existingIndex >= 0) {
              const updatedSessions = [...workoutSessions];
              updatedSessions[existingIndex] = {
                ...workoutSession,
                totalXP: totalWorkoutXP,
              };
              setWorkoutSessions(updatedSessions);
            }
          }

          // Navigate immediately
          router.dismissAll();
          router.push(
            `/(app)/(authenticated)/(modal)/workout/${workoutSession.id}`,
          );
        }
      } catch (xpError) {
        console.warn("Failed to calculate XP for workout:", xpError);
        // Don't block the workout save if XP calculation fails
        router.dismissAll();
        router.push(
          `/(app)/(authenticated)/(modal)/workout/${workoutSession.id}`,
        );
      }
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
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              className="bg-[#6F2DBD] px-3 py-1.5 rounded-lg"
            >
              <Text className="text-white font-Poppins_500Medium text-sm">
                Save
              </Text>
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
              Summary
            </Text>
            <WorkoutSummary
              startTime={workoutDate.getTime()}
              duration={workoutDuration}
              totalSets={completedSets}
              totalPRs={prCount}
              showDateHeader={false}
              variant="card"
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
