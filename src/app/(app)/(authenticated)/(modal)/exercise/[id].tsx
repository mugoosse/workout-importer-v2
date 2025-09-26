import { ExerciseSetsDisplay } from "@/components/ExerciseSetsDisplay";
import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/hooks/cache";
import {
  activeWorkoutAtom,
  addExercisesToWorkoutAction,
  startWorkoutAction,
} from "@/store/activeWorkout";
import {
  getSetsByWorkoutSessionAtom,
  getWorkoutSessionsByExerciseAtom,
} from "@/store/exerciseLog";
import {
  getProgressColor,
  getStreakEmoji,
  svgIdProgressAtom,
} from "@/store/weeklyProgress";
import { cleanExerciseTitle } from "@/utils/exerciseUtils";
import { formatMuscleName } from "@/utils/muscleBodyUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Doc } from "convex/_generated/dataModel";
import {
  Link,
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { useAtom } from "jotai";
import { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Muscle = Doc<"muscles">;

type MuscleRole = "target" | "synergist" | "stabilizer" | "lengthening";

const MUSCLE_ROLE_COLORS: Record<MuscleRole, string> = {
  target: "#1FD224", // green
  synergist: "#FF8A1B", // orange
  stabilizer: "#FCD514", // yellow
  lengthening: "#3498DB", // blue
};

const MUSCLE_ROLE_EXPLANATIONS: Record<MuscleRole, string> = {
  target: "Primary muscles being worked by this exercise",
  synergist: "Supporting muscles that assist the primary movement",
  stabilizer: "Muscles that provide stability and control during the movement",
  lengthening: "Muscles that are stretched or lengthened during the exercise",
};

const formatRoleName = (role: MuscleRole): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const exerciseId = id as Id<"exercises">;
  const { data: exerciseDetails } = useCachedQuery(
    api.exercises.getExerciseDetails,
    {
      exerciseId,
    },
  );
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);

  // Set the title dynamically when exerciseDetails loads
  useLayoutEffect(() => {
    if (exerciseDetails?.title) {
      navigation.setOptions({
        title: cleanExerciseTitle(exerciseDetails.title),
      });
    }
  }, [navigation, exerciseDetails?.title]);
  const [svgIdProgress] = useAtom(svgIdProgressAtom);
  const [getWorkoutSessionsByExercise] = useAtom(
    getWorkoutSessionsByExerciseAtom,
  );
  const [getSetsByWorkoutSession] = useAtom(getSetsByWorkoutSessionAtom);
  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [, startWorkout] = useAtom(startWorkoutAction);
  const [, addExercisesToWorkout] = useAtom(addExercisesToWorkoutAction);

  const [collapsedSections, setCollapsedSections] = useState<Set<MuscleRole>>(
    () =>
      new Set<MuscleRole>(["target", "synergist", "stabilizer", "lengthening"]),
  );

  // Get workout sessions for this exercise
  const workoutSessions = getWorkoutSessionsByExercise(exerciseId);

  // Handle starting a workout with this exercise
  const handleStartWorkout = () => {
    if (activeWorkout.isActive) {
      // Add to existing workout
      addExercisesToWorkout([exerciseId], {
        [exerciseId]: {
          title: exerciseDetails?.title,
          exerciseType: exerciseDetails?.exerciseType,
          equipment: exerciseDetails?.equipment,
        },
      });
    } else {
      // Start a new workout
      startWorkout({ startMethod: "quick-start" });

      // Add this exercise to the workout with exercise details
      addExercisesToWorkout([exerciseId], {
        [exerciseId]: {
          title: exerciseDetails?.title,
          exerciseType: exerciseDetails?.exerciseType,
          equipment: exerciseDetails?.equipment,
        },
      });
    }

    // Navigate to the workout page
    router.push("/(app)/(authenticated)/(modal)/workout/active-workout");
  };

  const toggleSection = (role: MuscleRole) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return newSet;
    });
  };

  if (!exerciseDetails) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!exerciseDetails) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg font-Poppins_500Medium">
          Exercise not found
        </Text>
      </View>
    );
  }

  // Group muscles by role
  const musclesByRole = exerciseDetails.muscles.reduce(
    (acc, { muscle, role }) => {
      if (!muscle) return acc;
      if (!acc[role]) acc[role] = [];
      acc[role].push(muscle);
      return acc;
    },
    {} as Record<MuscleRole, Muscle[]>,
  );

  // Create highlighted muscles for visualization with role priority
  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  // Define role priority (higher priority roles should override lower priority)
  const rolePriority: MuscleRole[] = [
    "target",
    "lengthening",
    "synergist",
    "stabilizer",
  ];

  // Process muscles by role priority
  rolePriority.forEach((priorityRole) => {
    const musclesWithRole = musclesByRole[priorityRole] || [];
    musclesWithRole.forEach((muscle) => {
      if (!muscle || seenMuscleIds.has(muscle.svgId)) return;

      // If a muscle is selected, only highlight that one
      if (selectedMuscleId && muscle.svgId !== selectedMuscleId) {
        return;
      }

      seenMuscleIds.add(muscle.svgId);
      const color = MUSCLE_ROLE_COLORS[priorityRole];

      highlightedMuscles.push({
        muscleId: muscle.svgId as MuscleId,
        color,
      });
    });
  });

  const handleMusclePress = (muscleId: MuscleId) => {
    if (selectedMuscleId === muscleId) {
      setSelectedMuscleId(null);
    } else {
      setSelectedMuscleId(muscleId);
    }
  };

  const handleOpenMenu = () => {
    router.push(
      `/(app)/(authenticated)/(modal)/exercise/menu?exerciseId=${exerciseId}&exerciseName=${encodeURIComponent(exerciseDetails.title)}${exerciseDetails.url ? `&url=${encodeURIComponent(exerciseDetails.url)}` : ""}`,
    );
  };

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleOpenMenu} className="mr-2">
              <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Details */}
        <View className="mx-4 mt-4 mb-6">
          {/* Exercise Type and Equipment Tags */}
          <View className="flex-row items-center flex-wrap gap-2 mb-4">
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(app)/(authenticated)/(modal)/exercises?exerciseTypes=${encodeURIComponent(exerciseDetails.exerciseType)}`,
                )
              }
            >
              <Badge variant="outline">
                <Text className="text-white text-xs">
                  {exerciseDetails.exerciseType}
                </Text>
              </Badge>
            </TouchableOpacity>

            {/* Equipment tags - clickable */}
            {exerciseDetails.equipment &&
              exerciseDetails.equipment
                .filter((equipment) => equipment !== null)
                .map((equipment) => (
                  <TouchableOpacity
                    key={equipment._id}
                    onPress={() =>
                      router.push(
                        `/(app)/(authenticated)/(modal)/exercises?equipmentIds=${equipment._id}`,
                      )
                    }
                  >
                    <Badge variant="outline">
                      <Text className="text-white text-xs">
                        {equipment.name}
                      </Text>
                    </Badge>
                  </TouchableOpacity>
                ))}

            {/* Videos Button */}
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(app)/(authenticated)/(modal)/exercise/${exerciseId}/videos`,
                )
              }
              className="ml-auto"
            >
              <View className="flex-row items-center bg-[#6F2DBD] px-3 py-1.5 rounded-lg">
                <Text className="text-white text-xs font-Poppins_500Medium ml-1">
                  Videos
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>

          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            {/* Description */}
            {exerciseDetails.description && (
              <View>
                <Text className="text-gray-300 text-sm font-Poppins_400Regular leading-5">
                  {exerciseDetails.description}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Workouts Section */}
        <View className="mx-4 mb-6">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
            Workouts
          </Text>

          {/* Start Workout Button */}
          <TouchableOpacity
            onPress={handleStartWorkout}
            className="bg-[#6F2DBD] rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons
                name={activeWorkout.isActive ? "add" : "play"}
                size={20}
                color="#ffffff"
              />
              <Text className="text-white font-Poppins_600SemiBold ml-2">
                {activeWorkout.isActive ? "Add to workout" : "Start workout"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recent Workouts */}
          {workoutSessions.length > 0 && (
            <View>
              <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-3">
                Recent Workouts
              </Text>
              <View className="space-y-3">
                {workoutSessions.slice(0, 3).map((session, workoutIndex) => {
                  const sessionSets = getSetsByWorkoutSession(
                    session.id,
                  ).filter((set) => set.exerciseId === exerciseId);

                  const formatWorkoutDate = (timestamp: number) => {
                    const date = new Date(timestamp);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (date.toDateString() === today.toDateString()) {
                      return "Today";
                    } else if (
                      date.toDateString() === yesterday.toDateString()
                    ) {
                      return "Yesterday";
                    } else {
                      return date.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year:
                          date.getFullYear() !== today.getFullYear()
                            ? "numeric"
                            : undefined,
                      });
                    }
                  };

                  const formatTimeDisplay = (timestamp: number) => {
                    const date = new Date(timestamp);
                    return date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                  };

                  const duration = session.endTime - session.startTime;
                  const durationMins = Math.round(duration / 60000);

                  // Calculate PR count for this session
                  const prCount = sessionSets.filter((set) => set.isPR).length;

                  return (
                    <TouchableOpacity
                      key={session.id}
                      className={`bg-[#1c1c1e] rounded-lg p-4 ${workoutIndex > 0 ? "mt-3" : ""}`}
                      onPress={() =>
                        router.push(
                          `/(app)/(authenticated)/(modal)/workout/${session.id}`,
                        )
                      }
                    >
                      {/* Workout Header */}
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1 mr-3">
                          <Text className="text-white font-Poppins_600SemiBold text-sm">
                            {session.name ||
                              formatWorkoutDate(session.startTime)}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <Text className="text-gray-400 text-xs">
                              {formatWorkoutDate(session.startTime)} •{" "}
                              {formatTimeDisplay(session.startTime)} •{" "}
                              {durationMins}min
                            </Text>
                            {prCount > 0 && (
                              <View className="bg-[#FFD700] rounded-full px-2 py-1">
                                <Text className="text-black text-xs font-Poppins_500Medium">
                                  {prCount} PR{prCount !== 1 ? "s" : ""}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className="bg-[#2c2c2e] w-8 h-8 rounded-lg items-center justify-center">
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#fff"
                          />
                        </View>
                      </View>

                      {/* Exercise Sets Details */}
                      <View className="mt-3">
                        <ExerciseSetsDisplay
                          exerciseDetail={{
                            _id: exerciseDetails._id,
                            title: exerciseDetails.title,
                            exerciseType: exerciseDetails.exerciseType,
                            equipment:
                              exerciseDetails.equipment
                                ?.filter((eq) => eq !== null)
                                .map((eq) => ({
                                  _id: eq._id,
                                  name: eq.name,
                                })) || [],
                            muscles: exerciseDetails.muscles,
                          }}
                          exerciseSets={sessionSets}
                          exerciseNotes={undefined}
                          showHeader={false}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Muscle Body Visualization */}
        <View className="mx-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
              Muscle Involvement
            </Text>

            <View className="items-center mb-4">
              <MuscleBody
                view="both"
                highlightedMuscles={highlightedMuscles}
                onMusclePress={handleMusclePress}
                width={250}
                height={400}
              />
            </View>
          </View>
        </View>

        {/* Filter Status Bar */}
        {selectedMuscleId && (
          <View className="mx-4 mb-4 bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="filter" size={16} color="#6F2DBD" />
              <Text className="text-white ml-2 font-Poppins_500Medium">
                Filtered: {formatMuscleName(selectedMuscleId)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedMuscleId(null)}>
              <View className="bg-[#1c1c1e] rounded-lg px-3 py-1">
                <Text className="text-gray-400 font-Poppins_400Regular">
                  Clear
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Muscle Groups by Role */}
        <View className="px-4">
          {(
            ["target", "synergist", "stabilizer", "lengthening"] as MuscleRole[]
          ).map((role) => {
            const muscles = musclesByRole[role];
            if (!muscles || muscles.length === 0) return null;

            // Filter muscles if one is selected
            const displayMuscles = selectedMuscleId
              ? muscles.filter((muscle) => muscle.svgId === selectedMuscleId)
              : muscles;

            if (displayMuscles.length === 0) return null;

            const isCollapsed = collapsedSections.has(role);

            return (
              <View key={role} className="mb-8">
                <TouchableOpacity
                  className="flex-row items-center mb-2"
                  onPress={() => toggleSection(role)}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: MUSCLE_ROLE_COLORS[role] }}
                  />
                  <View className="flex-1">
                    <Text className="text-white text-xl font-Poppins_600SemiBold">
                      {formatRoleName(role)} Muscles
                    </Text>
                    <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                      {MUSCLE_ROLE_EXPLANATIONS[role]}
                    </Text>
                  </View>
                  <Ionicons
                    name={isCollapsed ? "chevron-down" : "chevron-up"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {!isCollapsed && (
                  <View>
                    {displayMuscles.map((muscle, index) => {
                      const muscleProgress = svgIdProgress[muscle.svgId] || {
                        xp: 0,
                        goal: 500,
                        percentage: 0,
                        streak: 0,
                        sets: 0,
                      };
                      const progressColor = getProgressColor(
                        muscleProgress.percentage,
                        true,
                      );

                      return (
                        <View
                          key={muscle._id}
                          className={index > 0 ? "mt-4" : ""}
                        >
                          <Link
                            href={`/(app)/(authenticated)/(modal)/muscles/advanced/${muscle._id}`}
                            asChild
                          >
                            <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                              <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-1">
                                  <Text className="text-white text-lg font-Poppins_600SemiBold">
                                    {muscle.name}
                                  </Text>
                                  <View className="flex-row items-center gap-3 mt-2">
                                    <Badge variant="outline">
                                      <Text className="text-white text-xs">
                                        {getStreakEmoji(muscleProgress.streak)}{" "}
                                        {muscleProgress.streak} weeks
                                      </Text>
                                    </Badge>
                                    <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                      {muscleProgress.sets} sets
                                    </Text>
                                  </View>
                                </View>
                                <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
                                  <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#fff"
                                  />
                                </View>
                              </View>

                              {/* Progress Bar */}
                              <View className="mb-2">
                                <View className="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                                  <View
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(100, muscleProgress.percentage)}%`,
                                      backgroundColor: progressColor,
                                    }}
                                  />
                                </View>

                                <View className="flex-row justify-between items-center">
                                  <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                    {muscleProgress.xp} / {muscleProgress.goal}{" "}
                                    XP
                                  </Text>
                                  <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                    {muscleProgress.percentage}%
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Link>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
