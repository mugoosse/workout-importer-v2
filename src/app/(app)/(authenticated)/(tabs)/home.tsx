import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { WeeklyProgressCard } from "@/components/WeeklyProgressCard";
import {
  exerciseLogSummariesAtom,
  type ExerciseLogSummary,
} from "@/store/exerciseLog";

// Component to display individual exercise log item with exercise name
const ExerciseLogItem = ({
  summary,
  formatLastLoggedDate,
}: {
  summary: ExerciseLogSummary;
  formatLastLoggedDate: (date: string) => string;
}) => {
  const exercise = useQuery(api.exercises.get, {
    exerciseId: summary.exerciseId,
  });

  const cleanExerciseTitle = (title: string) => {
    // Remove equipment suffix pattern " (Equipment Name)"
    return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  };

  if (!exercise) {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/(app)/(authenticated)/(modal)/exercise/${summary.exerciseId}`,
          )
        }
        className="bg-[#2c2c2e] rounded-xl p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-Poppins_600SemiBold text-base">
              Loading exercise...
            </Text>
            <View className="flex-row items-center gap-3 mt-2">
              <View className="bg-[#6F2DBD] rounded-full px-3 py-1">
                <Text className="text-white text-xs font-Poppins_500Medium">
                  {summary.totalSets} sets
                </Text>
              </View>
              <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                {formatLastLoggedDate(summary.lastLoggedDate)}
              </Text>
            </View>
          </View>
          <View className="bg-[#1c1c1e] w-8 h-8 rounded-lg items-center justify-center">
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/(app)/(authenticated)/(modal)/exercise/${summary.exerciseId}`,
        )
      }
      className="bg-[#2c2c2e] rounded-xl p-4 mb-3 last:mb-0"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white font-Poppins_600SemiBold text-base">
            {cleanExerciseTitle(exercise.title)}
          </Text>
          <View className="flex-row items-center gap-3 mt-2">
            <View className="bg-[#6F2DBD] rounded-full px-3 py-1">
              <Text className="text-white text-xs font-Poppins_500Medium">
                {summary.totalSets} sets
              </Text>
            </View>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {formatLastLoggedDate(summary.lastLoggedDate)}
            </Text>
          </View>
        </View>
        <View className="bg-[#1c1c1e] w-8 h-8 rounded-lg items-center justify-center">
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Page = () => {
  const muscles = useQuery(api.muscles.list);
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);

  const formatLastLoggedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (muscles === undefined) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg font-Poppins_500Medium">
          Loading muscles...
        </Text>
      </View>
    );
  }

  if (!muscles.length) {
    return (
      <View className="flex-1 bg-dark items-center justify-center p-4">
        <View className="items-center">
          <Ionicons name="film-outline" size={48} color="#6c6c6c" />
          <Text className="text-white text-xl font-Poppins_600SemiBold mt-4 text-center">
            No muscle yet
          </Text>
          <Text className="text-gray-400 text-base font-Poppins_400Regular mt-2 text-center">
            Please import the data first
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark">
      <View className="pt-6">
        <WeeklyProgressCard />
      </View>

      {/* Logged Exercises Section */}
      {exerciseLogSummaries.length > 0 && (
        <View className="mx-4 mb-6 mt-8">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
              Recent Exercise Logs
            </Text>

            {exerciseLogSummaries.slice(0, 6).map((summary, index) => (
              <View key={summary.exerciseId} className={index > 0 ? "mt-4" : ""}>
                <ExerciseLogItem
                  summary={summary}
                  formatLastLoggedDate={formatLastLoggedDate}
                />
              </View>
            ))}

            {exerciseLogSummaries.length > 6 && (
              <TouchableOpacity className="mt-2 p-2">
                <Text className="text-[#6F2DBD] text-center font-Poppins_500Medium">
                  View All ({exerciseLogSummaries.length} exercises)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default Page;
