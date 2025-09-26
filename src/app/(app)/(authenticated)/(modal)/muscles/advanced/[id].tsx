import {
  ExerciseRoleCards,
  MuscleBodyVisualization,
  MuscleInfoCard,
  MuscleProgressCard,
} from "@/components/muscle";
import { type MuscleId } from "@/components/muscle-body/MuscleBody";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/hooks/cache";
import { getProgressColor, svgIdProgressAtom } from "@/store/weeklyProgress";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useLayoutEffect } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [svgIdProgress] = useAtom(svgIdProgressAtom);

  const { data: muscle } = useCachedQuery(api.muscles.get, {
    muscleId: id as Id<"muscles">,
  });

  const { data: exerciseCounts } = useCachedQuery(
    api.muscles.getExerciseCounts,
    {
      muscleId: id as Id<"muscles">,
    },
  );

  // Set the title dynamically when muscle data loads
  useLayoutEffect(() => {
    if (muscle?.name) {
      navigation.setOptions({
        title: muscle.name,
      });
    }
  }, [navigation, muscle?.name]);

  if (!muscle || !exerciseCounts) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Get muscle progress and color
  const muscleProgressData = svgIdProgress[muscle.svgId];
  const progressPercentage = muscleProgressData?.percentage || 0;
  const progressColor = getProgressColor(progressPercentage, true);
  const muscleColor = progressColor;

  return (
    <View className="flex-1 bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Muscle Group Tags and Info */}
        <MuscleInfoCard
          muscle={muscle}
          showAnatomicalGroup={true}
          showMajorGroup={true}
          showGroup={true}
          variant="advanced"
        />

        {/* Body Visualization Card */}
        <MuscleBodyVisualization
          highlightedMuscles={[
            { muscleId: muscle.svgId as MuscleId, color: muscleColor },
          ]}
          size="large"
          view="both"
          title="Muscle Location"
        />

        {/* Muscle Progress Card */}
        <View className="px-4">
          <MuscleProgressCard
            muscleId={muscle._id}
            svgId={muscle.svgId}
            showRecentWorkouts={true}
            maxWorkouts={6}
            variant="full"
          />

          {/* Function & Exercises Card */}
          <ExerciseRoleCards
            muscleId={muscle._id}
            exerciseCounts={exerciseCounts}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
