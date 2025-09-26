import { RPE_SCALE } from "@/constants/rpe";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/hooks/cache";
import { exerciseLogSummariesAtom, loggedSetsAtom } from "@/store/exerciseLog";
import { cleanExerciseTitle } from "@/utils/exerciseUtils";
import { getRoleColor, getRoleDisplayName } from "@/utils/muscleRoles";
import { calculateXPDistribution, type MuscleRole } from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

// Component to display workout item
const WorkoutLogItem = ({
  exerciseId,
  setsCount,
  lastLoggedDate,
  muscleRole,
  xpEarned,
  formatLastLoggedDate,
  notes,
  prCount,
}: {
  exerciseId: string;
  setsCount: number;
  lastLoggedDate: string;
  muscleRole: MuscleRole;
  xpEarned: number;
  formatLastLoggedDate: (date: string) => string;
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
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {formatLastLoggedDate(lastLoggedDate)}
            </Text>
          </View>
          {xpEarned > 0 && (
            <View className="mt-2">
              <View className="bg-[#6F2DBD] rounded-full px-3 py-1 self-start">
                <Text className="text-white text-xs font-Poppins_500Medium">
                  +{xpEarned}XP
                </Text>
              </View>
            </View>
          )}
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

interface Muscle {
  _id: string;
  svgId: string;
}

interface RecentWorkoutsSectionProps {
  muscles: Muscle[];
  maxWorkouts?: number;
}

export const RecentWorkoutsSection = ({
  muscles,
  maxWorkouts = 6,
}: RecentWorkoutsSectionProps) => {
  const [loggedSets] = useAtom(loggedSetsAtom);
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);

  // Get unique exercise IDs for muscle role queries
  const uniqueExerciseIds = useMemo(() => {
    return [...new Set(loggedSets.map((set) => set.exerciseId))];
  }, [loggedSets]);

  // Query muscle roles for all exercises and target muscles
  const { data: muscleRolesMap } = useCachedQuery(
    api.exercises.getMuscleRolesForExercises,
    {
      exerciseIds: uniqueExerciseIds as Id<"exercises">[],
      muscleId: muscles[0]?._id as Id<"muscles">, // Use first muscle database ID for query
    },
  );

  const recentWorkouts = useMemo(() => {
    if (!muscles.length) return [];

    return (() => {
      const exerciseGroups = new Map<
        string,
        {
          exerciseId: string;
          setsCount: number;
          lastLoggedDate: string;
          muscleRole: MuscleRole;
          totalXP: number;
          prCount: number;
        }
      >();

      loggedSets.forEach((set) => {
        // Check if any of the target muscles are involved in this exercise
        const muscleRole = muscleRolesMap?.[set.exerciseId] as MuscleRole;
        if (!muscleRole) {
          return; // Skip this set if no target muscles are involved
        }

        // Calculate XP for this set for the target muscles
        const muscleInvolvements = muscles.map((muscle) => ({
          muscleId: muscle.svgId as any, // Use SVG ID for XP calculation
          role: muscleRole,
        }));

        const xpResult = calculateXPDistribution(
          muscleInvolvements,
          set.rpe || RPE_SCALE.MAX,
          set.isPR || false,
        );

        // Sum XP across all target muscles for this set
        const totalMuscleXP = muscles.reduce((total, muscle) => {
          const muscleXP =
            xpResult.muscleXPDistribution.find(
              (m) => m.muscleId === muscle.svgId,
            )?.xpAwarded || 0;
          return total + muscleXP;
        }, 0);

        const key = set.exerciseId;
        const existing = exerciseGroups.get(key);

        if (existing) {
          existing.setsCount += 1;
          existing.totalXP += totalMuscleXP;
          if (set.isPR) {
            existing.prCount += 1;
          }
          // Keep the most recent date
          if (set.timestamp > new Date(existing.lastLoggedDate).getTime()) {
            existing.lastLoggedDate = new Date(set.timestamp).toISOString();
          }
        } else {
          exerciseGroups.set(key, {
            exerciseId: set.exerciseId,
            setsCount: 1,
            lastLoggedDate: new Date(set.timestamp).toISOString(),
            muscleRole,
            totalXP: totalMuscleXP,
            prCount: set.isPR ? 1 : 0,
          });
        }
      });

      // Convert to array, add notes from exercise log summaries, and sort by most recent first
      return Array.from(exerciseGroups.values())
        .map((group) => {
          // Get notes from exercise log summary
          const exerciseLogSummary = exerciseLogSummaries.find(
            (summary) => summary.exerciseId === group.exerciseId,
          );
          return {
            ...group,
            notes: exerciseLogSummary?.notes,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.lastLoggedDate).getTime() -
            new Date(a.lastLoggedDate).getTime(),
        )
        .slice(0, maxWorkouts);
    })();
  }, [muscles, loggedSets, exerciseLogSummaries, muscleRolesMap, maxWorkouts]);

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

  if (recentWorkouts.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-3">
        Recent Workouts
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
            formatLastLoggedDate={formatLastLoggedDate}
            notes={workout.notes}
            prCount={workout.prCount}
          />
        ))}
      </View>
    </View>
  );
};
