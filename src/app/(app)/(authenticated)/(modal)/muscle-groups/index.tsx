import { MuscleBody } from "@/components/muscle-body/MuscleBody";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import { getProgressColor, weeklyProgressAtom } from "@/store/weeklyProgress";
import {
  generateMuscleHighlights,
  getOptimalViewForMuscleGroup,
} from "@/utils/muscleBodyUtils";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { Link } from "expo-router";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

const getMuscleGroupDisplayName = (majorGroup: string) => {
  const names: Record<string, string> = {
    chest: "Chest",
    back: "Back",
    legs: "Legs",
    shoulders: "Shoulders",
    arms: "Arms",
    core: "Core",
  };
  return names[majorGroup] || majorGroup;
};

const Page = () => {
  // Get all muscle groups with exercise counts and muscles data
  const { data: muscleGroups } = useCachedQuery(
    api.exercises.getMuscleGroupsWithCounts,
    {},
  );
  const { data: muscles } = useCachedQuery(api.muscles.list, {});
  const [weeklyProgress] = useAtom(weeklyProgressAtom);

  // Sort muscle groups by exercise count (descending)
  const sortedMuscleGroups = useMemo(() => {
    if (!muscleGroups) return [];
    return [...muscleGroups].sort((a, b) => b.exerciseCount - a.exerciseCount);
  }, [muscleGroups]);

  // Calculate progress data for each muscle group
  const muscleGroupsWithProgress = useMemo(() => {
    if (!sortedMuscleGroups || !weeklyProgress) return [];

    return sortedMuscleGroups.map((group) => {
      const groupProgress = weeklyProgress.find(
        (progress) => progress.majorGroup === group.majorGroup,
      );

      return {
        ...group,
        xp: groupProgress?.xp || 0,
        percentage: groupProgress?.percentage || 0,
      };
    });
  }, [sortedMuscleGroups, weeklyProgress]);

  if (!muscleGroups || !muscles) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      {/* Header */}
      <View className="px-4 pt-4 pb-4">
        <Text className="text-white text-xl font-Poppins_600SemiBold">
          Browse by Muscle Groups
        </Text>
        <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
          Find exercises targeting specific muscle groups
        </Text>
      </View>

      {/* Muscle Groups List */}
      <View className="px-4" style={{ flex: 1 }}>
        {muscleGroupsWithProgress.length === 0 ? (
          <View className="bg-[#1c1c1e] rounded-2xl p-6 items-center">
            <Ionicons name="body-outline" size={48} color="#666" />
            <Text className="text-white text-lg font-Poppins_600SemiBold mt-4 mb-2">
              No muscle groups found
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
              No exercises with muscle data available.
            </Text>
          </View>
        ) : (
          <LegendList
            data={muscleGroupsWithProgress}
            keyExtractor={(item) => item.majorGroup}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: muscleGroup, index }) => {
              const highlightedMuscles = generateMuscleHighlights(
                muscles,
                weeklyProgress,
                muscleGroup.majorGroup,
              );
              const progressColor = getProgressColor(muscleGroup.percentage);

              return (
                <View className={index > 0 ? "mt-3" : ""}>
                  <Link
                    href={{
                      pathname: "/(app)/(authenticated)/(modal)/exercises",
                      params: { majorGroups: muscleGroup.majorGroup },
                    }}
                    asChild
                  >
                    <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                      <View className="flex-row items-center">
                        {/* MuscleBody Thumbnail */}
                        <View className="ml-3 mr-5 items-center">
                          <View className="w-16 h-16 items-center justify-center">
                            <MuscleBody
                              view={getOptimalViewForMuscleGroup(
                                muscleGroup.majorGroup,
                              )}
                              highlightedMuscles={highlightedMuscles}
                              width={75}
                              height={75}
                            />
                          </View>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1 mr-3">
                              <Text className="text-white text-xl font-Poppins_600SemiBold">
                                {getMuscleGroupDisplayName(
                                  muscleGroup.majorGroup,
                                )}
                              </Text>
                              <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                {muscleGroup.exerciseCount} exercise
                                {muscleGroup.exerciseCount !== 1 ? "s" : ""}
                              </Text>
                            </View>

                            <View className="bg-[#2c2c2e] w-8 h-8 rounded-lg items-center justify-center">
                              <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#fff"
                              />
                            </View>
                          </View>

                          {/* Weekly Progress Bar */}
                          <View className="mb-2">
                            <View className="bg-gray-700 rounded-full h-2 overflow-hidden">
                              <View
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, muscleGroup.percentage)}%`,
                                  backgroundColor: progressColor,
                                }}
                              />
                            </View>
                            <View className="flex-row justify-between items-center mt-1">
                              <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                                {muscleGroup.percentage}% weekly progress
                              </Text>
                              {muscleGroup.xp > 0 && (
                                <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
                                  {muscleGroup.xp} XP
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

export default Page;
