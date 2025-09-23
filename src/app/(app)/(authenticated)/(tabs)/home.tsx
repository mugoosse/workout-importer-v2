import { ActiveWorkoutBanner } from "@/components/ActiveWorkoutBanner";
import { WeeklyProgressCard } from "@/components/WeeklyProgressCard";
import { api } from "@/convex/_generated/api";
import {
  exerciseLogSummariesAtom,
  workoutSessionsAtom,
  type ExerciseLogSummary,
  type WorkoutSession,
} from "@/store/exerciseLog";
import {
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCachedQuery } from "@/hooks/cache";
import { useAtom } from "jotai";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// Component to display individual exercise log item with exercise name
const ExerciseLogItem = ({
  summary,
  formatLastLoggedDate,
}: {
  summary: ExerciseLogSummary;
  formatLastLoggedDate: (date: string) => string;
}) => {
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
    const xpResult = calculateXPDistribution(muscleInvolvements, 8); // Default RPE 8
    return xpResult.totalXP * summary.totalSets; // XP per set * number of sets
  };

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
const WorkoutSessionCard = ({
  session,
  formatLastLoggedDate,
}: {
  session: WorkoutSession;
  formatLastLoggedDate: (dateString: string) => string;
}) => {
  const formatDuration = (milliseconds: number): string => {
    const totalMinutes = Math.round(milliseconds / 60000);
    if (totalMinutes < 60) {
      return `${totalMinutes}min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const duration = session.endTime - session.startTime;

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
    <View className="flex-1 bg-dark">
      <ActiveWorkoutBanner />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="pt-6">
          <WeeklyProgressCard />
        </View>

        {/* Recent Workouts Section */}
        {(workoutSessions.length > 0 || exerciseLogSummaries.length > 0) && (
          <View className="mx-4 mb-6 mt-8">
            <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
              Recent Workouts
            </Text>

            {workoutSessions.length > 0 ? (
              /* Show workout sessions if available */
              <>
                {workoutSessions
                  .sort((a, b) => b.startTime - a.startTime)
                  .slice(0, 4)
                  .map((session) => (
                    <WorkoutSessionCard
                      key={session.id}
                      session={session}
                      formatLastLoggedDate={formatLastLoggedDate}
                    />
                  ))}
                {workoutSessions.length > 4 && (
                  <TouchableOpacity className="mt-2 p-2">
                    <Text className="text-[#6F2DBD] text-center font-Poppins_500Medium">
                      View All ({workoutSessions.length} workouts)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              /* Fallback to exercise summaries */
              <>
                {exerciseLogSummaries.slice(0, 6).map((summary, index) => (
                  <View
                    key={summary.exerciseId}
                    className={index > 0 ? "mt-4" : ""}
                  >
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
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Page;
