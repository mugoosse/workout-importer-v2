import {
  ExerciseRoleCards,
  FilteredMuscleLibrary,
  MuscleBodyVisualization,
} from "@/components/muscle";
import { GroupRecentWorkouts } from "@/components/muscle/GroupRecentWorkouts";
import {
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import {
  getMuscleProgress,
  getProgressColor,
  groupProgressAtom,
  svgIdProgressAtom,
} from "@/store/weeklyProgress";
import { formatMuscleName } from "@/utils/muscleBodyUtils";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Page = () => {
  const { group } = useLocalSearchParams<{ group: string }>();
  const navigation = useNavigation();
  const { data: muscles } = useCachedQuery(api.muscles.list, {});
  const { data: exerciseCountsData } = useCachedQuery(
    api.muscles.getAllExerciseCounts,
    {},
  );

  // Get correct exercise counts for the group
  const { data: groupExerciseCounts } = useCachedQuery(
    api.exercises.getGroupExerciseCounts,
    group ? { group } : { group: "" },
  );
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [svgIdProgress] = useAtom(svgIdProgressAtom);
  const [groupProgress] = useAtom(groupProgressAtom);

  const muscleGroupData = groupProgress.find((item) => item.group === group);

  const progressColor = getProgressColor(
    muscleGroupData?.percentage || 0,
    true,
  );

  // Set the title dynamically based on group
  useLayoutEffect(() => {
    if (group) {
      navigation.setOptions({
        title: formatMuscleName(group),
      });
    }
  }, [navigation, group]);

  if (!muscles || !exerciseCountsData) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Filter muscles by group
  const filteredMuscles = muscles.filter((muscle) => muscle.group === group);

  // Get the major group for navigation (all muscles in the same group share the same majorGroup)
  const majorGroup = filteredMuscles[0]?.majorGroup;

  // Filter muscles for display based on selection
  const displayMuscles = selectedMuscleId
    ? filteredMuscles.filter((muscle) => muscle.svgId === selectedMuscleId)
    : filteredMuscles;

  // Create highlighted muscles for visualization
  const highlightedMuscles: MuscleColorPair[] = [];

  // Group muscles by svgId to handle cases where multiple muscles share the same visual representation
  const musclesBySvgId = new Map<string, typeof filteredMuscles>();
  filteredMuscles.forEach((muscle) => {
    if (!musclesBySvgId.has(muscle.svgId)) {
      musclesBySvgId.set(muscle.svgId, []);
    }
    musclesBySvgId.get(muscle.svgId)!.push(muscle);
  });

  musclesBySvgId.forEach((muscles, svgId) => {
    // If a muscle is selected, only highlight that one
    if (selectedMuscleId && svgId !== selectedMuscleId) {
      return;
    }

    // Calculate aggregate data for all muscles sharing this svgId
    let totalProgress = 0;
    let musclesWithExercises = 0;
    let hasAnyExercises = false;

    muscles.forEach((muscle) => {
      const exerciseCounts = exerciseCountsData[muscle._id];
      const muscleHasExercises = exerciseCounts?.hasAnyExercises ?? false;

      if (muscleHasExercises) {
        hasAnyExercises = true;
        const muscleProgress = getMuscleProgress(
          muscle.svgId,
          svgIdProgress,
          true,
        );
        totalProgress += muscleProgress.percentage;
        musclesWithExercises++;
      }
    });

    // Calculate average progress for muscles with exercises
    const averageProgress =
      musclesWithExercises > 0 ? totalProgress / musclesWithExercises : 0;

    let color: string;
    if (selectedMuscleId === svgId) {
      // When filtered, show the original progress color (not bright purple)
      color = hasAnyExercises
        ? getProgressColor(averageProgress, true)
        : "#404040";
    } else if (selectedMuscleId) {
      // Don't show other muscles when filtered
      return;
    } else {
      // Normal state - show progress color or gray for muscles without exercises
      color = hasAnyExercises
        ? getProgressColor(averageProgress, true)
        : "#404040";
    }

    highlightedMuscles.push({
      muscleId: svgId as MuscleId,
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

  // Use the correct deduplicated exercise counts for the group
  const aggregateExerciseCounts = groupExerciseCounts || {
    target: 0,
    synergist: 0,
    stabilizer: 0,
    lengthening: 0,
  };

  return (
    <View className="flex-1 bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Parent Tag */}
        {majorGroup && (
          <View className="mx-4 mt-4 mb-2">
            <View className="flex-row">
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/muscles/basic/${majorGroup}`,
                  )
                }
              >
                <Badge variant="outline">
                  <Text className="text-white text-sm capitalize">
                    {majorGroup}
                  </Text>
                </Badge>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mt-4">
          {/* Muscle Body Visualization */}
          <MuscleBodyVisualization
            highlightedMuscles={highlightedMuscles}
            size="medium"
            view="both"
            onMusclePress={handleMusclePress}
            footerText="Click on colored parts to see underlying muscles"
            interactive={true}
          />
        </View>

        {/* Progress and Recent Workouts - Show when no muscle is selected */}
        {!selectedMuscleId && (
          <View className="px-4">
            <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
              <View className="flex-row items-center mb-4">
                <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <Ionicons name="trending-up" size={20} color="#6F2DBD" />
                </View>
                <Text className="text-white text-lg font-Poppins_600SemiBold flex-1">
                  Progress Tracking
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/xp-info")}
                  className="ml-2"
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#6F2DBD"
                  />
                </TouchableOpacity>
              </View>

              <View className="bg-[#2c2c2e] rounded-xl p-4">
                {/* XP Progress Bar */}
                <View className="mb-2">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-Poppins_500Medium">
                      XP Progress
                    </Text>
                    <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                      {muscleGroupData?.xp || 0} / {muscleGroupData?.nextLevel}{" "}
                      XP
                    </Text>
                  </View>

                  <View className="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, muscleGroupData?.percentage || 0)}%`,
                        backgroundColor: progressColor,
                      }}
                    />
                  </View>
                  <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                    {muscleGroupData?.percentage || 0}% complete
                  </Text>
                </View>
              </View>
            </View>

            {/* Exercise Role Cards for Group */}
            <ExerciseRoleCards
              muscleId={group || ""}
              exerciseCounts={aggregateExerciseCounts}
              onRolePress={(role) =>
                router.push(
                  `/(app)/(authenticated)/(modal)/exercises?groups=${group}&muscleFunctions=${role}`,
                )
              }
            />

            {/* Recent Workouts Section */}
            <GroupRecentWorkouts group={group || ""} maxWorkouts={6} />
          </View>
        )}

        {selectedMuscleId && (
          <FilteredMuscleLibrary
            selectedMuscleId={selectedMuscleId}
            muscles={displayMuscles}
            exerciseCountsData={exerciseCountsData || {}}
            onClearFilter={() => setSelectedMuscleId(null)}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default Page;
