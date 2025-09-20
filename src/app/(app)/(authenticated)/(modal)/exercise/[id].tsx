import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import {
  getProgressColor,
  getStreakEmoji,
  individualMuscleProgressAtom,
  weeklyProgressAtom,
} from "@/store/weeklyProgress";
import {
  logSetAction,
  getSetsByExerciseAtom,
  type ExerciseType,
} from "@/store/exerciseLog";
import {
  processSetLogging,
  extractMuscleInvolvement,
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

  // Set logging modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [rpe, setRpe] = useState("8"); // Default to moderate intensity
  // Remove unused variable for now
  // const [lastXPCalculation, setLastXPCalculation] =
  //   useState<XPCalculationResult | null>(null);

  const [collapsedSections, setCollapsedSections] = useState<Set<MuscleRole>>(
    () =>
      new Set<MuscleRole>(["target", "synergist", "stabilizer", "lengthening"]),
  );

  // Get logged sets for this exercise
  const loggedSets = getSetsByExercise(exerciseId);

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

  const handleLogSet = () => {
    if (!validateInput()) {
      Alert.alert(
        "Invalid Input",
        "Please fill in all required fields with valid values. RPE must be between 1-10.",
      );
      return;
    }

    const muscleInvolvements = extractMuscleInvolvement(
      exerciseDetails!.muscles,
    );

    const rpeValue = parseInt(rpe);

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

    // Log the set
    logSet({
      exerciseId,
      reps: requiredFields.needsReps ? parseInt(reps) : undefined,
      weight: requiredFields.needsWeight ? parseFloat(weight) : undefined,
      duration: requiredFields.needsDuration ? parseInt(duration) : undefined,
      distance: requiredFields.needsDistance ? parseFloat(distance) : undefined,
      rpe: rpeValue,
    });

    // Reset form and close modal
    setReps("");
    setWeight("");
    setDuration("");
    setDistance("");
    setRpe("8");
    setShowLogModal(false);

    // Show success message with XP breakdown
    const totalXP = result.xpCalculation.totalXP;
    const rpeMultiplier = rpeValue / 10;
    Alert.alert(
      "Set Logged!",
      `You earned ${totalXP} XP total from this set (RPE ${rpeValue} = ${Math.round(rpeMultiplier * 100)}% intensity).`,
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

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  const validateInput = () => {
    if (!exerciseDetails || !rpe || parseInt(rpe) < 1 || parseInt(rpe) > 10) {
      return false;
    }
    if (requiredFields.needsReps && (!reps || parseInt(reps) <= 0))
      return false;
    if (requiredFields.needsWeight && (!weight || parseFloat(weight) <= 0))
      return false;
    if (requiredFields.needsDuration && (!duration || parseInt(duration) <= 0))
      return false;
    if (
      requiredFields.needsDistance &&
      (!distance || parseFloat(distance) <= 0)
    )
      return false;
    return true;
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
              onPress={() => setShowLogModal(true)}
              className="bg-[#6F2DBD] rounded-xl p-4 mb-4"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text className="text-white font-Poppins_600SemiBold ml-2">
                  Log Set
                </Text>
              </View>
            </TouchableOpacity>

            {/* Recent Sets */}
            {loggedSets.length > 0 && (
              <View>
                <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-3">
                  Recent Sets ({loggedSets.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                >
                  {loggedSets.slice(0, 5).map((set, index) => {
                    const formatSetDisplay = (set: any) => {
                      const parts = [];
                      if (set.reps) parts.push(`${set.reps} reps`);
                      if (set.weight) parts.push(`${set.weight} kg`);
                      if (set.duration) parts.push(`${set.duration}s`);
                      if (set.distance) parts.push(`${set.distance}m`);
                      return parts.join(" • ");
                    };

                    return (
                      <View
                        key={set.id}
                        className={`bg-[#2c2c2e] rounded-lg p-3 ${index > 0 ? "ml-3" : ""} min-w-[120px]`}
                      >
                        <Text className="text-white font-Poppins_500Medium text-center text-xs">
                          {formatSetDisplay(set)}
                        </Text>
                        <Text className="text-[#6F2DBD] text-xs text-center mt-1">
                          RPE {set.rpe}
                        </Text>
                        <Text className="text-gray-500 text-xs text-center mt-1">
                          {formatTimestamp(set.timestamp)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
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

      {/* Set Logging Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1c1c1e] rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-Poppins_600SemiBold">
                Log Set
              </Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Dynamic Fields Based on Exercise Type */}
            {requiredFields.needsReps && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                  Reps *
                </Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  placeholder="Enter number of reps"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  className="bg-[#2c2c2e] rounded-xl p-4 text-white font-Poppins_400Regular"
                />
              </View>
            )}

            {requiredFields.needsWeight && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                  Weight (kg) *
                </Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Enter weight in kg"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  className="bg-[#2c2c2e] rounded-xl p-4 text-white font-Poppins_400Regular"
                />
              </View>
            )}

            {requiredFields.needsDuration && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                  Duration (seconds) *
                </Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Enter duration in seconds"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  className="bg-[#2c2c2e] rounded-xl p-4 text-white font-Poppins_400Regular"
                />
              </View>
            )}

            {requiredFields.needsDistance && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                  Distance (meters) *
                </Text>
                <TextInput
                  value={distance}
                  onChangeText={setDistance}
                  placeholder="Enter distance in meters"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  className="bg-[#2c2c2e] rounded-xl p-4 text-white font-Poppins_400Regular"
                />
              </View>
            )}

            {/* RPE Field - Always Required */}
            <View className="mb-4">
              <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                RPE (Rate of Perceived Exertion) *
              </Text>
              <Text className="text-gray-400 text-xs font-Poppins_400Regular mb-2">
                Scale 1-10: How hard did this feel? (1 = Very Easy, 10 = Maximum
                Effort)
              </Text>
              <TextInput
                value={rpe}
                onChangeText={setRpe}
                placeholder="Enter RPE (1-10)"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={2}
                className="bg-[#2c2c2e] rounded-xl p-4 text-white font-Poppins_400Regular"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowLogModal(false)}
                className="flex-1 bg-[#2c2c2e] rounded-xl p-4"
              >
                <Text className="text-gray-300 font-Poppins_500Medium text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogSet}
                className="flex-1 bg-[#6F2DBD] rounded-xl p-4"
              >
                <Text className="text-white font-Poppins_600SemiBold text-center">
                  Log Set
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
