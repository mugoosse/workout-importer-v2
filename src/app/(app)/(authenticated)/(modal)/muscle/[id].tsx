import { MuscleBody, type MuscleId } from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { RPE_SCALE } from "@/constants/rpe";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { exerciseLogSummariesAtom, loggedSetsAtom } from "@/store/exerciseLog";
import {
  getProgressColor,
  getStreakEmoji,
  individualMuscleProgressAtom,
} from "@/store/weeklyProgress";
import { calculateXPDistribution, type MuscleRole } from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCachedQuery } from "@/hooks/cache";
import { useAtom } from "jotai";
import { useLayoutEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Helper function to get role color
const getRoleColor = (role: MuscleRole): string => {
  switch (role) {
    case "target":
      return "#1FD224";
    case "synergist":
      return "#FF8A1B";
    case "stabilizer":
      return "#FCD514";
    case "lengthening":
      return "#3498DB";
    default:
      return "#6F2DBD";
  }
};

// Helper function to get role display name
const getRoleDisplayName = (role: MuscleRole): string => {
  switch (role) {
    case "target":
      return "Target";
    case "synergist":
      return "Synergist";
    case "stabilizer":
      return "Stabilizer";
    case "lengthening":
      return "Lengthening";
    default:
      return "Unknown";
  }
};

// Component to display workout item similar to home.tsx
const WorkoutLogItem = ({
  exerciseId,
  setsCount,
  lastLoggedDate,
  muscleRole,
  xpEarned,
  formatLastLoggedDate,
  notes,
}: {
  exerciseId: string;
  setsCount: number;
  lastLoggedDate: string;
  muscleRole: MuscleRole;
  xpEarned: number;
  formatLastLoggedDate: (date: string) => string;
  notes?: string;
}) => {
  const { data: exercise } = useCachedQuery(api.exercises.get, {
    exerciseId: exerciseId as Id<"exercises">,
  });

  const cleanExerciseTitle = (title: string) => {
    return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  };

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

type ExerciseRoleCardProps = {
  role: "target" | "synergist" | "stabilizer" | "lengthening";
  title: string;
  description: string;
  color: string;
  count: number;
  muscleId: string;
  onPress: () => void;
};

const ExerciseRoleCard = ({
  title,
  description,
  color,
  count,
  onPress,
}: ExerciseRoleCardProps) => {
  const isDisabled = count === 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between mb-3 ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-3 h-3 rounded-full mr-3"
          style={{ backgroundColor: color }}
        />
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-Poppins_500Medium mr-2">
              {title}
            </Text>
            <View className="bg-[#3c3c3e] rounded-full px-2 py-1">
              <Text className="text-gray-300 text-xs font-Poppins_500Medium">
                {count}
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 text-xs font-Poppins_400Regular mt-1">
            {description}
          </Text>
        </View>
      </View>
      {!isDisabled && (
        <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
      )}
    </TouchableOpacity>
  );
};

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [individualMuscleProgress] = useAtom(individualMuscleProgressAtom);
  const [loggedSets] = useAtom(loggedSetsAtom);
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);

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
            notes?: string;
          }
        >();

        // For now, we'll use a simplified approach to determine muscle involvement
        // In a real implementation, you'd query the exercise-muscle relationships from the database
        loggedSets.forEach((set) => {
          // Simplified role assignment - in practice, you'd query this from the database
          const muscleRole: MuscleRole = "target"; // Default to target for demo

          // Calculate XP for this set for this specific muscle
          const xpResult = calculateXPDistribution(
            [{ muscleId: muscle.svgId as MuscleId, role: muscleRole }],
            set.rpe || RPE_SCALE.MAX,
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
          .slice(0, 6); // Show last 6 workouts
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

  if (!muscle || !exerciseCounts) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Get muscle progress and color
  const muscleProgressData = individualMuscleProgress[muscle.svgId];
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
        <View className="mx-4 mt-4 mb-6">
          {/* Muscle Group Tag */}
          <View className="flex-row">
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(app)/(authenticated)/(modal)/muscle-group/${muscle.majorGroup}`,
                )
              }
            >
              <Badge variant="outline">
                <Text className="text-white text-sm capitalize">
                  {muscle.majorGroup}
                </Text>
              </Badge>
            </TouchableOpacity>
          </View>
        </View>

        {/* Body Visualization Card */}
        <View className="mx-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-6">
            <Text className="text-white text-xl font-Poppins_600SemiBold mb-4 text-center">
              Muscle Location
            </Text>
            <MuscleBody
              highlightedMuscles={[
                { muscleId: muscle.svgId as MuscleId, color: muscleColor },
              ]}
              width={280}
              height={400}
              view="both"
            />
          </View>
        </View>

        {/* Muscle Information Cards */}
        <View className="px-4">
          {/* Anatomical Group Card */}
          {muscle.anatomicalGroup && (
            <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <Ionicons name="medical-outline" size={20} color="#6F2DBD" />
                </View>
                <Text className="text-white text-lg font-Poppins_600SemiBold">
                  Anatomical Group
                </Text>
              </View>
              <Text className="text-gray-300 text-base font-Poppins_400Regular ml-13">
                {muscle.anatomicalGroup}
              </Text>
            </View>
          )}

          {/* Muscle Progress Card */}
          <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="trending-up" size={20} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Progress Tracking
              </Text>
            </View>

            <View className="bg-[#2c2c2e] rounded-xl p-4">
              {/* XP Progress Bar */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-Poppins_500Medium">
                    XP Progress
                  </Text>
                  <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                    {muscleProgressData?.xp || 0} /{" "}
                    {muscleProgressData?.goal || 50} XP
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

              {/* Stats Row */}
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-white text-lg font-Poppins_600SemiBold">
                    {muscleProgressData?.sets || 0}
                  </Text>
                  <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                    Total Sets
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white text-lg font-Poppins_600SemiBold">
                    {getStreakEmoji(muscleProgressData?.streak || 0)}{" "}
                    {muscleProgressData?.streak || 0}
                  </Text>
                  <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                    Week Streak
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white text-lg font-Poppins_600SemiBold">
                    {recentWorkouts.length}
                  </Text>
                  <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                    Recent Workouts
                  </Text>
                </View>
              </View>
            </View>

            {/* Recent Workouts */}
            {recentWorkouts.length > 0 && (
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
                    />
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Function & Exercises Card */}
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="barbell-outline" size={20} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Related Exercises
              </Text>
            </View>

            <View>
              <ExerciseRoleCard
                role="target"
                title="Target Exercises"
                description="Exercises that primarily work this muscle"
                color="#1FD224"
                count={exerciseCounts.target}
                muscleId={muscle._id}
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=target`,
                  )
                }
              />

              <ExerciseRoleCard
                role="synergist"
                title="Synergist Exercises"
                description="Exercises where this muscle assists"
                color="#FF8A1B"
                count={exerciseCounts.synergist}
                muscleId={muscle._id}
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=synergist`,
                  )
                }
              />

              <ExerciseRoleCard
                role="stabilizer"
                title="Stabilizer Exercises"
                description="Exercises where this muscle stabilizes"
                color="#FCD514"
                count={exerciseCounts.stabilizer}
                muscleId={muscle._id}
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=stabilizer`,
                  )
                }
              />

              <ExerciseRoleCard
                role="lengthening"
                title="Lengthening Exercises"
                description="Exercises that stretch this muscle"
                color="#3498DB"
                count={exerciseCounts.lengthening}
                muscleId={muscle._id}
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=lengthening`,
                  )
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
