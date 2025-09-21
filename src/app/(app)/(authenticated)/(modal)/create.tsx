import { TopCreateOption } from "@/components/TopCreateOption";
import { startWorkoutAction } from "@/store/activeWorkout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Page = () => {
  const [, startWorkout] = useAtom(startWorkoutAction);

  const onLogWorkout = () => {
    startWorkout();
    router.replace(
      "/(app)/(authenticated)/(modal)/workout/add-exercises?muscleFunctions=target",
    );
  };

  const onQuickStart = () => {
    // Disabled for now
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-2">
      {/* Grabber Handle */}
      <View className="items-center py-2">
        <View className="w-12 h-1 bg-gray-500 rounded-full" />
      </View>
      <View className="flex-1 p-4 rounded-2xl">
        <View className="flex-row gap-3 mb-3">
          <TopCreateOption
            icon={<Ionicons name="add-outline" size={24} color="white" />}
            title="Log Workout"
            subtitle="Select exercises"
            onPress={onLogWorkout}
          />
          <TopCreateOption
            icon={<Ionicons name="play-outline" size={24} color="gray" />}
            title="Quick Start"
            subtitle="Coming soon"
            onPress={onQuickStart}
            disabled={true}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full py-4 mb-8 bg-zinc-800 rounded-2xl"
        >
          <Text className="text-center text-lg text-gray-400 font-Poppins_600SemiBold">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Page;
