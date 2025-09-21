import { Badge } from "@/components/ui/Badge";
import { SwipeableSetRow } from "@/components/SwipeableSetRow";
import { api } from "@/convex/_generated/api";
import {
  activeWorkoutAtom,
  addSetToExerciseAction,
  discardWorkoutAction,
  finishWorkoutAction,
  removeExerciseFromWorkoutAction,
  removeSetAction,
  tickTimerAction,
  updateExerciseNotesAction,
  updateSetAction,
  workoutDurationAtom,
  workoutSetsCountAtom,
  type WorkoutExercise,
  type WorkoutSet,
} from "@/store/activeWorkout";
import {
  logSetAction,
  type ExerciseType,
  getLastWorkoutSetsAtom,
  type LoggedSet,
} from "@/store/exerciseLog";
import { unitsConfigAtom } from "@/store/units";
import {
  individualMuscleProgressAtom,
  weeklyProgressAtom,
} from "@/store/weeklyProgress";
import {
  formatPreviousSet,
  getPreviousValuePlaceholder,
} from "@/utils/previousWorkoutFormatter";
import { convertWeight } from "@/utils/unitConversions";
import {
  processSetLogging,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useConvex } from "convex/react";
import { Link, router, Stack } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}min ${seconds}s`;
};

const WorkoutExerciseCard = ({ exercise }: { exercise: WorkoutExercise }) => {
  const [, updateNotes] = useAtom(updateExerciseNotesAction);
  const [, removeExercise] = useAtom(removeExerciseFromWorkoutAction);
  const [, addSet] = useAtom(addSetToExerciseAction);
  const [, updateSet] = useAtom(updateSetAction);
  const [, removeSet] = useAtom(removeSetAction);
  const [getLastWorkoutSets] = useAtom(getLastWorkoutSetsAtom);
  const [unitsConfig] = useAtom(unitsConfigAtom);

  const exerciseDetails = useQuery(api.exercises.getExerciseDetails, {
    exerciseId: exercise.exerciseId,
  });

  const [localNotes, setLocalNotes] = useState(exercise.notes || "");

  // Get previous workout data
  const previousSets = getLastWorkoutSets(exercise.exerciseId);

  const handleNotesChange = (text: string) => {
    setLocalNotes(text);
    updateNotes(exercise.exerciseId, text);
  };

  const handleRemoveExercise = () => {
    Alert.alert(
      "Remove Exercise",
      `Remove ${exerciseDetails?.title || "this exercise"} from workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeExercise(exercise.exerciseId),
        },
      ],
    );
  };

  const handleAddSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    addSet(exercise.exerciseId, {
      reps: lastSet?.reps,
      weight: lastSet?.weight,
      duration: lastSet?.duration,
      distance: lastSet?.distance,
      rpe: lastSet?.rpe || 8,
      isCompleted: false,
    });
  };

  const handleUpdateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    updateSet(exercise.exerciseId, setId, updates);
  };

  const handleRemoveSet = (setId: string) => {
    if (exercise.sets.length > 1) {
      removeSet(exercise.exerciseId, setId);
    }
  };

  const quickFillSet = (setId: string, previousData: LoggedSet) => {
    const currentSet = exercise.sets.find((s) => s.id === setId);
    if (!currentSet) return;

    const weightInDisplayUnit =
      unitsConfig.weight === "lbs" && previousData.weight
        ? convertWeight(previousData.weight, "kg", "lbs")
        : previousData.weight;

    const distanceInDisplayUnit =
      unitsConfig.distance === "mi" && previousData.distance
        ? previousData.distance / 1000 / 1.609344 // Convert meters to miles
        : previousData.distance;

    // Only fill fields that are empty/undefined, preserve user-entered values
    const updates: Partial<WorkoutSet> = {
      isCompleted: true,
    };

    // For numeric fields, check if they have meaningful values (not null, undefined, or 0)
    const hasUserReps =
      currentSet.reps !== undefined &&
      currentSet.reps !== null &&
      currentSet.reps > 0;
    const hasUserWeight =
      currentSet.weight !== undefined &&
      currentSet.weight !== null &&
      currentSet.weight > 0;
    const hasUserDuration =
      currentSet.duration !== undefined &&
      currentSet.duration !== null &&
      currentSet.duration > 0;
    const hasUserDistance =
      currentSet.distance !== undefined &&
      currentSet.distance !== null &&
      currentSet.distance > 0;
    const hasUserRpe =
      currentSet.rpe !== undefined &&
      currentSet.rpe !== null &&
      currentSet.rpe !== 5; // 5 is default

    if (!hasUserReps && previousData.reps !== undefined) {
      updates.reps = previousData.reps;
    }
    if (!hasUserWeight && weightInDisplayUnit !== undefined) {
      updates.weight = weightInDisplayUnit;
    }
    if (!hasUserDuration && previousData.duration !== undefined) {
      updates.duration = previousData.duration;
    }
    if (!hasUserDistance && distanceInDisplayUnit !== undefined) {
      updates.distance = distanceInDisplayUnit;
    }
    if (!hasUserRpe && previousData.rpe !== undefined) {
      updates.rpe = previousData.rpe;
    }

    handleUpdateSet(setId, updates);
  };

  // Helper functions for unit display
  const getWeightLabel = () => unitsConfig.weight.toUpperCase();
  const getDistanceLabel = () => {
    return requiredFields.needsDistance
      ? unitsConfig.distance === "km"
        ? "KM"
        : "MI"
      : unitsConfig.distance === "km"
        ? "METERS"
        : "YARDS";
  };

  const cleanExerciseTitle = (title: string) => {
    return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  };

  // Helper to determine which fields to show based on exercise type
  const getRequiredFields = (exerciseType: ExerciseType) => {
    switch (exerciseType) {
      case "Weight Reps":
        return {
          needsReps: true,
          needsWeight: true,
          needsDuration: false,
          needsDistance: false,
        };
      case "Reps Only":
        return {
          needsReps: true,
          needsWeight: false,
          needsDuration: false,
          needsDistance: false,
        };
      case "Weighted Bodyweight":
      case "Assisted Bodyweight":
        return {
          needsReps: true,
          needsWeight: true,
          needsDuration: false,
          needsDistance: false,
        };
      case "Duration":
        return {
          needsReps: false,
          needsWeight: false,
          needsDuration: true,
          needsDistance: false,
        };
      case "Weight & Duration":
        return {
          needsReps: false,
          needsWeight: true,
          needsDuration: true,
          needsDistance: false,
        };
      case "Distance & Duration":
        return {
          needsReps: false,
          needsWeight: false,
          needsDuration: true,
          needsDistance: true,
        };
      case "Weight & Distance":
        return {
          needsReps: false,
          needsWeight: true,
          needsDuration: false,
          needsDistance: true,
        };
      default:
        return {
          needsReps: true,
          needsWeight: false,
          needsDuration: false,
          needsDistance: false,
        };
    }
  };

  if (!exerciseDetails) {
    return (
      <View className="bg-neutral-800 rounded-2xl p-4 mb-4">
        <Text className="text-white">Loading exercise...</Text>
      </View>
    );
  }

  const requiredFields = getRequiredFields(
    exerciseDetails.exerciseType as ExerciseType,
  );

  return (
    <View className="bg-neutral-800 rounded-2xl p-4 mb-4">
      {/* Exercise Header */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          className="flex-1"
          onPress={() =>
            router.push(
              `/(app)/(authenticated)/(modal)/exercise/${exercise.exerciseId}`,
            )
          }
        >
          <Text className="text-white text-lg font-Poppins_600SemiBold">
            {cleanExerciseTitle(exerciseDetails.title)}
          </Text>
          {exerciseDetails.equipment &&
            exerciseDetails.equipment.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-1">
                {exerciseDetails.equipment.map((eq, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {typeof eq === "string" ? eq : eq?.name || "Equipment"}
                  </Badge>
                ))}
              </View>
            )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRemoveExercise}
          className="p-2 ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <TextInput
        value={localNotes}
        onChangeText={handleNotesChange}
        placeholder="Add notes here..."
        placeholderTextColor="#9CA3AF"
        className="bg-neutral-700 rounded-xl p-3 text-white font-Poppins_400Regular mb-3"
        multiline
      />

      {/* Sets Section */}
      <View className="mb-3">
        {/* Sets Header */}
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-8 text-center">
            SET
          </Text>
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-16 text-center">
            PREVIOUS
          </Text>
          {requiredFields.needsWeight && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              {getWeightLabel()}
            </Text>
          )}
          {requiredFields.needsReps && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              REPS
            </Text>
          )}
          {requiredFields.needsDuration && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              TIME
            </Text>
          )}
          {requiredFields.needsDistance && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              {getDistanceLabel()}
            </Text>
          )}
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-12 text-center">
            RPE
          </Text>
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-8 text-center">
            ✓
          </Text>
        </View>

        {/* Sets Rows */}
        {exercise.sets.map((set, index) => {
          const previousData = previousSets[index];

          return (
            <SwipeableSetRow
              key={set.id}
              onDelete={() => handleRemoveSet(set.id)}
              canDelete={exercise.sets.length > 1}
              isCompleted={set.isCompleted}
            >
              <View className="flex-row items-center">
                {/* Set Number */}
                <Text className="text-white text-sm font-Poppins_600SemiBold w-8 text-center">
                  {index + 1}
                </Text>

                {/* Previous Column */}
                <View className="w-16 items-center">
                  <Text className="text-gray-500 text-xs font-Poppins_400Regular text-center">
                    {previousData && exerciseDetails
                      ? formatPreviousSet(
                          previousData,
                          exerciseDetails.exerciseType as ExerciseType,
                          unitsConfig.weight,
                          unitsConfig.distance,
                        )
                      : "-"}
                  </Text>
                </View>

                {/* Weight Input */}
                {requiredFields.needsWeight && (
                  <View className="flex-1 mx-1">
                    <TextInput
                      value={
                        set.weight
                          ? unitsConfig.weight === "lbs"
                            ? convertWeight(set.weight, "kg", "lbs").toString()
                            : set.weight.toString()
                          : ""
                      }
                      onChangeText={(value) => {
                        const weightInKg =
                          unitsConfig.weight === "lbs" && value
                            ? convertWeight(parseFloat(value), "lbs", "kg")
                            : value
                              ? parseFloat(value)
                              : undefined;
                        handleUpdateSet(set.id, { weight: weightInKg });
                      }}
                      placeholder={
                        previousData
                          ? getPreviousValuePlaceholder(
                              "weight",
                              previousData,
                              unitsConfig.weight,
                              unitsConfig.distance,
                            )
                          : "0"
                      }
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      className="bg-neutral-700 rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular"
                    />
                  </View>
                )}

                {/* Reps Input */}
                {requiredFields.needsReps && (
                  <View className="flex-1 mx-1">
                    <TextInput
                      value={set.reps ? set.reps.toString() : ""}
                      onChangeText={(value) =>
                        handleUpdateSet(set.id, {
                          reps: value ? parseInt(value) : undefined,
                        })
                      }
                      placeholder={
                        previousData
                          ? getPreviousValuePlaceholder("reps", previousData)
                          : "0"
                      }
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      className="bg-neutral-700 rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular"
                    />
                  </View>
                )}

                {/* Duration Input */}
                {requiredFields.needsDuration && (
                  <View className="flex-1 mx-1">
                    <TextInput
                      value={set.duration ? set.duration.toString() : ""}
                      onChangeText={(value) =>
                        handleUpdateSet(set.id, {
                          duration: value ? parseInt(value) : undefined,
                        })
                      }
                      placeholder={
                        previousData
                          ? getPreviousValuePlaceholder(
                              "duration",
                              previousData,
                            )
                          : "60"
                      }
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      className="bg-neutral-700 rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular"
                    />
                  </View>
                )}

                {/* Distance Input */}
                {requiredFields.needsDistance && (
                  <View className="flex-1 mx-1">
                    <TextInput
                      value={
                        set.distance
                          ? unitsConfig.distance === "mi"
                            ? (set.distance / 1000 / 1.609344).toString() // Convert meters to miles
                            : set.distance.toString()
                          : ""
                      }
                      onChangeText={(value) => {
                        const distanceInMeters =
                          unitsConfig.distance === "mi" && value
                            ? parseFloat(value) * 1000 * 1.609344 // Convert miles to meters
                            : value
                              ? parseFloat(value)
                              : undefined;
                        handleUpdateSet(set.id, { distance: distanceInMeters });
                      }}
                      placeholder={
                        previousData
                          ? getPreviousValuePlaceholder(
                              "distance",
                              previousData,
                              unitsConfig.weight,
                              unitsConfig.distance,
                            )
                          : "100"
                      }
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      className="bg-neutral-700 rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular"
                    />
                  </View>
                )}

                {/* RPE Input */}
                <View className="w-12 mx-1">
                  <TextInput
                    value={set.rpe.toString()}
                    onChangeText={(value) =>
                      handleUpdateSet(set.id, {
                        rpe: value ? parseInt(value) : 5,
                      })
                    }
                    placeholder={
                      previousData?.rpe ? previousData.rpe.toString() : "8"
                    }
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={2}
                    className="bg-neutral-700 rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular"
                  />
                </View>

                {/* Completed Checkbox */}
                <TouchableOpacity
                  className="w-8 items-center"
                  onPress={() => {
                    if (previousData && !set.isCompleted) {
                      // Quick-fill with previous data, but preserve user values
                      quickFillSet(set.id, previousData);
                    } else {
                      // Normal toggle
                      handleUpdateSet(set.id, {
                        isCompleted: !set.isCompleted,
                      });
                    }
                  }}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      set.isCompleted
                        ? "bg-[#6F2DBD] border-[#6F2DBD]"
                        : previousData
                          ? "border-[#6F2DBD]"
                          : "border-gray-500"
                    }`}
                  >
                    {set.isCompleted && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </SwipeableSetRow>
          );
        })}
      </View>

      {/* Add Set Button */}
      <TouchableOpacity
        onPress={handleAddSet}
        className="bg-neutral-700 border border-dashed border-gray-500 rounded-xl p-3 flex-row items-center justify-center"
      >
        <Ionicons name="add" size={16} color="#6F2DBD" />
        <Text className="text-[#6F2DBD] font-Poppins_500Medium ml-1 text-sm">
          Add Set
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const Page = () => {
  const convex = useConvex();
  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [duration] = useAtom(workoutDurationAtom);
  const [setsCount] = useAtom(workoutSetsCountAtom);
  const [, finishWorkout] = useAtom(finishWorkoutAction);
  const [, discardWorkout] = useAtom(discardWorkoutAction);
  const [, logSet] = useAtom(logSetAction);
  const [, tickTimer] = useAtom(tickTimerAction);
  const [individualMuscleProgress, setIndividualMuscleProgress] = useAtom(
    individualMuscleProgressAtom,
  );
  const [weeklyProgress, setWeeklyProgress] = useAtom(weeklyProgressAtom);

  // Force duration updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickTimer]);

  const handleFinishWorkout = async () => {
    if (activeWorkout.exercises.length === 0) {
      Alert.alert(
        "Empty Workout",
        "Add some exercises before finishing your workout.",
      );
      return;
    }

    const totalCompletedSets = setsCount;
    if (totalCompletedSets === 0) {
      Alert.alert(
        "No Sets Completed",
        "Complete at least one set before finishing your workout.",
      );
      return;
    }

    Alert.alert(
      "Finish Workout",
      `Save your workout with ${totalCompletedSets} completed sets?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          onPress: async () => {
            try {
              // Navigate away immediately to prevent race condition
              router.back();

              const { loggedSets, workoutSession } = finishWorkout();

              // Process XP for each exercise and update progress
              let updatedIndividualProgress = individualMuscleProgress;
              let updatedWeeklyProgress = weeklyProgress;
              let totalWorkoutXP = 0;

              for (const exercise of activeWorkout.exercises) {
                // Get exercise details with muscle data for each exercise
                try {
                  const exerciseDetails = await convex.query(
                    api.exercises.getExerciseDetails,
                    {
                      exerciseId: exercise.exerciseId,
                    },
                  );

                  if (
                    exerciseDetails &&
                    exerciseDetails.muscles &&
                    exercise.sets.some((set) => set.isCompleted)
                  ) {
                    // Extract real muscle involvement from exercise details
                    const muscleInvolvements = extractMuscleInvolvement(
                      exerciseDetails.muscles,
                    );

                    // Process each completed set
                    exercise.sets
                      .filter((set) => set.isCompleted)
                      .forEach((set) => {
                        const result = processSetLogging(
                          updatedIndividualProgress,
                          updatedWeeklyProgress,
                          muscleInvolvements,
                          set.rpe,
                        );

                        updatedIndividualProgress =
                          result.updatedIndividualProgress;
                        updatedWeeklyProgress =
                          result.updatedMajorGroupProgress;
                        totalWorkoutXP += result.xpCalculation.totalXP;
                      });
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch exercise details for ${exercise.exerciseId}:`,
                    error,
                  );
                }
              }

              // Update the workout session with calculated XP
              workoutSession.totalXP = totalWorkoutXP;

              // Update progress atoms
              setIndividualMuscleProgress(updatedIndividualProgress);
              setWeeklyProgress(updatedWeeklyProgress);

              // Add sets to exercise log
              loggedSets.forEach((set) => {
                logSet({
                  exerciseId: set.exerciseId,
                  reps: set.reps,
                  weight: set.weight,
                  duration: set.duration,
                  distance: set.distance,
                  rpe: set.rpe,
                });
              });
            } catch (error) {
              console.error("Error finishing workout:", error);
              Alert.alert("Error", "Failed to save workout. Please try again.");
            }
          },
        },
      ],
    );
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

  if (!activeWorkout.isActive) {
    return (
      <View className="flex-1 bg-dark px-4 pt-4 justify-center items-center">
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

  return (
    <>
      <Stack.Screen
        options={{
          title: "Log Workout",
          headerShown: true,
          presentation: "modal",
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleFinishWorkout}
              className="bg-[#6F2DBD] px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-Poppins_600SemiBold">
                Finish
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 bg-dark">
        {/* Workout Stats */}
        <View className="px-4 py-3 border-b border-neutral-700">
          <View className="flex-row items-center justify-around">
            <View className="items-center">
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                Duration
              </Text>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                {formatDuration(duration)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                Sets
              </Text>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                {setsCount}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {activeWorkout.exercises.length === 0 ? (
            // Empty State
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="barbell-outline" size={64} color="#6B7280" />
              <Text className="text-white text-xl font-Poppins_600SemiBold mt-4 mb-2">
                Get started
              </Text>
              <Text className="text-gray-400 text-center mb-8 font-Poppins_400Regular">
                Add an exercise to start your workout
              </Text>
              <Link
                href="/(app)/(authenticated)/(modal)/workout/add-exercises"
                asChild
              >
                <TouchableOpacity className="bg-[#6F2DBD] px-8 py-4 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="add" size={20} color="white" />
                    <Text className="text-white font-Poppins_600SemiBold ml-2">
                      Add Exercise
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            // Workout Content
            <>
              {activeWorkout.exercises.map((exercise) => (
                <WorkoutExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                />
              ))}

              {/* Add Exercise Button */}
              <Link
                href="/(app)/(authenticated)/(modal)/workout/add-exercises"
                asChild
              >
                <TouchableOpacity className="bg-[#6F2DBD] rounded-xl p-4 mb-4 flex-row items-center justify-center">
                  <Ionicons name="add" size={20} color="white" />
                  <Text className="text-white font-Poppins_600SemiBold ml-2">
                    Add Exercise
                  </Text>
                </TouchableOpacity>
              </Link>

              {/* Bottom Actions */}
              <View className="flex-row gap-3 mt-4 mb-8">
                <TouchableOpacity
                  onPress={handleDiscardWorkout}
                  className="flex-1 bg-neutral-800 py-4 rounded-xl"
                >
                  <Text className="text-center text-lg text-red-400 font-Poppins_600SemiBold">
                    Discard Workout
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
};

export default Page;
