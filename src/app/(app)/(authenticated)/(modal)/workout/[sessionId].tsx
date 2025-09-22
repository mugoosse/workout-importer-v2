import { ExerciseSetsDisplay } from "@/components/ExerciseSetsDisplay";
import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import {
  exerciseLogsAtom,
  getSetsByWorkoutSessionAtom,
  getWorkoutSessionByIdAtom,
} from "@/store/exerciseLog";
import {
  getProgressColor,
  individualMuscleProgressAtom,
} from "@/store/weeklyProgress";
import {
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { useConvex } from "convex/react";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { useAtom } from "jotai";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}min ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const Page = () => {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const navigation = useNavigation();
  const convex = useConvex();

  const [getWorkoutSessionById] = useAtom(getWorkoutSessionByIdAtom);
  const [getSetsByWorkoutSession] = useAtom(getSetsByWorkoutSessionAtom);
  const [exerciseLogs] = useAtom(exerciseLogsAtom);
  const [individualMuscleProgress] = useAtom(individualMuscleProgressAtom);

  const [exerciseDetails, setExerciseDetails] = useState<
    Record<Id<"exercises">, any>
  >({});
  const [loading, setLoading] = useState(true);
  const [beforeMuscleColors, setBeforeMuscleColors] = useState<
    MuscleColorPair[]
  >([]);
  const [afterMuscleColors, setAfterMuscleColors] = useState<MuscleColorPair[]>(
    [],
  );

  // Get workout session data
  const workoutSession = sessionId ? getWorkoutSessionById(sessionId) : null;
  const sessionSets = useMemo(
    () => (sessionId ? getSetsByWorkoutSession(sessionId) : []),
    [sessionId, getSetsByWorkoutSession],
  );

  // Set the title dynamically when workout session data loads
  useLayoutEffect(() => {
    if (workoutSession?.name) {
      navigation.setOptions({
        title: workoutSession.name || "Workout Details",
      });
    }
  }, [navigation, workoutSession?.name]);

  // Get exercise notes for this workout
  const workoutExerciseNotes = exerciseLogs.filter(
    (log) => log.workoutDate === workoutSession?.date,
  );

  const calculateMuscleVisualization = useCallback(
    (details: Record<Id<"exercises">, any>) => {
      if (!workoutSession) return;

      // Calculate total XP distribution for the workout
      const workoutXPByMuscle: Record<string, number> = {};

      // Group sets by exercise
      const setsByExercise = sessionSets.reduce(
        (acc, set) => {
          if (!acc[set.exerciseId]) {
            acc[set.exerciseId] = [];
          }
          acc[set.exerciseId].push(set);
          return acc;
        },
        {} as Record<Id<"exercises">, typeof sessionSets>,
      );

      // Calculate XP for each muscle from the workout
      Object.entries(setsByExercise).forEach(([exerciseId, sets]) => {
        const exerciseDetail = details[exerciseId as Id<"exercises">];
        if (!exerciseDetail?.muscles) return;

        const muscleInvolvements = extractMuscleInvolvement(
          exerciseDetail.muscles,
        );

        sets.forEach((set) => {
          const xpResult = calculateXPDistribution(muscleInvolvements, set.rpe);
          xpResult.muscleXPDistribution.forEach((muscle) => {
            const muscleId = muscle.muscleId;
            workoutXPByMuscle[muscleId] =
              (workoutXPByMuscle[muscleId] || 0) + muscle.xpAwarded;
          });
        });
      });

      // Create muscle color pairs for visualization
      const beforeColors: MuscleColorPair[] = [];
      const afterColors: MuscleColorPair[] = [];

      Object.entries(workoutXPByMuscle).forEach(([muscleId, workoutXP]) => {
        const currentProgress = individualMuscleProgress[muscleId];
        if (!currentProgress) return;

        // Before: current progress
        const beforePercentage =
          currentProgress.goal > 0
            ? Math.round((currentProgress.xp / currentProgress.goal) * 100)
            : 0;
        beforeColors.push({
          muscleId: muscleId as MuscleId,
          color: getProgressColor(beforePercentage),
        });

        // After: progress including this workout's XP
        const afterXP = currentProgress.xp + workoutXP;
        const afterPercentage =
          currentProgress.goal > 0
            ? Math.round((afterXP / currentProgress.goal) * 100)
            : 0;
        afterColors.push({
          muscleId: muscleId as MuscleId,
          color: getProgressColor(afterPercentage),
        });
      });

      setBeforeMuscleColors(beforeColors);
      setAfterMuscleColors(afterColors);
    },
    [workoutSession, sessionSets, individualMuscleProgress],
  );

  useEffect(() => {
    const loadExerciseDetails = async () => {
      if (!workoutSession) {
        setLoading(false);
        return;
      }

      try {
        // Fetch details for all exercises in the workout
        const details: Record<Id<"exercises">, any> = {};
        for (const exerciseId of workoutSession.exercises) {
          // Skip fallback/template exercises as they're not in the Convex database
          if (
            exerciseId.startsWith("template:") ||
            exerciseId.startsWith("fallback:")
          ) {
            continue;
          }

          const exerciseDetail = await convex.query(
            api.exercises.getExerciseDetails,
            { exerciseId },
          );
          if (exerciseDetail) {
            details[exerciseId] = exerciseDetail;
          }
        }
        setExerciseDetails(details);

        // Calculate before/after muscle visualization
        calculateMuscleVisualization(details);
      } catch (error) {
        console.error("Failed to load exercise details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExerciseDetails();
  }, [workoutSession, convex, calculateMuscleVisualization]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      .toUpperCase()
      .replace(",", "");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!sessionId || !workoutSession) {
    return (
      <View className="flex-1 bg-dark justify-center items-center">
        <Text className="text-white text-lg">Workout not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-[#6F2DBD] px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-Poppins_500Medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-dark justify-center items-center">
        <ActivityIndicator size="large" color="#6F2DBD" />
        <Text className="text-white mt-4">Loading workout details...</Text>
      </View>
    );
  }

  const duration = workoutSession.endTime - workoutSession.startTime;

  // Group sets by exercise for display
  const setsByExercise = sessionSets.reduce(
    (acc, set) => {
      if (!acc[set.exerciseId]) {
        acc[set.exerciseId] = [];
      }
      acc[set.exerciseId].push(set);
      return acc;
    },
    {} as Record<Id<"exercises">, typeof sessionSets>,
  );

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Text className="text-gray-400 text-lg font-Poppins_400Regular">
              {formatDate(workoutSession.startTime)}
            </Text>
          ),
        }}
      />

      <ScrollView className="flex-1">
        {/* Workout Header */}
        <View className="px-4 py-6 border-b border-neutral-700">
          {/* Workout Stats */}
          <View className="flex-row justify-around bg-[#1c1c1e] rounded-xl p-4">
            <View className="items-center">
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                Start Time
              </Text>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                {formatTime(workoutSession.startTime)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                Duration
              </Text>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                {formatDuration(duration)}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                Total Sets
              </Text>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                {workoutSession.totalSets}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                XP Earned
              </Text>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                {workoutSession.totalXP}
              </Text>
            </View>
          </View>
        </View>

        {/* Before/After Muscle Visualization */}
        {(beforeMuscleColors.length > 0 || afterMuscleColors.length > 0) && (
          <View className="px-4 py-6 border-b border-neutral-700">
            <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
              Muscle Progress Impact
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-gray-400 text-sm font-Poppins_500Medium mb-2">
                  Before Workout
                </Text>
                <MuscleBody
                  view="both"
                  highlightedMuscles={beforeMuscleColors}
                  width={100}
                  height={170}
                />
              </View>
              <View className="items-center">
                <Text className="text-gray-400 text-sm font-Poppins_500Medium mb-2">
                  After Workout
                </Text>
                <MuscleBody
                  view="both"
                  highlightedMuscles={afterMuscleColors}
                  width={100}
                  height={170}
                />
              </View>
            </View>
          </View>
        )}

        {/* Exercises */}
        <View className="px-4 py-6">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
            {workoutSession.exercises.length} Exercise
            {workoutSession.exercises.length !== 1 ? "s" : ""}
          </Text>

          {workoutSession.exercises.map((exerciseId, exerciseIndex) => {
            const exerciseDetail = exerciseDetails[exerciseId];
            const exerciseSets = setsByExercise[exerciseId] || [];
            const exerciseNotes = workoutExerciseNotes.find(
              (note) => note.exerciseId === exerciseId,
            );

            // Handle fallback/template exercises that weren't queried from Convex
            const isTemplateExercise =
              exerciseId.startsWith("template:") ||
              exerciseId.startsWith("fallback:");

            if (!exerciseDetail && !isTemplateExercise) return null;

            // For template exercises, create a basic display without detailed muscle data
            if (isTemplateExercise && !exerciseDetail) {
              return (
                <View
                  key={exerciseId}
                  className={`bg-[#1c1c1e] rounded-xl p-4 ${exerciseIndex > 0 ? "mt-4" : ""}`}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-lg font-Poppins_600SemiBold flex-1">
                      {exerciseId
                        .replace("template:", "")
                        .replace("fallback:", "")
                        .replace(/-/g, " ")}
                    </Text>
                  </View>

                  {exerciseSets.length > 0 && (
                    <View className="mb-3">
                      <Text className="text-gray-400 text-sm font-Poppins_500Medium mb-2">
                        Sets ({exerciseSets.length})
                      </Text>
                      <View className="space-y-2">
                        {exerciseSets.map((set, index) => (
                          <View key={set.id} className="flex-row items-center">
                            <Text className="text-gray-500 text-sm font-Poppins_400Regular w-8">
                              {index + 1}
                            </Text>
                            <Text className="text-white text-sm font-Poppins_400Regular flex-1">
                              {set.reps && `${set.reps} reps`}
                              {set.weight && ` @ ${set.weight}kg`}
                              {set.duration &&
                                `${Math.round(set.duration / 60)} min`}
                              {set.distance &&
                                ` ${(set.distance / 1000).toFixed(1)}km`}
                            </Text>
                            <Text className="text-yellow-400 text-sm font-Poppins_500Medium">
                              RPE {set.rpe}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {exerciseNotes?.notes && (
                    <View className="mt-3 bg-[#2c2c2e] rounded-lg p-3">
                      <Text className="text-gray-400 text-xs font-Poppins_500Medium mb-1">
                        Notes
                      </Text>
                      <Text className="text-gray-300 text-sm font-Poppins_400Regular">
                        {exerciseNotes.notes}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }

            return (
              <View
                key={exerciseId}
                className={`bg-[#1c1c1e] rounded-xl p-4 ${exerciseIndex > 0 ? "mt-4" : ""}`}
              >
                <ExerciseSetsDisplay
                  exerciseDetail={exerciseDetail}
                  exerciseSets={exerciseSets}
                  exerciseNotes={exerciseNotes}
                  showHeader={true}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
