import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function XPInfo() {
  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-Poppins_600SemiBold">
          XP & Progress Info
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* XP Attribution Section */}
        <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            How XP Works
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular mb-2">
            • Each workout automatically logs XP based on volume (sets × reps ×
            weight)
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular mb-2">
            • XP is distributed to the specific muscles trained during each
            exercise
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular">
            • Personal Records (PRs) provide bonus XP multipliers
          </Text>
        </View>

        {/* Progress Levels Section */}
        <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            Progress Levels
          </Text>

          <View className="mb-3">
            <Text className="text-[#6F2DBD] font-Poppins_500Medium mb-1">
              Individual Muscles (Advanced View)
            </Text>
            <Text className="text-gray-300 font-Poppins_400Regular text-sm">
              Track progress for specific muscles that are distinguishable on
              the muscle body diagram
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-[#6F2DBD] font-Poppins_500Medium mb-1">
              Muscle Groups (Intermediate View)
            </Text>
            <Text className="text-gray-300 font-Poppins_400Regular text-sm">
              Aggregated progress for related muscles (e.g., all tricep heads
              combined)
            </Text>
          </View>

          <View>
            <Text className="text-[#6F2DBD] font-Poppins_500Medium mb-1">
              Major Groups (Basic View)
            </Text>
            <Text className="text-gray-300 font-Poppins_400Regular text-sm">
              Highest level groupings (e.g., all chest muscles, all leg muscles)
            </Text>
          </View>
        </View>

        {/* Weekly Targets Section */}
        <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            Weekly Targets & Reset
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular mb-2">
            • Each week, XP points reset to zero for a fresh start
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular mb-2">
            • Minimum goal: Complete targets at the major group level
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular">
            • Optimal goal: Complete targets for each individual muscle
          </Text>
        </View>

        {/* Personal Records Section */}
        <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            Personal Records (PRs)
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular mb-2">
            • PRs are automatically detected when you lift heavier than before
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular mb-2">
            • PR workouts receive bonus XP multipliers
          </Text>
          <Text className="text-gray-300 font-Poppins_400Regular">
            • This encourages progressive overload and strength gains
          </Text>
        </View>

        {/* Color Guide Section */}
        <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-6">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            Progress Color Guide
          </Text>

          <View className="flex-row items-center mb-2">
            <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
            <Text className="text-gray-300 font-Poppins_400Regular">
              Red: 0-25% complete
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <View className="w-4 h-4 rounded-full bg-orange-500 mr-3" />
            <Text className="text-gray-300 font-Poppins_400Regular">
              Orange: 25-50% complete
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <View className="w-4 h-4 rounded-full bg-yellow-500 mr-3" />
            <Text className="text-gray-300 font-Poppins_400Regular">
              Yellow: 50-75% complete
            </Text>
          </View>

          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
            <Text className="text-gray-300 font-Poppins_400Regular">
              Green: 75-100% complete
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
