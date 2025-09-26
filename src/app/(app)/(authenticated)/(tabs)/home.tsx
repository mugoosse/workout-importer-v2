import { ActiveWorkoutBanner } from "@/components/ActiveWorkoutBanner";
import { WeeklyProgressCard } from "@/components/WeeklyProgressCard";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import {
  exerciseLogSummariesAtom,
  loggedSetsAtom,
  workoutSessionsAtom,
  type ExerciseLogSummary,
  type WorkoutSession,
} from "@/store/exerciseLog";
import {
  formatDuration,
  formatLastLoggedDate,
  formatTime,
} from "@/utils/timeFormatters";
import {
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// Component to display individual exercise log item with exercise name
const ExerciseLogItem = ({ summary }: { summary: ExerciseLogSummary }) => {
  const [loggedSets] = useAtom(loggedSetsAtom);

  const { data: exercise } = useCachedQuery(api.exercises.get, {
    exerciseId: summary.exerciseId,
  });

  const { data: exerciseDetails } = useCachedQuery(
    api.exercises.getExerciseDetails,
    {
      exerciseId: summary.exerciseId,
    },
  );

  const cleanExerciseTitle = (title: string) => {
    // Remove equipment suffix pattern " (Equipment Name)"
    return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  };

  // Calculate total XP earned from this exercise (assuming average RPE of 8)
  const calculateTotalXP = () => {
    if (!exerciseDetails?.muscles) return 0;

    const muscleInvolvements = extractMuscleInvolvement(
      exerciseDetails.muscles,
    );
    const xpResult = calculateXPDistribution(muscleInvolvements, 8, false); // Default RPE 8, no PR
    return xpResult.totalXP * summary.totalSets; // XP per set * number of sets
  };

  // Calculate PR count for this exercise
  const prCount = loggedSets
    .filter((set) => set.exerciseId === summary.exerciseId)
    .filter((set) => set.isPR).length;

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
            {exercise
              ? cleanExerciseTitle(exercise.title)
              : "Loading exercise..."}
          </Text>
          <View className="flex-row items-center gap-3 mt-2">
            <View className="bg-[#6F2DBD] rounded-full px-3 py-1">
              <Text className="text-white text-xs font-Poppins_500Medium">
                {summary.totalSets} sets
              </Text>
            </View>
            {prCount > 0 && (
              <View className="bg-[#FFD700] rounded-full px-2 py-1">
                <Text className="text-black text-xs font-Poppins_500Medium">
                  {prCount} PR{prCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
            <View className="bg-[#1c1c1e] rounded-full px-2 py-1">
              <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
                +{calculateTotalXP()} XP
              </Text>
            </View>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {formatLastLoggedDate(summary.lastLoggedDate)}
            </Text>
          </View>
          {summary.notes && (
            <View className="mt-2 p-2">
              <Text className="text-gray-300 text-sm font-Poppins_400Regular italic">
                {summary.notes}
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

// Component to display workout session card
const WorkoutSessionCard = ({ session }: { session: WorkoutSession }) => {
  const [loggedSets] = useAtom(loggedSetsAtom);
  const duration = session.endTime - session.startTime;

  // Calculate PR count for this workout session
  const prCount = loggedSets
    .filter((set) => set.workoutSessionId === session.id)
    .filter((set) => set.isPR).length;

  return (
    <TouchableOpacity
      className="bg-[#1c1c1e] rounded-xl p-4 mb-3"
      onPress={() =>
        router.push(`/(app)/(authenticated)/(modal)/workout/${session.id}`)
      }
    >
      {/* Workout Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-white font-Poppins_600SemiBold text-base">
            {session.name || "Workout"}
          </Text>
          <Text className="text-gray-400 text-sm font-Poppins_400Regular">
            {formatLastLoggedDate(session.date)} •{" "}
            {formatTime(session.startTime)} • {formatDuration(duration)}
          </Text>
        </View>

        <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs font-Poppins_500Medium">
            {session.totalSets} sets
          </Text>
        </View>
        <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs font-Poppins_500Medium">
            {session.exercises.length} exercise
            {session.exercises.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {prCount > 0 && (
          <View className="bg-[#FFD700] rounded-full px-3 py-1">
            <Text className="text-black text-xs font-Poppins_500Medium">
              {prCount} PR{prCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
        {session.totalXP > 0 && (
          <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
            <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
              +{session.totalXP} XP
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const Page = () => {
  const { data: muscles } = useCachedQuery(api.muscles.list, {});
  const [exerciseLogSummaries] = useAtom(exerciseLogSummariesAtom);
  const [workoutSessions] = useAtom(workoutSessionsAtom);

  const handleStartWorkout = () => {
    router.push("/(app)/(authenticated)/(modal)/create-workout-modal");
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
    <View className="flex-1 bg-dark">
      <ActiveWorkoutBanner />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="pt-6">
          <WeeklyProgressCard />
        </View>

        {/* Exercises Section */}
        <View className="mx-4 mt-6">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
            Exercises
          </Text>

          {/* All Exercises */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(app)/(authenticated)/(modal)/exercises")
            }
            className="bg-[#1c1c1e] rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-Poppins_600SemiBold">
                  All Exercises
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                  Browse the complete exercise database
                </Text>
              </View>
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center ml-3">
                <Ionicons name="fitness-outline" size={20} color="#6F2DBD" />
              </View>
            </View>
          </TouchableOpacity>

          {/* By Target Muscle */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(app)/(authenticated)/(modal)/muscles")
            }
            className="bg-[#1c1c1e] rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-Poppins_600SemiBold">
                  By Muscle
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                  Browse muscles and related exercises
                </Text>
              </View>
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center ml-3">
                <Ionicons name="body-outline" size={20} color="#6F2DBD" />
              </View>
            </View>
          </TouchableOpacity>

          {/* By Equipment */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(app)/(authenticated)/(modal)/equipment")
            }
            className="bg-[#1c1c1e] rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-Poppins_600SemiBold">
                  By Equipment
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                  Explore exercises by gym equipment
                </Text>
              </View>
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center ml-3">
                <Ionicons name="barbell-outline" size={20} color="#6F2DBD" />
              </View>
            </View>
          </TouchableOpacity>

          {/* By Type */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(app)/(authenticated)/(modal)/exercise-types")
            }
            className="bg-[#1c1c1e] rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-Poppins_600SemiBold">
                  By Type
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                  Browse by exercise format and style
                </Text>
              </View>
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center ml-3">
                <Ionicons name="list-outline" size={20} color="#6F2DBD" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Recent Exercises - Always Show */}
          <TouchableOpacity
            onPress={() => {
              if (exerciseLogSummaries.length > 0) {
                router.push("/(app)/(authenticated)/(modal)/exercises/recent");
              }
            }}
            className={`rounded-xl p-4 ${
              exerciseLogSummaries.length > 0
                ? "bg-[#1c1c1e]"
                : "bg-[#1c1c1e] opacity-50"
            }`}
            disabled={exerciseLogSummaries.length === 0}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className={`text-lg font-Poppins_600SemiBold ${
                    exerciseLogSummaries.length > 0
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  Recent Exercises
                </Text>
                <Text
                  className={`text-sm font-Poppins_400Regular mt-1 ${
                    exerciseLogSummaries.length > 0
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {exerciseLogSummaries.length > 0
                    ? "View your exercise history and progress"
                    : "Complete workouts to see your exercise history"}
                </Text>
              </View>
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center ml-3">
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={exerciseLogSummaries.length > 0 ? "#6F2DBD" : "#666"}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Workouts Section - Always Show */}
        <View className="mx-4 mb-6 mt-8">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
            Recent Workouts
          </Text>

          {/* Content */}
          {workoutSessions.length > 0 ? (
            /* Show workout sessions if available */
            <>
              {workoutSessions
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, 4)
                .map((session) => (
                  <WorkoutSessionCard key={session.id} session={session} />
                ))}
              {workoutSessions.length > 4 && (
                <TouchableOpacity className="mt-2 p-2">
                  <Text className="text-[#6F2DBD] text-center font-Poppins_500Medium">
                    View All ({workoutSessions.length} workouts)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : exerciseLogSummaries.length > 0 ? (
            /* Fallback to exercise summaries */
            <>
              {exerciseLogSummaries.slice(0, 6).map((summary, index) => (
                <View
                  key={summary.exerciseId}
                  className={index > 0 ? "mt-4" : ""}
                >
                  <ExerciseLogItem summary={summary} />
                </View>
              ))}
              {exerciseLogSummaries.length > 6 && (
                <TouchableOpacity className="mt-2 p-2">
                  <Text className="text-[#6F2DBD] text-center font-Poppins_500Medium">
                    View All ({exerciseLogSummaries.length} exercises)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            /* Empty state */
            <View className="bg-[#1c1c1e] rounded-xl p-8 items-center">
              <View className="bg-[#2c2c2e] w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="barbell-outline" size={28} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold mb-2 text-center">
                No workouts yet
              </Text>
              <Text className="text-gray-400 text-sm font-Poppins_400Regular mb-6 text-center">
                Start your fitness journey today!
              </Text>
              <TouchableOpacity
                onPress={handleStartWorkout}
                className="bg-[#6F2DBD] rounded-xl p-4 w-full"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="play" size={20} color="#ffffff" />
                  <Text className="text-white font-Poppins_600SemiBold ml-2">
                    Start workout
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
