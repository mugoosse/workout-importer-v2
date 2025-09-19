import { MuscleBody, type MuscleId } from "@/components/muscle-body/MuscleBody";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAtom } from "jotai";
import {
  individualMuscleProgressAtom,
  getProgressColor,
} from "@/store/weeklyProgress";

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
  const [individualMuscleProgress] = useAtom(individualMuscleProgressAtom);

  const muscle = useQuery(api.muscles.get, {
    muscleId: id as Id<"muscles">,
  });

  const exerciseCounts = useQuery(api.muscles.getExerciseCounts, {
    muscleId: id as Id<"muscles">,
  });

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
  const muscleColor = getProgressColor(progressPercentage);

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: muscle.name,
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
          },
        }}
      />

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
