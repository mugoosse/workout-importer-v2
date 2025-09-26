import { type MuscleId } from "@/components/muscle-body/MuscleBody";
import { RPE_SCALE } from "@/constants/rpe";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/hooks/cache";
import { exerciseLogSummariesAtom, loggedSetsAtom } from "@/store/exerciseLog";
import { getProgressColor, svgIdProgressAtom } from "@/store/weeklyProgress";
import { cleanExerciseTitle } from "@/utils/exerciseUtils";
import { getRoleColor, getRoleDisplayName } from "@/utils/muscleRoles";
import { calculateXPDistribution, type MuscleRole } from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

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

interface MuscleProgressCardProps {
  muscleId: string;
  svgId: string;
  showRecentWorkouts?: boolean;
  maxWorkouts?: number;
  variant?: "full" | "compact" | "extended";
}

export const MuscleProgressCard = ({
  muscleId,
  svgId,
  showRecentWorkouts = true,
  maxWorkouts = 6,
  variant = "full",
}: MuscleProgressCardProps) => {
  const [svgIdProgress] = useAtom(svgIdProgressAtom);
  const [loggedSets] = useAtom(loggedSetsAtom);
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);

  const { data: muscle } = useCachedQuery(api.muscles.get, {
    muscleId: muscleId as Id<"muscles">,
  });

  // Get unique exercise IDs from logged sets
  const uniqueExerciseIds = muscle
    ? [...new Set(loggedSets.map((set) => set.exerciseId))]
    : [];

  // Get muscle roles for all exercises at once
  const { data: muscleRolesMap } = useCachedQuery(
    api.exercises.getMuscleRolesForExercises,
    {
      exerciseIds: uniqueExerciseIds as Id<"exercises">[],
      muscleId: muscleId as Id<"muscles">,
    },
  );

  // Get recent workouts that involve this muscle
  const recentWorkouts = muscle
    ? (() => {
        // Group logged sets by exercise and calculate XP for this muscle
        const exerciseGroups = new Map<
          string,
          {
            exerciseId: string;
            setsCount: number;
            lastLoggedDate: string;
            muscleRole: MuscleRole;
            totalXP: number;
            prCount: number;
            notes?: string;
          }
        >();

        loggedSets.forEach((set) => {
          // Only process sets from exercises that actually work this muscle
          const muscleRole = muscleRolesMap?.[set.exerciseId] as MuscleRole;
          if (!muscleRole) {
            return; // Skip this set if the muscle doesn't work in this exercise
          }

          // Calculate XP for this set for this specific muscle
          const xpResult = calculateXPDistribution(
            [{ muscleId: muscle.svgId as MuscleId, role: muscleRole }],
            set.rpe || RPE_SCALE.MAX,
            set.isPR || false,
          );

          const muscleXP =
            xpResult.muscleXPDistribution.find(
              (m) => m.muscleId === muscle.svgId,
            )?.xpAwarded || 0;

          const key = set.exerciseId;
          const existing = exerciseGroups.get(key);

          if (existing) {
            existing.setsCount += 1;
            existing.totalXP += muscleXP;
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
              totalXP: muscleXP,
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
      })()
    : [];

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

  if (!muscle) {
    return (
      <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Get muscle progress and color
  const muscleProgressData = svgIdProgress[svgId];
  const progressPercentage = muscleProgressData?.percentage || 0;
  const progressColor = getProgressColor(progressPercentage, true);

  return (
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
              {muscleProgressData?.xp || 0} / {muscleProgressData?.goal || 50}{" "}
              XP
            </Text>
          </View>

          <View className="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, muscleProgressData?.percentage || 0)}%`,
                backgroundColor: progressColor,
              }}
            />
          </View>
          <Text className="text-gray-400 text-sm font-Poppins_400Regular">
            {muscleProgressData?.percentage || 0}% complete
          </Text>
        </View>
      </View>

      {/* Recent Workouts */}
      {showRecentWorkouts &&
        recentWorkouts.length > 0 &&
        variant !== "compact" && (
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
        )}
    </View>
  );
};
