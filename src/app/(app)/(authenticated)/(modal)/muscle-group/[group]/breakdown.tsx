import {
  MuscleBody,
  type MuscleColorPair,
} from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type MajorMuscleGroup } from "@/utils/muscleMapping";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Individual muscle progress data (mock data for now)
const individualMuscleProgress: Record<
  string,
  {
    xp: number;
    goal: number;
    percentage: number;
    streak: number;
    sets: number;
  }
> = {
  // Legs
  rectus_femoris: { xp: 450, goal: 500, percentage: 90, streak: 3, sets: 12 },
  vastus_lateralis: { xp: 380, goal: 500, percentage: 76, streak: 2, sets: 8 },
  vastus_medialis: { xp: 420, goal: 500, percentage: 84, streak: 4, sets: 10 },
  biceps_femoris: { xp: 350, goal: 500, percentage: 70, streak: 2, sets: 9 },
  semitendinosus: { xp: 280, goal: 400, percentage: 70, streak: 1, sets: 6 },
  gastrocnemius: { xp: 320, goal: 400, percentage: 80, streak: 3, sets: 8 },
  soleus: { xp: 260, goal: 400, percentage: 65, streak: 2, sets: 5 },
  gluteus_maximus: { xp: 480, goal: 500, percentage: 96, streak: 5, sets: 15 },
  gluteus_medius: { xp: 340, goal: 400, percentage: 85, streak: 3, sets: 7 },
  adductor_longus_and_pectineus: {
    xp: 200,
    goal: 300,
    percentage: 67,
    streak: 2,
    sets: 4,
  },
  adductor_magnus: { xp: 180, goal: 300, percentage: 60, streak: 1, sets: 3 },
  gracilis: { xp: 150, goal: 300, percentage: 50, streak: 1, sets: 2 },
  sartorius: { xp: 160, goal: 300, percentage: 53, streak: 1, sets: 3 },
  tensor_fasciae_latae: {
    xp: 140,
    goal: 300,
    percentage: 47,
    streak: 1,
    sets: 2,
  },
  peroneus_longus: { xp: 120, goal: 200, percentage: 60, streak: 2, sets: 3 },

  // Chest
  pectoralis_major: { xp: 120, goal: 500, percentage: 24, streak: 2, sets: 4 },
  serratus_anterior: { xp: 80, goal: 300, percentage: 27, streak: 1, sets: 2 },

  // Back
  latissimus_dorsi: { xp: 180, goal: 500, percentage: 36, streak: 2, sets: 6 },
  lower_trapezius: { xp: 160, goal: 400, percentage: 40, streak: 2, sets: 5 },
  rhomboid_muscles: { xp: 140, goal: 400, percentage: 35, streak: 1, sets: 4 },
  trapezius: { xp: 200, goal: 500, percentage: 40, streak: 3, sets: 7 },
  teres_major: { xp: 120, goal: 300, percentage: 40, streak: 1, sets: 3 },
  erector_spinae: { xp: 150, goal: 400, percentage: 38, streak: 2, sets: 5 },
  infraspinatus: { xp: 100, goal: 300, percentage: 33, streak: 1, sets: 3 },

  // Shoulders
  deltoids: { xp: 420, goal: 500, percentage: 84, streak: 4, sets: 12 },

  // Arms
  biceps_brachii: { xp: 520, goal: 500, percentage: 104, streak: 6, sets: 18 },
  triceps_brachii: { xp: 480, goal: 500, percentage: 96, streak: 5, sets: 16 },
  brachialis: { xp: 380, goal: 400, percentage: 95, streak: 4, sets: 12 },
  brachioradialis: { xp: 340, goal: 400, percentage: 85, streak: 3, sets: 10 },
  extensor_carpi_radialis: {
    xp: 280,
    goal: 300,
    percentage: 93,
    streak: 4,
    sets: 8,
  },
  flexor_carpi_radialis: {
    xp: 260,
    goal: 300,
    percentage: 87,
    streak: 3,
    sets: 7,
  },
  flexor_carpi_ulnaris: {
    xp: 240,
    goal: 300,
    percentage: 80,
    streak: 3,
    sets: 6,
  },

  // Core
  rectus_abdominis: { xp: 320, goal: 400, percentage: 80, streak: 4, sets: 10 },
  external_obliques: { xp: 280, goal: 400, percentage: 70, streak: 3, sets: 8 },
  omohyoid: { xp: 200, goal: 300, percentage: 67, streak: 2, sets: 5 },
  sternocleidomastoid: {
    xp: 180,
    goal: 300,
    percentage: 60,
    streak: 2,
    sets: 4,
  },
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "#1FD224";
  if (progress >= 75) return "#98DA00";
  if (progress >= 50) return "#FCD514";
  if (progress >= 25) return "#FF8A1B";
  return "#FF5C14";
};

const getStreakEmoji = (streak: number) => {
  if (streak >= 8) return "🔥";
  if (streak >= 4) return "💪";
  if (streak >= 2) return "⭐";
  return "👍";
};

const Page = () => {
  const { group } = useLocalSearchParams<{ group: string }>();
  const majorGroup = group as MajorMuscleGroup;
  const muscles = useQuery(api.muscles.list);

  if (!muscles) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Filter muscles by major group
  const filteredMuscles = muscles.filter(
    (muscle) => muscle.majorGroup === majorGroup,
  );

  // Create highlighted muscles for visualization
  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  filteredMuscles.forEach((muscle) => {
    if (seenMuscleIds.has(muscle.svgId)) {
      return;
    }
    seenMuscleIds.add(muscle.svgId);

    const muscleProgress = individualMuscleProgress[muscle.svgId];
    const progress = muscleProgress?.percentage || 0;
    const color = getProgressColor(progress);

    highlightedMuscles.push({
      muscleId: muscle.svgId,
      color,
    });
  });

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: `${majorGroup.charAt(0).toUpperCase() + majorGroup.slice(1)}: Muscle Breakdown`,
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18,
          },
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Muscle Body Visualization */}
        <View className="mx-4 mt-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="items-center">
              <MuscleBody
                view="both"
                highlightedMuscles={highlightedMuscles}
                width={250}
                height={400}
              />
            </View>
          </View>
        </View>

        {/* Muscle Library */}
        <View className="px-4">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
            {majorGroup.charAt(0).toUpperCase() + majorGroup.slice(1)}: Muscles
          </Text>

          <View>
            {filteredMuscles.map((muscle, index) => {
              const muscleProgress = individualMuscleProgress[muscle.svgId] || {
                xp: 0,
                goal: 500,
                percentage: 0,
                streak: 0,
                sets: 0,
              };
              const progressColor = getProgressColor(muscleProgress.percentage);

              return (
                <View key={muscle._id} className={index > 0 ? "mt-4" : ""}>
                  <Link
                    href={`/(app)/(authenticated)/(modal)/muscle/${muscle._id}`}
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
                            {muscleProgress.xp} / {muscleProgress.goal} XP
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
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
