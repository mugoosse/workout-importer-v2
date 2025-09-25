import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import {
  exerciseLogSummariesAtom,
  workoutSessionsAtom,
  type ExerciseLogSummary,
} from "@/store/exerciseLog";
import { formatTime, formatLastLoggedDate } from "@/utils/timeFormatters";
import {
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

const cleanExerciseTitle = (title: string) => {
  // Remove equipment suffix pattern " (Equipment Name)"
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

type SortOption = "recent" | "mostSets" | "mostWorkouts";
type SortDirection = "asc" | "desc";

const SortButton = ({
  label,
  sortKey,
  isActive,
  sortDirection,
  onPress,
}: {
  label: string;
  sortKey: SortOption;
  isActive: boolean;
  sortDirection: SortDirection;
  onPress: (sortKey: SortOption) => void;
}) => (
  <TouchableOpacity
    onPress={() => onPress(sortKey)}
    className={`px-4 py-2 rounded-xl ${
      isActive ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
    }`}
  >
    <View className="flex-row items-center gap-2">
      <Text
        className={`text-sm font-Poppins_500Medium ${
          isActive ? "text-white" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
      {isActive && (
        <Ionicons
          name={sortDirection === "desc" ? "arrow-down" : "arrow-up"}
          size={12}
          color="white"
        />
      )}
    </View>
  </TouchableOpacity>
);

const ExerciseRecentItem = ({ summary }: { summary: ExerciseLogSummary }) => {
  const [workoutSessions] = useAtom(workoutSessionsAtom);

  const { data: exercise } = useCachedQuery(api.exercises.get, {
    exerciseId: summary.exerciseId,
  });

  const { data: exerciseDetails } = useCachedQuery(
    api.exercises.getExerciseDetails,
    {
      exerciseId: summary.exerciseId,
    },
  );

  // Calculate workout count for this exercise
  const workoutCount = useMemo(() => {
    return workoutSessions.filter((session) =>
      session.exercises.includes(summary.exerciseId),
    ).length;
  }, [workoutSessions, summary.exerciseId]);

  // Calculate total XP earned from this exercise
  const totalXP = useMemo(() => {
    if (!exerciseDetails?.muscles) return 0;

    const muscleInvolvements = extractMuscleInvolvement(
      exerciseDetails.muscles,
    );
    const xpResult = calculateXPDistribution(muscleInvolvements, 8); // Default RPE 8
    return xpResult.totalXP * summary.totalSets; // XP per set * number of sets
  }, [exerciseDetails, summary.totalSets]);

  if (!exercise) {
    return (
      <View className="bg-[#1c1c1e] rounded-xl p-4 mb-3">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/(app)/(authenticated)/(modal)/exercise/${summary.exerciseId}`,
        )
      }
      className="bg-[#1c1c1e] rounded-xl p-4 mb-3"
    >
      {/* Exercise Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-white font-Poppins_600SemiBold text-base">
            {cleanExerciseTitle(exercise.title)}
          </Text>
          <Text className="text-gray-400 text-sm font-Poppins_400Regular">
            {formatLastLoggedDate(summary.lastLoggedDate)} •{" "}
            {formatTime(summary.lastLoggedTimestamp)}
          </Text>
        </View>

        <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </View>

      {/* Stats Row - Same style as WorkoutSessionCard */}
      <View className="flex-row items-center gap-3">
        <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs font-Poppins_500Medium">
            {summary.totalSets} sets
          </Text>
        </View>
        <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs font-Poppins_500Medium">
            {workoutCount} workout{workoutCount !== 1 ? "s" : ""}
          </Text>
        </View>
        {totalXP > 0 && (
          <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
            <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
              +{totalXP} XP
            </Text>
          </View>
        )}
      </View>

      {/* Notes if present */}
      {summary.notes && (
        <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-3">
          {summary.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const Page = () => {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);
  const [workoutSessions] = useAtom(workoutSessionsAtom);

  const handleSortPress = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      // Toggle direction if clicking the same sort
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      // Set new sort and default to descending
      setSortBy(newSortBy);
      setSortDirection("desc");
    }
  };

  // Sort exercises based on selected sort option and direction
  const sortedExercises = useMemo(() => {
    const exercisesWithWorkoutCounts = exerciseLogSummaries.map((summary) => ({
      ...summary,
      workoutCount: workoutSessions.filter((session) =>
        session.exercises.includes(summary.exerciseId),
      ).length,
    }));

    let sorted = [...exercisesWithWorkoutCounts];

    switch (sortBy) {
      case "recent":
        sorted = sorted.sort(
          (a, b) => b.lastLoggedTimestamp - a.lastLoggedTimestamp,
        );
        break;
      case "mostSets":
        sorted = sorted.sort((a, b) => b.totalSets - a.totalSets);
        break;
      case "mostWorkouts":
        sorted = sorted.sort((a, b) => b.workoutCount - a.workoutCount);
        break;
      default:
        break;
    }

    // Apply sort direction
    if (sortDirection === "asc") {
      sorted.reverse();
    }

    return sorted;
  }, [exerciseLogSummaries, workoutSessions, sortBy, sortDirection]);

  // Calculate totals for stats
  const totalExercises = exerciseLogSummaries.length;
  const totalSets = exerciseLogSummaries.reduce(
    (sum, summary) => sum + summary.totalSets,
    0,
  );
  const totalWorkouts = workoutSessions.length;

  return (
    <View className="flex-1 bg-dark">
      {/* Header */}
      <View className="px-4 pt-4 pb-4">
        <Text className="text-white text-xl font-Poppins_600SemiBold">
          Your Exercise History
        </Text>
        <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
          Review your performed exercises and progress
        </Text>

        {/* Stats Summary */}
        {totalExercises > 0 && (
          <View className="bg-[#1c1c1e] rounded-xl p-4 mt-4">
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-white text-2xl font-Poppins_700Bold">
                  {totalExercises}
                </Text>
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  Exercises
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-Poppins_700Bold">
                  {totalSets}
                </Text>
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  Sets
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-Poppins_700Bold">
                  {totalWorkouts}
                </Text>
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  Workouts
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sort Options */}
        {totalExercises > 0 && (
          <View className="mt-4">
            <Text className="text-white text-sm font-Poppins_500Medium mb-3">
              Sort by
            </Text>
            <View className="flex-row gap-2">
              <SortButton
                label="Most Recent"
                sortKey="recent"
                isActive={sortBy === "recent"}
                sortDirection={sortDirection}
                onPress={handleSortPress}
              />
              <SortButton
                label="Most Sets"
                sortKey="mostSets"
                isActive={sortBy === "mostSets"}
                sortDirection={sortDirection}
                onPress={handleSortPress}
              />
              <SortButton
                label="Most Workouts"
                sortKey="mostWorkouts"
                isActive={sortBy === "mostWorkouts"}
                sortDirection={sortDirection}
                onPress={handleSortPress}
              />
            </View>
          </View>
        )}
      </View>

      {/* Exercise List */}
      <View className="px-4" style={{ flex: 1 }}>
        {sortedExercises.length === 0 ? (
          <View className="bg-[#1c1c1e] rounded-2xl p-6 items-center">
            <Ionicons name="fitness-outline" size={48} color="#666" />
            <Text className="text-white text-lg font-Poppins_600SemiBold mt-4 mb-2">
              No exercises logged yet
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center mb-4">
              Start logging workouts to see your exercise history here.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push("/(app)/(authenticated)/(modal)/exercises")
              }
              className="bg-[#6F2DBD] px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-Poppins_600SemiBold">
                Browse Exercises
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LegendList
            data={sortedExercises}
            keyExtractor={(item) => item.exerciseId}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: summary, index }) => (
              <View className={index > 0 ? "mt-4" : ""}>
                <ExerciseRecentItem summary={summary} />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Page;
