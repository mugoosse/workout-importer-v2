import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { SwipeableSetRow } from "@/components/SwipeableSetRow";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import {
  getLastWorkoutSetsAtom,
  getSetsByExerciseAtom,
  logSetAction,
  type ExerciseType,
  type LoggedSet,
} from "@/store/exerciseLog";
import { unitsConfigAtom } from "@/store/units";
import {
  getProgressColor,
  getStreakEmoji,
  individualMuscleProgressAtom,
  weeklyProgressAtom,
} from "@/store/weeklyProgress";
import {
  formatPreviousSet,
  getPreviousValuePlaceholder,
} from "@/utils/previousWorkoutFormatter";
import { convertWeight } from "@/utils/unitConversions";
import {
  extractMuscleInvolvement,
  processSetLogging,
} from "@/utils/xpCalculator";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type MuscleRole = "target" | "synergist" | "stabilizer" | "lengthening";

const MUSCLE_ROLE_COLORS: Record<MuscleRole, string> = {
  target: "#1FD224", // green
  synergist: "#FF8A1B", // orange
  stabilizer: "#FCD514", // yellow
  lengthening: "#3498DB", // blue
};

const MUSCLE_ROLE_EXPLANATIONS: Record<MuscleRole, string> = {
  target: "Primary muscles being worked by this exercise",
  synergist: "Supporting muscles that assist the primary movement",
  stabilizer: "Muscles that provide stability and control during the movement",
  lengthening: "Muscles that are stretched or lengthened during the exercise",
};

const formatMuscleName = (svgId: string): string => {
  return svgId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(" And ", " and ");
};

const formatRoleName = (role: MuscleRole): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const cleanExerciseTitle = (title: string) => {
  // Remove equipment suffix pattern " (Equipment Name)"
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = id as Id<"exercises">;
  const exerciseDetails = useQuery(api.exercises.getExerciseDetails, {
    exerciseId,
  });
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [individualMuscleProgress, setIndividualMuscleProgress] = useAtom(
    individualMuscleProgressAtom,
  );
  const [weeklyProgress, setWeeklyProgress] = useAtom(weeklyProgressAtom);
  const [, logSet] = useAtom(logSetAction);
  const [getSetsByExercise] = useAtom(getSetsByExerciseAtom);
  const [getLastWorkoutSets] = useAtom(getLastWorkoutSetsAtom);
  const [unitsConfig] = useAtom(unitsConfigAtom);

  // Set logging modal state
  const [showLogModal, setShowLogModal] = useState(false);

  // Multi-set interface state
  interface SetData {
    reps: string;
    weight: string;
    duration: string;
    distance: string;
    rpe: string;
    completed: boolean;
    previousData?: LoggedSet; // Store previous workout data for display and quick-fill
  }

  const [sets, setSets] = useState<SetData[]>([
    {
      reps: "",
      weight: "",
      duration: "",
      distance: "",
      rpe: "8",
      completed: false,
    },
  ]);
  // Remove unused variable for now
  // const [lastXPCalculation, setLastXPCalculation] =
  //   useState<XPCalculationResult | null>(null);

  const [collapsedSections, setCollapsedSections] = useState<Set<MuscleRole>>(
    () =>
      new Set<MuscleRole>(["target", "synergist", "stabilizer", "lengthening"]),
  );

  // Get logged sets for this exercise
  const loggedSets = getSetsByExercise(exerciseId);

  // Helper functions for sets management
  const addSet = () => {
    setSets((prev) => [
      ...prev,
      {
        reps: "",
        weight: "",
        duration: "",
        distance: "",
        rpe: "8",
        completed: false,
        // No previous data for new sets
      },
    ]);
  };

  const updateSet = (
    index: number,
    field: keyof SetData,
    value: string | boolean,
  ) => {
    setSets((prev) =>
      prev.map((set, i) => (i === index ? { ...set, [field]: value } : set)),
    );
  };

  const quickFillSet = (index: number) => {
    const set = sets[index];
    if (!set.previousData) return;

    const updatedSet: SetData = {
      ...set,
      reps: set.previousData.reps ? set.previousData.reps.toString() : "",
      weight: set.previousData.weight ? set.previousData.weight.toString() : "",
      duration: set.previousData.duration
        ? set.previousData.duration.toString()
        : "",
      distance: set.previousData.distance
        ? set.previousData.distance.toString()
        : "",
      rpe: set.previousData.rpe ? set.previousData.rpe.toString() : "8",
      completed: true,
    };

    setSets((prev) =>
      prev.map((setItem, i) => (i === index ? updatedSet : setItem)),
    );
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const resetSets = () => {
    initializeSetsWithPreviousData();
  };

  const initializeSetsWithPreviousData = () => {
    const previousSets = getLastWorkoutSets(exerciseId);

    if (previousSets.length > 0) {
      // Create the same number of sets as the previous workout
      const newSets: SetData[] = previousSets.map((prevSet) => ({
        reps: "",
        weight: "",
        duration: "",
        distance: "",
        rpe: "8",
        completed: false,
        previousData: prevSet,
      }));
      setSets(newSets);
    } else {
      // No previous data, create a single empty set
      setSets([
        {
          reps: "",
          weight: "",
          duration: "",
          distance: "",
          rpe: "8",
          completed: false,
        },
      ]);
    }
  };

  const toggleSection = (role: MuscleRole) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return newSet;
    });
  };

  if (!exerciseDetails) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!exerciseDetails) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg font-Poppins_500Medium">
          Exercise not found
        </Text>
      </View>
    );
  }

  // Group muscles by role
  const musclesByRole = exerciseDetails.muscles.reduce(
    (acc, { muscle, role }) => {
      if (!muscle) return acc;
      if (!acc[role]) acc[role] = [];
      acc[role].push(muscle);
      return acc;
    },
    {} as Record<MuscleRole, any[]>,
  );

  // Create highlighted muscles for visualization
  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  exerciseDetails.muscles.forEach(({ muscle, role }) => {
    if (!muscle || seenMuscleIds.has(muscle.svgId)) return;
    seenMuscleIds.add(muscle.svgId);

    // If a muscle is selected, only highlight that one
    if (selectedMuscleId && muscle.svgId !== selectedMuscleId) {
      return;
    }

    const color = MUSCLE_ROLE_COLORS[role];

    highlightedMuscles.push({
      muscleId: muscle.svgId,
      color,
    });
  });

  const handleMusclePress = (muscleId: MuscleId) => {
    if (selectedMuscleId === muscleId) {
      setSelectedMuscleId(null);
    } else {
      setSelectedMuscleId(muscleId);
    }
  };

  const handleOpenMenu = () => {
    router.push(
      `/(app)/(authenticated)/(modal)/exercise/menu?exerciseId=${exerciseId}&exerciseName=${encodeURIComponent(exerciseDetails.title)}${exerciseDetails.url ? `&url=${encodeURIComponent(exerciseDetails.url)}` : ""}`,
    );
  };

  const handleLogAllSets = () => {
    const completedSets = sets.filter((set) => set.completed);

    if (completedSets.length === 0) {
      Alert.alert(
        "No Sets Completed",
        "Please complete at least one set before logging.",
      );
      return;
    }

    const muscleInvolvements = extractMuscleInvolvement(
      exerciseDetails!.muscles,
    );

    let totalXP = 0;
    let loggedCount = 0;

    // Log each completed set
    completedSets.forEach((set) => {
      if (!validateSet(set)) {
        return; // Skip invalid sets
      }

      const rpeValue = parseInt(set.rpe);

      // Process the set logging and update progress
      const result = processSetLogging(
        individualMuscleProgress,
        weeklyProgress,
        muscleInvolvements,
        rpeValue,
      );

      // Update the atoms with new progress
      setIndividualMuscleProgress(result.updatedIndividualProgress);
      setWeeklyProgress(result.updatedMajorGroupProgress);

      // Convert units back to metric for storage
      const weightInKg =
        unitsConfig.weight === "lbs" && set.weight
          ? convertWeight(parseFloat(set.weight), "lbs", "kg")
          : parseFloat(set.weight);

      // Log the set
      logSet({
        exerciseId,
        reps: requiredFields.needsReps ? parseInt(set.reps) : undefined,
        weight: requiredFields.needsWeight ? weightInKg : undefined,
        duration: requiredFields.needsDuration
          ? parseInt(set.duration)
          : undefined,
        distance: requiredFields.needsDistance
          ? parseFloat(set.distance)
          : undefined,
        rpe: rpeValue,
      });

      totalXP += result.xpCalculation.totalXP;
      loggedCount++;
    });

    // Reset form and close modal
    resetSets();
    setShowLogModal(false);

    // Show success message
    Alert.alert(
      "Sets Logged!",
      `Successfully logged ${loggedCount} set${loggedCount > 1 ? "s" : ""}. You earned ${totalXP} total XP.`,
      [
        {
          text: "View Details",
          onPress: () => {
            // Could show detailed XP breakdown modal here
          },
        },
        { text: "OK" },
      ],
    );
  };

  // Helper functions to determine which fields to show based on exercise type
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
        return {
          needsReps: true,
          needsWeight: true,
          needsDuration: false,
          needsDistance: false,
        };
      case "Assisted Bodyweight":
        return {
          needsReps: true,
          needsWeight: true,
          needsDuration: false,
          needsDistance: false,
        }; // weight as assistance
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

  const requiredFields = exerciseDetails
    ? getRequiredFields(exerciseDetails.exerciseType as ExerciseType)
    : {
        needsReps: true,
        needsWeight: false,
        needsDuration: false,
        needsDistance: false,
      };

  const validateSet = (set: SetData) => {
    if (
      !exerciseDetails ||
      !set.rpe ||
      parseInt(set.rpe) < 1 ||
      parseInt(set.rpe) > 10
    ) {
      return false;
    }
    if (requiredFields.needsReps && (!set.reps || parseInt(set.reps) <= 0))
      return false;
    if (
      requiredFields.needsWeight &&
      (!set.weight || parseFloat(set.weight) <= 0)
    )
      return false;
    if (
      requiredFields.needsDuration &&
      (!set.duration || parseInt(set.duration) <= 0)
    )
      return false;
    if (
      requiredFields.needsDistance &&
      (!set.distance || parseFloat(set.distance) <= 0)
    )
      return false;
    return true;
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

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: cleanExerciseTitle(exerciseDetails.title),
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleOpenMenu} className="mr-2">
              <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Details */}
        <View className="mx-4 mt-4 mb-6">
          {/* Exercise Type and Equipment Tags */}
          <View className="flex-row items-center flex-wrap gap-2 mb-4">
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(app)/(authenticated)/(modal)/exercises?exerciseTypes=${encodeURIComponent(exerciseDetails.exerciseType)}`,
                )
              }
            >
              <Badge variant="outline">
                <Text className="text-white text-xs">
                  {exerciseDetails.exerciseType}
                </Text>
              </Badge>
            </TouchableOpacity>

            {/* Equipment tags - clickable */}
            {exerciseDetails.equipment &&
              exerciseDetails.equipment.map((equipment) => (
                <TouchableOpacity
                  key={equipment._id}
                  onPress={() =>
                    router.push(
                      `/(app)/(authenticated)/(modal)/exercises?equipmentIds=${equipment._id}`,
                    )
                  }
                >
                  <Badge variant="outline">
                    <Text className="text-white text-xs">{equipment.name}</Text>
                  </Badge>
                </TouchableOpacity>
              ))}
          </View>

          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            {/* Description */}
            {exerciseDetails.description && (
              <View>
                <Text className="text-gray-300 text-sm font-Poppins_400Regular leading-5">
                  {exerciseDetails.description}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Set Logging Section */}
        <View className="mx-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
              Log Exercise
            </Text>

            {/* Log Set Button */}
            <TouchableOpacity
              onPress={() => {
                initializeSetsWithPreviousData();
                setShowLogModal(true);
              }}
              className="bg-[#6F2DBD] rounded-xl p-4 mb-4"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text className="text-white font-Poppins_600SemiBold ml-2">
                  Log Set
                </Text>
              </View>
            </TouchableOpacity>

            {/* Recent Workouts */}
            {loggedSets.length > 0 && (
              <View>
                <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-3">
                  Recent Workouts
                </Text>
                <View className="space-y-3">
                  {(() => {
                    // Group sets by date to create workout sessions
                    const workoutsByDate = loggedSets.reduce(
                      (acc, set) => {
                        if (!acc[set.date]) {
                          acc[set.date] = [];
                        }
                        acc[set.date].push(set);
                        return acc;
                      },
                      {} as Record<string, typeof loggedSets>,
                    );

                    // Sort dates in descending order (most recent first)
                    const sortedDates = Object.keys(workoutsByDate).sort(
                      (a, b) => b.localeCompare(a),
                    );

                    // Take only the 3 most recent workout sessions
                    return sortedDates.slice(0, 3).map((date, workoutIndex) => {
                      const workoutSets = workoutsByDate[date].sort(
                        (a, b) => a.timestamp - b.timestamp,
                      );
                      const formatSetDisplay = (set: any) => {
                        const parts = [];
                        if (set.reps) parts.push(`${set.reps} reps`);
                        if (set.weight) parts.push(`${set.weight} kg`);
                        if (set.duration) parts.push(`${set.duration}s`);
                        if (set.distance) parts.push(`${set.distance}m`);
                        return parts.join(" • ");
                      };

                      const formatWorkoutDate = (dateStr: string) => {
                        const date = new Date(dateStr);
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (dateStr === today.toISOString().split("T")[0]) {
                          return "Today";
                        } else if (
                          dateStr === yesterday.toISOString().split("T")[0]
                        ) {
                          return "Yesterday";
                        } else {
                          return date.toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year:
                              date.getFullYear() !== today.getFullYear()
                                ? "numeric"
                                : undefined,
                          });
                        }
                      };

                      return (
                        <View
                          key={date}
                          className={`bg-[#2c2c2e] rounded-lg p-4 ${workoutIndex > 0 ? "mt-3" : ""}`}
                        >
                          {/* Workout Header */}
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-white font-Poppins_600SemiBold text-sm">
                              {formatWorkoutDate(date)}
                            </Text>
                            <Text className="text-gray-400 text-xs">
                              {workoutSets.length} set
                              {workoutSets.length > 1 ? "s" : ""}
                            </Text>
                          </View>

                          {/* Sets List */}
                          <View className="space-y-2">
                            {workoutSets.map((set, setIndex) => (
                              <View
                                key={set.id}
                                className="flex-row justify-between items-center"
                              >
                                <Text className="text-gray-300 font-Poppins_400Regular text-xs flex-1">
                                  Set {setIndex + 1}: {formatSetDisplay(set)}
                                </Text>
                                <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium ml-2">
                                  RPE {set.rpe}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Muscle Body Visualization */}
        <View className="mx-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
              Muscle Involvement
            </Text>

            <View className="items-center mb-4">
              <MuscleBody
                view="both"
                highlightedMuscles={highlightedMuscles}
                onMusclePress={handleMusclePress}
                width={250}
                height={400}
              />
            </View>
          </View>
        </View>

        {/* Filter Status Bar */}
        {selectedMuscleId && (
          <View className="mx-4 mb-4 bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="filter" size={16} color="#6F2DBD" />
              <Text className="text-white ml-2 font-Poppins_500Medium">
                Filtered: {formatMuscleName(selectedMuscleId)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedMuscleId(null)}>
              <View className="bg-[#1c1c1e] rounded-lg px-3 py-1">
                <Text className="text-gray-400 font-Poppins_400Regular">
                  Clear
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Muscle Groups by Role */}
        <View className="px-4">
          {(
            ["target", "synergist", "stabilizer", "lengthening"] as MuscleRole[]
          ).map((role) => {
            const muscles = musclesByRole[role];
            if (!muscles || muscles.length === 0) return null;

            // Filter muscles if one is selected
            const displayMuscles = selectedMuscleId
              ? muscles.filter((muscle) => muscle.svgId === selectedMuscleId)
              : muscles;

            if (displayMuscles.length === 0) return null;

            const isCollapsed = collapsedSections.has(role);

            return (
              <View key={role} className="mb-8">
                <TouchableOpacity
                  className="flex-row items-center mb-2"
                  onPress={() => toggleSection(role)}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: MUSCLE_ROLE_COLORS[role] }}
                  />
                  <View className="flex-1">
                    <Text className="text-white text-xl font-Poppins_600SemiBold">
                      {formatRoleName(role)} Muscles
                    </Text>
                    <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                      {MUSCLE_ROLE_EXPLANATIONS[role]}
                    </Text>
                  </View>
                  <Ionicons
                    name={isCollapsed ? "chevron-down" : "chevron-up"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {!isCollapsed && (
                  <View>
                    {displayMuscles.map((muscle, index) => {
                      const muscleProgress = individualMuscleProgress[
                        muscle.svgId
                      ] || {
                        xp: 0,
                        goal: 500,
                        percentage: 0,
                        streak: 0,
                        sets: 0,
                      };
                      const progressColor = getProgressColor(
                        muscleProgress.percentage,
                      );

                      return (
                        <View
                          key={muscle._id}
                          className={index > 0 ? "mt-4" : ""}
                        >
                          <Link
                            href={`/(app)/(authenticated)/(modal)/muscle/${muscle._id}`}
                            asChild
                          >
                            <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                              <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-1">
                                  <Text className="text-white text-lg font-Poppins_600SemiBold">
                                    {muscle.name}
                                  </Text>
                                  <View className="flex-row items-center gap-3 mt-2">
                                    <Badge variant="outline">
                                      <Text className="text-white text-xs">
                                        {getStreakEmoji(muscleProgress.streak)}{" "}
                                        {muscleProgress.streak} weeks
                                      </Text>
                                    </Badge>
                                    <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                      {muscleProgress.sets} sets
                                    </Text>
                                  </View>
                                </View>
                                <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
                                  <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#fff"
                                  />
                                </View>
                              </View>

                              {/* Progress Bar */}
                              <View className="mb-2">
                                <View className="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                                  <View
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(100, muscleProgress.percentage)}%`,
                                      backgroundColor: progressColor,
                                    }}
                                  />
                                </View>

                                <View className="flex-row justify-between items-center">
                                  <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                    {muscleProgress.xp} / {muscleProgress.goal}{" "}
                                    XP
                                  </Text>
                                  <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                    {muscleProgress.percentage}%
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Link>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Multi-Set Logging Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1c1c1e] rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-Poppins_600SemiBold">
                Log Workout
              </Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sets Table Header */}
              <View className="bg-[#2c2c2e] rounded-xl p-3 mb-4">
                <View className="flex-row items-center">
                  <Text className="text-gray-300 text-sm font-Poppins_600SemiBold w-12 text-center">
                    SET
                  </Text>
                  <Text className="text-gray-300 text-sm font-Poppins_600SemiBold w-20 text-center">
                    PREVIOUS
                  </Text>
                  {requiredFields.needsWeight && (
                    <Text className="text-gray-300 text-sm font-Poppins_600SemiBold flex-1 text-center">
                      {getWeightLabel()}
                    </Text>
                  )}
                  {requiredFields.needsReps && (
                    <Text className="text-gray-300 text-sm font-Poppins_600SemiBold flex-1 text-center">
                      REPS
                    </Text>
                  )}
                  {requiredFields.needsDuration && (
                    <Text className="text-gray-300 text-sm font-Poppins_600SemiBold flex-1 text-center">
                      TIME
                    </Text>
                  )}
                  {requiredFields.needsDistance && (
                    <Text className="text-gray-300 text-sm font-Poppins_600SemiBold flex-1 text-center">
                      {getDistanceLabel()}
                    </Text>
                  )}
                  <Text className="text-gray-300 text-sm font-Poppins_600SemiBold w-16 text-center">
                    RPE
                  </Text>
                  <Text className="text-gray-300 text-sm font-Poppins_600SemiBold w-12 text-center">
                    ✓
                  </Text>
                </View>
              </View>

              {/* Sets Rows */}
              {sets.map((set, index) => (
                <SwipeableSetRow
                  key={index}
                  onDelete={() => removeSet(index)}
                  canDelete={sets.length > 1}
                  isCompleted={set.completed}
                >
                  <View className="flex-row items-center">
                    {/* Set Number */}
                    <Text className="text-white text-sm font-Poppins_600SemiBold w-12 text-center">
                      {index + 1}
                    </Text>

                    {/* Previous Column */}
                    <View className="w-20 items-center">
                      <Text className="text-gray-500 text-xs font-Poppins_400Regular text-center">
                        {set.previousData && exerciseDetails
                          ? formatPreviousSet(
                              set.previousData,
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
                          value={set.weight}
                          onChangeText={(value) =>
                            updateSet(index, "weight", value)
                          }
                          placeholder={
                            set.previousData
                              ? getPreviousValuePlaceholder(
                                  "weight",
                                  set.previousData,
                                  unitsConfig.weight,
                                  unitsConfig.distance,
                                )
                              : "0"
                          }
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          className="bg-[#2c2c2e] rounded-lg p-2 text-white text-center font-Poppins_400Regular"
                        />
                      </View>
                    )}

                    {/* Reps Input */}
                    {requiredFields.needsReps && (
                      <View className="flex-1 mx-1">
                        <TextInput
                          value={set.reps}
                          onChangeText={(value) =>
                            updateSet(index, "reps", value)
                          }
                          placeholder={
                            set.previousData
                              ? getPreviousValuePlaceholder(
                                  "reps",
                                  set.previousData,
                                )
                              : "0"
                          }
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          className="bg-[#2c2c2e] rounded-lg p-2 text-white text-center font-Poppins_400Regular"
                        />
                      </View>
                    )}

                    {/* Duration Input */}
                    {requiredFields.needsDuration && (
                      <View className="flex-1 mx-1">
                        <TextInput
                          value={set.duration}
                          onChangeText={(value) =>
                            updateSet(index, "duration", value)
                          }
                          placeholder={
                            set.previousData
                              ? getPreviousValuePlaceholder(
                                  "duration",
                                  set.previousData,
                                )
                              : "00:00"
                          }
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          className="bg-[#2c2c2e] rounded-lg p-2 text-white text-center font-Poppins_400Regular"
                        />
                      </View>
                    )}

                    {/* Distance Input */}
                    {requiredFields.needsDistance && (
                      <View className="flex-1 mx-1">
                        <TextInput
                          value={set.distance}
                          onChangeText={(value) =>
                            updateSet(index, "distance", value)
                          }
                          placeholder={
                            set.previousData
                              ? getPreviousValuePlaceholder(
                                  "distance",
                                  set.previousData,
                                  unitsConfig.weight,
                                  unitsConfig.distance,
                                )
                              : "0"
                          }
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          className="bg-[#2c2c2e] rounded-lg p-2 text-white text-center font-Poppins_400Regular"
                        />
                      </View>
                    )}

                    {/* RPE Input */}
                    <View className="w-16 mx-1">
                      <TextInput
                        value={set.rpe}
                        onChangeText={(value) => updateSet(index, "rpe", value)}
                        placeholder="8"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        maxLength={2}
                        className="bg-[#2c2c2e] rounded-lg p-2 text-white text-center font-Poppins_400Regular"
                      />
                    </View>

                    {/* Completed Checkbox */}
                    <TouchableOpacity
                      className="w-12 items-center"
                      onPress={() => {
                        if (set.previousData && !set.completed) {
                          // Quick-fill with previous data
                          quickFillSet(index);
                        } else {
                          // Normal toggle
                          updateSet(index, "completed", !set.completed);
                        }
                      }}
                    >
                      <View
                        className={`w-6 h-6 rounded border-2 items-center justify-center ${
                          set.completed
                            ? "bg-[#6F2DBD] border-[#6F2DBD]"
                            : set.previousData
                              ? "border-[#6F2DBD]"
                              : "border-gray-500"
                        }`}
                      >
                        {set.completed && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </SwipeableSetRow>
              ))}

              {/* Add Set Button */}
              <TouchableOpacity
                onPress={addSet}
                className="bg-[#2c2c2e] border-2 border-dashed border-gray-500 rounded-xl p-4 mb-6 items-center justify-center"
              >
                <View className="flex-row items-center">
                  <Ionicons name="add" size={20} color="#6F2DBD" />
                  <Text className="text-[#6F2DBD] font-Poppins_500Medium ml-2">
                    Add Set
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => {
                  resetSets();
                  setShowLogModal(false);
                }}
                className="flex-1 bg-[#2c2c2e] rounded-xl p-4"
              >
                <Text className="text-gray-300 font-Poppins_500Medium text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogAllSets}
                className="flex-1 bg-[#6F2DBD] rounded-xl p-4"
              >
                <Text className="text-white font-Poppins_600SemiBold text-center">
                  Finish
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Page;
