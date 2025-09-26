import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/hooks/cache";
import { cleanExerciseTitle } from "@/utils/exerciseUtils";
import { getRoleColor, getRoleDisplayName } from "@/utils/muscleRoles";
import {
  formatLastLoggedDate,
  useAggregateRecentWorkouts,
} from "@/utils/workoutAggregation";
import { type MuscleRole } from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

// Component to display workout item
const WorkoutLogItem = ({
  exerciseId,
  setsCount,
  lastLoggedDate,
  muscleRole,
  xpEarned,
  notes,
  prCount,
}: {
  exerciseId: string;
  setsCount: number;
  lastLoggedDate: string;
  muscleRole: MuscleRole;
  xpEarned: number;
  notes?: string;
  prCount?: number;
}) => {
  const { data: exercise } = useCachedQuery(api.exercises.get, {
    exerciseId: exerciseId as Id<"exercises">,
  });

  if (!exercise) {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push(`/(app)/(authenticated)/(modal)/exercise/${exerciseId}`)
        }
        className="bg-[#2c2c2e] rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-Poppins_600SemiBold text-base">
              Loading exercise...
            </Text>
            <View className="flex-row items-center gap-3 mt-2">
              <View className="bg-[#6F2DBD] rounded-full px-3 py-1">
                <Text className="text-white text-xs font-Poppins_500Medium">
                  {setsCount} sets
                </Text>
              </View>
              <View
                className="rounded-full px-2 py-1"
                style={{ backgroundColor: getRoleColor(muscleRole) }}
              >
                <Text className="text-white text-xs font-Poppins_500Medium">
                  {getRoleDisplayName(muscleRole)}
                </Text>
              </View>
              {prCount && prCount > 0 && (
                <View className="bg-[#FFD700] rounded-full px-2 py-1">
                  <Text className="text-black text-xs font-Poppins_500Medium">
                    {prCount} PR{prCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
              <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                {formatLastLoggedDate(lastLoggedDate)}
              </Text>
            </View>
            {notes && (
              <View className="mt-2 bg-[#1c1c1e] rounded-lg p-2">
                <Text className="text-gray-300 text-sm font-Poppins_400Regular italic">
                  {notes}
                </Text>
              </View>
            )}
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
        router.push(`/(app)/(authenticated)/(modal)/exercise/${exerciseId}`)
      }
      className="bg-[#2c2c2e] rounded-xl p-4 mb-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white font-Poppins_600SemiBold text-base">
            {cleanExerciseTitle(exercise.title)}
          </Text>
          <View className="flex-row items-center gap-3 mt-2">
            <View className="bg-[#6F2DBD] rounded-full px-3 py-1">
              <Text className="text-white text-xs font-Poppins_500Medium">
                {setsCount} sets
              </Text>
            </View>
            <View
              className="rounded-full px-2 py-1"
              style={{ backgroundColor: getRoleColor(muscleRole) }}
            >
              <Text className="text-white text-xs font-Poppins_500Medium">
                {getRoleDisplayName(muscleRole)}
              </Text>
            </View>
            {prCount && prCount > 0 && (
              <View className="bg-[#FFD700] rounded-full px-2 py-1">
                <Text className="text-black text-xs font-Poppins_500Medium">
                  {prCount} PR{prCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
            <View className="bg-[#1c1c1e] rounded-full px-2 py-1">
              <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
                +{xpEarned} XP
              </Text>
            </View>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {formatLastLoggedDate(lastLoggedDate)}
            </Text>
          </View>
          {notes && (
            <View className="mt-2 bg-[#1c1c1e] rounded-lg p-2">
              <Text className="text-gray-300 text-sm font-Poppins_400Regular italic">
                {notes}
              </Text>
            </View>
          )}
        </View>
        <View className="bg-[#1c1c1e] w-8 h-8 rounded-lg items-center justify-center">
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface WorkoutLogListProps {
  muscleId: string;
  svgId: string;
  limit?: number;
  showPagination?: boolean;
  title?: string;
}

export const WorkoutLogList = ({
  muscleId,
  svgId,
  limit = 6,
  showPagination = false,
  title = "Recent Workouts",
}: WorkoutLogListProps) => {
  const { data: muscle } = useCachedQuery(api.muscles.get, {
    muscleId: muscleId as Id<"muscles">,
  });

  const recentWorkouts = useAggregateRecentWorkouts(muscle, limit);

  if (!muscle) {
    return (
      <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (recentWorkouts.length === 0) {
    return (
      <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
        <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-3">
          {title}
        </Text>
        <View className="bg-[#2c2c2e] rounded-xl p-4 items-center">
          <Ionicons name="barbell-outline" size={24} color="#666" />
          <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-2">
            No recent workouts
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
      <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-3">
        {title}
      </Text>
      <View>
        {recentWorkouts.map((workout) => (
          <WorkoutLogItem
            key={workout.exerciseId}
            exerciseId={workout.exerciseId}
            setsCount={workout.setsCount}
            lastLoggedDate={workout.lastLoggedDate}
            muscleRole={workout.muscleRole}
            xpEarned={workout.totalXP}
            notes={workout.notes}
            prCount={workout.prCount}
          />
        ))}
      </View>
      {showPagination && (
        <TouchableOpacity className="bg-[#2c2c2e] rounded-xl p-3 mt-2 items-center">
          <Text className="text-[#6F2DBD] font-Poppins_500Medium">
            Show More Workouts
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
