import {
  groupThumbnails,
  majorGroupThumbnails,
  svgIdThumbnails,
} from "@/assets/images/thumbnails";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import { getProgressColor, weeklyProgressAtom } from "@/store/weeklyProgress";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { Link } from "expo-router";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DetailLevel = "basic" | "intermediate" | "advanced";

const DetailButton = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-xl ${
      isActive ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
    }`}
  >
    <Text
      className={`text-sm font-Poppins_500Medium ${
        isActive ? "text-white" : "text-gray-400"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const Page = () => {
  // State for detail level
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("basic");

  // Get all muscle data for all detail levels at once for instant switching
  const { data: allMuscleData } = useCachedQuery(
    api.exercises.getAllMusclesWithCountsByAllDetailLevels,
    {}
  );
  const { data: muscles } = useCachedQuery(api.muscles.list, {});
  const [weeklyProgress] = useAtom(weeklyProgressAtom);

  // Get current detail level data and calculate progress
  const muscleItemsWithProgress = useMemo(() => {
    if (!allMuscleData || !weeklyProgress) return [];

    // Select data based on current detail level
    const muscleItems = allMuscleData[detailLevel];
    if (!muscleItems) return [];

    return muscleItems.map((item) => {
      let xp = 0;
      let percentage = 0;

      if (item.type === "majorGroup") {
        const groupProgress = weeklyProgress.find(
          (progress) => progress.majorGroup === item.id
        );
        xp = groupProgress?.xp || 0;
        percentage = groupProgress?.percentage || 0;
      } else {
        // For intermediate and advanced, calculate based on majorGroup
        const groupProgress = weeklyProgress.find(
          (progress) => progress.majorGroup === item.majorGroup
        );
        // Scale down XP for more specific groupings
        const scaleFactor = item.type === "group" ? 0.6 : 0.3;
        xp = Math.round((groupProgress?.xp || 0) * scaleFactor);
        percentage = Math.round((groupProgress?.percentage || 0) * scaleFactor);
      }

      return {
        ...item,
        xp,
        percentage,
      };
    });
  }, [allMuscleData, detailLevel, weeklyProgress]);

  if (!allMuscleData || !muscles) {
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
        {/* Detail Level Filter */}
        <View className="mt-0">
          <Text className="text-white text-sm font-Poppins_500Medium mb-3">
            Detail Level
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <DetailButton
              label="Basic"
              isActive={detailLevel === "basic"}
              onPress={() => setDetailLevel("basic")}
            />
            <DetailButton
              label="Intermediate"
              isActive={detailLevel === "intermediate"}
              onPress={() => setDetailLevel("intermediate")}
            />
            <DetailButton
              label="Advanced"
              isActive={detailLevel === "advanced"}
              onPress={() => setDetailLevel("advanced")}
            />
          </ScrollView>
        </View>
      </View>

      {/* Muscle Items List */}
      <View className="px-4" style={{ flex: 1 }}>
        {muscleItemsWithProgress.length === 0 ? (
          <View className="bg-[#1c1c1e] rounded-2xl p-6 items-center">
            <Ionicons name="body-outline" size={48} color="#666" />
            <Text className="text-white text-lg font-Poppins_600SemiBold mt-4 mb-2">
              No muscles found
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
              No exercises with muscle data available for this detail level.
            </Text>
          </View>
        ) : (
          <LegendList
            data={muscleItemsWithProgress}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: muscleItem, index }) => {
              const progressColor = getProgressColor(muscleItem.percentage);

              // Get thumbnail based on detail level
              const getThumbnail = () => {
                if (muscleItem.type === "majorGroup") {
                  return majorGroupThumbnails[muscleItem.id];
                } else if (muscleItem.type === "group") {
                  return groupThumbnails[muscleItem.id];
                } else {
                  // For advanced (individual muscles), use the first muscle's svgId
                  const muscle = muscles?.find(
                    (m) => m._id === muscleItem.muscleIds[0]
                  );
                  return muscle?.svgId ? svgIdThumbnails[muscle.svgId] : null;
                }
              };

              // Determine link params based on type
              const getLinkParams = () => {
                const baseParams = { muscleFunctions: "target" };
                if (muscleItem.type === "majorGroup") {
                  return { ...baseParams, majorGroups: muscleItem.id };
                } else if (muscleItem.type === "group") {
                  return { ...baseParams, groups: muscleItem.id };
                } else {
                  return { ...baseParams, muscleIds: muscleItem.id };
                }
              };

              return (
                <View className={index > 0 ? "mt-3" : ""}>
                  <Link
                    href={{
                      pathname: "/(app)/(authenticated)/(modal)/exercises",
                      params: getLinkParams(),
                    }}
                    asChild
                  >
                    <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                      <View className="flex-row items-center">
                        {/* Thumbnail Image */}
                        <View className="mr-4 rounded-lg overflow-hidden shadow-lg">
                          {getThumbnail() ? (
                            <Image
                              source={getThumbnail()}
                              className="w-16 h-20"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-16 h-20 bg-[#2c2c2e] items-center justify-center">
                              <Ionicons
                                name="body-outline"
                                size={24}
                                color="#666"
                              />
                            </View>
                          )}
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1 mr-3">
                              <Text className="text-white text-xl font-Poppins_600SemiBold">
                                {muscleItem.name}
                              </Text>
                              <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                {muscleItem.exerciseCount} exercise
                                {muscleItem.exerciseCount !== 1 ? "s" : ""}
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
                                  width: `${Math.min(100, muscleItem.percentage)}%`,
                                  backgroundColor: progressColor,
                                }}
                              />
                            </View>
                            <View className="flex-row justify-between items-center mt-1">
                              <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                                {muscleItem.percentage}% weekly progress
                              </Text>
                              {muscleItem.xp > 0 && (
                                <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
                                  {muscleItem.xp} XP
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
