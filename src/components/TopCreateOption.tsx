import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TopCreateOptionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const TopCreateOption = ({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
}: TopCreateOptionProps) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    className={`flex-1 items-center p-4 rounded-2xl ${
      disabled ? "bg-neutral-900 opacity-50" : "bg-neutral-800"
    }`}
  >
    <View className="mb-3">{icon}</View>
    <View className="items-center">
      <Text
        className={`text-lg font-Poppins_600SemiBold text-center ${
          disabled ? "text-gray-500" : "text-white"
        }`}
      >
        {title}
      </Text>
      <Text className="text-gray-400 font-Poppins_400Regular text-center">
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);
