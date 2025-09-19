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

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [individualMuscleProgress] = useAtom(individualMuscleProgressAtom);

  const muscle = useQuery(api.muscles.get, {
    muscleId: id as Id<"muscles">,
  });

  if (!muscle) {
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
              {/* Target Exercises */}
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=target`,
                  )
                }
                className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: "#1FD224" }}
                  />
                  <View>
                    <Text className="text-white font-Poppins_500Medium">
                      Target Exercises
                    </Text>
                    <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                      Exercises that primarily work this muscle
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
              </TouchableOpacity>

              {/* Synergist Exercises */}
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=synergist`,
                  )
                }
                className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: "#FF8A1B" }}
                  />
                  <View>
                    <Text className="text-white font-Poppins_500Medium">
                      Synergist Exercises
                    </Text>
                    <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                      Exercises where this muscle assists
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
              </TouchableOpacity>

              {/* Stabilizer Exercises */}
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=stabilizer`,
                  )
                }
                className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: "#FCD514" }}
                  />
                  <View>
                    <Text className="text-white font-Poppins_500Medium">
                      Stabilizer Exercises
                    </Text>
                    <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                      Exercises where this muscle stabilizes
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
              </TouchableOpacity>

              {/* Lengthening Exercises */}
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/exercises?muscleId=${muscle._id}&muscleRole=lengthening`,
                  )
                }
                className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: "#3498DB" }}
                  />
                  <View>
                    <Text className="text-white font-Poppins_500Medium">
                      Lengthening Exercises
                    </Text>
                    <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                      Exercises that stretch this muscle
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
