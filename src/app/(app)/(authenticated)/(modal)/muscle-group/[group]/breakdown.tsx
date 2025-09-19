import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type MajorMuscleGroup } from "@/utils/muscleMapping";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Link, Stack, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAtom } from "jotai";
import {
  individualMuscleProgressAtom,
  getProgressColor,
  getStreakEmoji,
} from "@/store/weeklyProgress";

const formatMuscleName = (svgId: string): string => {
  return svgId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(" And ", " and ");
};

const Page = () => {
  const { group } = useLocalSearchParams<{ group: string }>();
  const majorGroup = group as MajorMuscleGroup;
  const muscles = useQuery(api.muscles.list);
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [individualMuscleProgress] = useAtom(individualMuscleProgressAtom);

  if (!muscles) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Filter muscles by major group
  const filteredMuscles = muscles.filter(
    (muscle) => muscle.majorGroup === majorGroup,
  );

  // Filter muscles for display based on selection
  const displayMuscles = selectedMuscleId
    ? filteredMuscles.filter((muscle) => muscle.svgId === selectedMuscleId)
    : filteredMuscles;

  // Create highlighted muscles for visualization
  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  filteredMuscles.forEach((muscle) => {
    if (seenMuscleIds.has(muscle.svgId)) {
      return;
    }
    seenMuscleIds.add(muscle.svgId);

    // If a muscle is selected, only highlight that one
    if (selectedMuscleId && muscle.svgId !== selectedMuscleId) {
      return;
    }

    const muscleProgress = individualMuscleProgress[muscle.svgId];
    const progress = muscleProgress?.percentage || 0;

    let color: string;
    if (selectedMuscleId === muscle.svgId) {
      // When filtered, show the original progress color (not bright purple)
      color = getProgressColor(progress);
    } else if (selectedMuscleId) {
      // Don't show other muscles when filtered
      return;
    } else {
      // Normal state - show progress color
      color = getProgressColor(progress);
    }

    highlightedMuscles.push({
      muscleId: muscle.svgId,
      color,
    });
  });

  const handleMusclePress = (muscleId: MuscleId) => {
    if (selectedMuscleId === muscleId) {
      // Clear filter if tapping the same muscle
      setSelectedMuscleId(null);
    } else {
      // Set new filter
      setSelectedMuscleId(muscleId);
    }
  };

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: `${majorGroup.charAt(0).toUpperCase() + majorGroup.slice(1)}: Muscle Breakdown`,
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
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Muscle Body Visualization */}
        <View className="mx-4 mt-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="items-center">
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

        {/* Muscle Library */}
        <View className="px-4">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
            Muscles
          </Text>

          <View>
            {displayMuscles.map((muscle, index) => {
              const muscleProgress = individualMuscleProgress[muscle.svgId] || {
                xp: 0,
                goal: 500,
                percentage: 0,
                streak: 0,
                sets: 0,
              };
              const progressColor = getProgressColor(muscleProgress.percentage);

              return (
                <View key={muscle._id} className={index > 0 ? "mt-4" : ""}>
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
      </ScrollView>
    </View>
  );
};

export default Page;
