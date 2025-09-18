import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TopCreateOptionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export const TopCreateOption = ({
  icon,
  title,
  subtitle,
  onPress,
}: TopCreateOptionProps) => (
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