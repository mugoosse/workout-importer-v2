import { MuscleBody, type MuscleId } from "@/components/muscle-body/MuscleBody";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

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

  const getMajorGroupIcon = (group: string) => {
    switch (group) {
      case "chest":
        return "fitness-outline";
      case "back":
        return "body-outline";
      case "legs":
        return "walk-outline";
      case "shoulders":
        return "barbell-outline";
      case "arms":
        return "barbell-outline";
      case "core":
        return "body-outline";
      default:
        return "fitness-outline";
    }
  };

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
          {/* Muscle major group Card */}
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-[#6F2DBD] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons
                  name={getMajorGroupIcon(muscle.majorGroup)}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Muscle Group
              </Text>
            </View>
            <Text className="text-gray-300 text-base font-Poppins_400Regular ml-13 font-mono">
              {muscle.majorGroup}
            </Text>
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
                { muscleId: muscle.svgId as MuscleId, color: "#6F2DBD" },
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

          {/* Muscle ID Card */}
          <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="code-outline" size={20} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Muscle Identifier
              </Text>
            </View>
            <Text className="text-gray-300 text-base font-Poppins_400Regular ml-13 font-mono">
              {muscle.svgId}
            </Text>
          </View>

          {/* Function & Exercises Card */}
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="barbell-outline" size={20} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Related Exercises
              </Text>
            </View>
            <Text className="text-gray-400 text-base font-Poppins_400Regular ml-13 italic">
              Exercise recommendations coming soon...
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
