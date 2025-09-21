import { Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { Badge } from "@/components/ui/Badge";
import { TopCreateOption } from "@/components/TopCreateOption";
import { type MajorMuscleGroup } from "@/utils/muscleMapping";
import {
  weeklyProgressAtom,
  getProgressColor,
  getStreakEmoji,
} from "@/store/weeklyProgress";

const Page = () => {
  const { group } = useLocalSearchParams<{ group: string }>();
  const majorGroup = group as MajorMuscleGroup;
  const [weeklyProgress] = useAtom(weeklyProgressAtom);

  const muscleGroupData = weeklyProgress.find(
    (item) => item.majorGroup === majorGroup,
  );

  if (!muscleGroupData) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg">Muscle group not found</Text>
      </View>
    );
  }

  const progressColor = getProgressColor(muscleGroupData.percentage);

  const handleSuggestExercises = () => {
    router.push(
      `/(app)/(authenticated)/(modal)/exercises?majorGroups=${majorGroup}&muscleFunctions=target`,
    );
  };

  const handleShowBreakdown = () => {
    router.push(
      `/(app)/(authenticated)/(modal)/muscle-group/${majorGroup}/breakdown`,
    );
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-4">
      <View className="flex-1 p-4 rounded-2xl">
        {/* Progress Section - Compact */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-2xl font-Poppins_600SemiBold capitalize">
              {majorGroup}
            </Text>
            <Badge variant="outline">
              <Text className="text-white">
                {getStreakEmoji(muscleGroupData.streak)}{" "}
                {muscleGroupData.streak} weeks
              </Text>
            </Badge>
          </View>

          <View className="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, muscleGroupData.percentage)}%`,
                backgroundColor: progressColor,
              }}
            />
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {muscleGroupData.percentage}% of weekly goal
            </Text>
            {muscleGroupData.percentage >= 100 && (
              <Text className="text-emerald-500 text-sm font-Poppins_500Medium">
                Goal Met! 🎯
              </Text>
            )}
          </View>

          <Text className="text-gray-400 text-center text-sm font-Poppins_400Regular">
            {muscleGroupData.xp} / {muscleGroupData.nextLevel} XP
          </Text>
        </View>

        {/* Action Options */}
        <View className="flex-row gap-3 mb-3">
          <TopCreateOption
            icon={<Ionicons name="fitness-outline" size={24} color="white" />}
            title="Suggest Exercises"
            subtitle={`For ${majorGroup}`}
            onPress={handleSuggestExercises}
          />
          <TopCreateOption
            icon={<Ionicons name="analytics-outline" size={24} color="white" />}
            title="Show Breakdown"
            subtitle="Individual muscles"
            onPress={handleShowBreakdown}
          />
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={handleClose}
          className="w-full py-4 mb-8 bg-zinc-800 rounded-2xl"
        >
          <Text className="text-center text-lg text-gray-400 font-Poppins_600SemiBold">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Page;
