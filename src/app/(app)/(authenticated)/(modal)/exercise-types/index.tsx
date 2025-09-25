import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { Link } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

const getExerciseTypeIcon = (exerciseType: string) => {
  const icons: Record<string, string> = {
    "Weight Reps": "barbell-outline",
    "Reps Only": "body-outline",
    "Weighted Bodyweight": "fitness-outline",
    "Assisted Bodyweight": "accessibility-outline",
    Duration: "time-outline",
    "Weight & Duration": "timer-outline",
    "Distance & Duration": "speedometer-outline",
    "Weight & Distance": "walk-outline",
  };
  return icons[exerciseType] || "fitness-outline";
};

const getExerciseTypeColor = (exerciseType: string) => {
  const colors: Record<string, string> = {
    "Weight Reps": "#FF6B6B",
    "Reps Only": "#4ECDC4",
    "Weighted Bodyweight": "#45B7D1",
    "Assisted Bodyweight": "#96CEB4",
    Duration: "#FFEAA7",
    "Weight & Duration": "#DDA0DD",
    "Distance & Duration": "#FFB6C1",
    "Weight & Distance": "#98FB98",
  };
  return colors[exerciseType] || "#6F2DBD";
};

const Page = () => {
  // Get all exercise types with counts and descriptions
  const { data: exerciseTypes } = useCachedQuery(
    api.exercises.getExerciseTypesWithCounts,
    {},
  );

  if (!exerciseTypes) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      {/* Header */}
      <View className="px-4 pt-4 pb-4">
        <Text className="text-white text-xl font-Poppins_600SemiBold">
          Browse by Exercise Types
        </Text>
        <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
          Find exercises by training style and format
        </Text>
      </View>

      {/* Exercise Types List */}
      <View className="px-4" style={{ flex: 1 }}>
        {exerciseTypes.length === 0 ? (
          <View className="bg-[#1c1c1e] rounded-2xl p-6 items-center">
            <Ionicons name="fitness-outline" size={48} color="#666" />
            <Text className="text-white text-lg font-Poppins_600SemiBold mt-4 mb-2">
              No exercise types found
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
              No exercises available in the database.
            </Text>
          </View>
        ) : (
          <LegendList
            data={exerciseTypes}
            keyExtractor={(item) => item.exerciseType}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: exerciseType, index }) => (
              <View className={index > 0 ? "mt-4" : ""}>
                <Link
                  href={{
                    pathname: "/(app)/(authenticated)/(modal)/exercises/",
                    params: { exerciseTypes: exerciseType.exerciseType },
                  }}
                  asChild
                >
                  <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                          style={{
                            backgroundColor: getExerciseTypeColor(
                              exerciseType.exerciseType,
                            ),
                          }}
                        >
                          <Ionicons
                            name={
                              getExerciseTypeIcon(
                                exerciseType.exerciseType,
                              ) as any
                            }
                            size={20}
                            color="#fff"
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="text-white text-lg font-Poppins_600SemiBold mb-1">
                            {exerciseType.exerciseType}
                          </Text>

                          <Text className="text-gray-400 text-sm font-Poppins_400Regular mb-2">
                            {exerciseType.description}
                          </Text>

                          <View className="flex-row items-center gap-3">
                            <Badge variant="outline">
                              <Text className="text-white text-xs">
                                {exerciseType.exerciseCount} exercise
                                {exerciseType.exerciseCount !== 1 ? "s" : ""}
                              </Text>
                            </Badge>
                          </View>
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
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Page;
