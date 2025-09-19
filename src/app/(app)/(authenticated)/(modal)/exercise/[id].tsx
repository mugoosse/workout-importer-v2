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
} from "@/store/weeklyProgress";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
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
  const [individualMuscleProgress] = useAtom(individualMuscleProgressAtom);

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

  const legendItems = [
    { color: MUSCLE_ROLE_COLORS.target, label: "target" },
    { color: MUSCLE_ROLE_COLORS.synergist, label: "synergist" },
    { color: MUSCLE_ROLE_COLORS.stabilizer, label: "stabilizer" },
    { color: MUSCLE_ROLE_COLORS.lengthening, label: "lengthening" },
  ];

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

            {/* Legend */}
            <View className="flex-row justify-center">
              <View className="flex-row flex-wrap gap-3">
                {legendItems.map((item) => (
                  <View key={item.label} className="flex-row items-center">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
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
          {(Object.keys(musclesByRole) as MuscleRole[]).map((role) => {
            const muscles = musclesByRole[role];
            if (!muscles || muscles.length === 0) return null;

            // Filter muscles if one is selected
            const displayMuscles = selectedMuscleId
              ? muscles.filter((muscle) => muscle.svgId === selectedMuscleId)
              : muscles;

            if (displayMuscles.length === 0) return null;

            return (
              <View key={role} className="mb-8">
                <View className="flex-row items-center mb-2">
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
                </View>

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
                                  {muscleProgress.xp} / {muscleProgress.goal} XP
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
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
