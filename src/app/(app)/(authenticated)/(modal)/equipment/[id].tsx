import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const equipmentId = id as Id<"equipment">;

  // Get equipment details
  const equipment = useQuery(api.exercises.getAllEquipment, {});
  const selectedEquipment = equipment?.find((e) => e._id === equipmentId);

  // Set the title dynamically when equipment data loads
  useLayoutEffect(() => {
    if (selectedEquipment?.name) {
      navigation.setOptions({
        title: selectedEquipment.name,
      });
    }
  }, [navigation, selectedEquipment?.name]);

  // Get exercises that use this equipment
  const exercises = useQuery(api.exercises.getExercisesByEquipment, {
    equipmentId,
  });

  if (!selectedEquipment) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Group exercises by type for statistics
  const exercisesByType =
    exercises?.reduce(
      (acc, exercise) => {
        if (exercise) {
          const type = exercise.exerciseType;
          if (!acc[type]) acc[type] = 0;
          acc[type]++;
        }
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  const handleViewExercises = () => {
    router.push(
      `/(app)/(authenticated)/(modal)/exercises?equipmentIds=${equipmentId}`,
    );
  };

  return (
    <View className="flex-1 bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Equipment Overview */}
        <View className="mx-4 mt-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#6F2DBD] w-12 h-12 rounded-xl items-center justify-center mr-4">
                <Ionicons name="barbell-outline" size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-Poppins_600SemiBold">
                  {selectedEquipment.name}
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                  Equipment
                </Text>
              </View>
            </View>

            {/* Exercise Count */}
            <View className="bg-[#2c2c2e] rounded-xl p-3 mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-Poppins_500Medium">
                  Total Exercises
                </Text>
                <Badge variant="outline">
                  <Text className="text-white text-sm">
                    {exercises?.length || 0}
                  </Text>
                </Badge>
              </View>
            </View>

            {/* View Exercises Button */}
            <TouchableOpacity
              onPress={handleViewExercises}
              className="bg-[#6F2DBD] rounded-xl p-4 flex-row items-center justify-center"
            >
              <Ionicons name="list-outline" size={20} color="#fff" />
              <Text className="text-white font-Poppins_600SemiBold ml-2">
                View All Exercises
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercise Types Breakdown */}
        {Object.keys(exercisesByType).length > 0 && (
          <View className="mx-4 mb-6">
            <View className="bg-[#1c1c1e] rounded-2xl p-4">
              <View className="flex-row items-center mb-4">
                <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color="#6F2DBD"
                  />
                </View>
                <Text className="text-white text-lg font-Poppins_600SemiBold">
                  Exercise Types
                </Text>
              </View>

              <View className="space-y-3">
                {Object.entries(exercisesByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <View
                      key={type}
                      className="flex-row items-center justify-between"
                    >
                      <Text className="text-white font-Poppins_500Medium flex-1">
                        {type}
                      </Text>
                      <Badge variant="outline">
                        <Text className="text-white text-sm">{count}</Text>
                      </Badge>
                    </View>
                  ))}
              </View>
            </View>
          </View>
        )}

        {/* Equipment Information */}
        <View className="mx-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#6F2DBD"
                />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Equipment Details
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-400 font-Poppins_500Medium">
                  Equipment ID
                </Text>
                <Text className="text-white font-Poppins_400Regular font-mono text-sm">
                  {selectedEquipment._id}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-gray-400 font-Poppins_500Medium">
                  Name
                </Text>
                <Text className="text-white font-Poppins_400Regular">
                  {selectedEquipment.name}
                </Text>
              </View>

              {exercises && exercises.length > 0 && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-400 font-Poppins_500Medium">
                    Most Common Type
                  </Text>
                  <Text className="text-white font-Poppins_400Regular">
                    {Object.entries(exercisesByType)[0]?.[0] || "N/A"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Sample Exercises Preview */}
        {exercises && exercises.length > 0 && (
          <View className="mx-4">
            <View className="bg-[#1c1c1e] rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                    <Ionicons
                      name="fitness-outline"
                      size={20}
                      color="#6F2DBD"
                    />
                  </View>
                  <Text className="text-white text-lg font-Poppins_600SemiBold">
                    Sample Exercises
                  </Text>
                </View>
                {exercises.length > 3 && (
                  <TouchableOpacity onPress={handleViewExercises}>
                    <Text className="text-[#6F2DBD] font-Poppins_500Medium">
                      View All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="space-y-3">
                {exercises?.slice(0, 3).map((exercise) =>
                  exercise ? (
                    <TouchableOpacity
                      key={exercise._id}
                      onPress={() =>
                        router.push(
                          `/(app)/(authenticated)/(modal)/exercise/${exercise._id}`,
                        )
                      }
                      className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between"
                    >
                      <View className="flex-1">
                        <Text className="text-white font-Poppins_500Medium mb-1">
                          {exercise.title}
                        </Text>
                        <Badge variant="outline">
                          <Text className="text-white text-xs">
                            {exercise.exerciseType}
                          </Text>
                        </Badge>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#6F2DBD"
                      />
                    </TouchableOpacity>
                  ) : null,
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Page;
