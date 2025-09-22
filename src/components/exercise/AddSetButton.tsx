import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AddSetButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export const AddSetButton: React.FC<AddSetButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  return (
    <View className="px-4 pb-4">
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className="bg-[#1c1c1e] rounded-xl p-3 flex-row items-center justify-center"
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color="white" />
        <Text className="text-white font-Poppins_500Medium ml-1 text-sm">
          Add Set
        </Text>
      </TouchableOpacity>
    </View>
  );
};
