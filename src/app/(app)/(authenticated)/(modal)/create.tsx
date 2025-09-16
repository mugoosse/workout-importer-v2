import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TopCreateOption = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 items-center p-4 bg-neutral-800 rounded-2xl"
  >
    <View className="mb-3">{icon}</View>
    <View className="items-center">
      <Text className="text-white text-lg font-Poppins_600SemiBold text-center">
        {title}
      </Text>
      <Text className="text-gray-400 font-Poppins_400Regular text-center">
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);

const Page = () => {
  const onCustomWorkout = () => {
    console.log("Custom workout");
  };

  const onQuickStart = () => {
    console.log("Quick start");
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-4">
      <View className="flex-1 p-4 rounded-2xl">
        <View className="flex-row gap-3 mb-3">
          <TopCreateOption
            icon={<Ionicons name="add-outline" size={24} color="white" />}
            title="Custom Workout"
            subtitle="Start from scratch"
            onPress={onCustomWorkout}
          />
          <TopCreateOption
            icon={<Ionicons name="play-outline" size={24} color="white" />}
            title="Quick Start"
            subtitle="Start from routine"
            onPress={onQuickStart}
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
