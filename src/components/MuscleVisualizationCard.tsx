import {
  MuscleBody,
  type MuscleColorPair,
} from "@/components/muscle-body/MuscleBody";
import React from "react";
import { Text, View } from "react-native";

interface MuscleVisualizationCardProps {
  beforeMuscleColors: MuscleColorPair[];
  afterMuscleColors: MuscleColorPair[];
}

export const MuscleVisualizationCard: React.FC<
  MuscleVisualizationCardProps
> = ({ beforeMuscleColors, afterMuscleColors }) => {
  // Don't render if no muscle data
  if (beforeMuscleColors.length === 0 && afterMuscleColors.length === 0) {
    return null;
  }

  return (
    <View className="px-4 py-6 border-b border-neutral-700">
      <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
        Muscle Progress Impact
      </Text>
      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="text-gray-400 text-sm font-Poppins_500Medium mb-2">
            Before Workout
          </Text>
          <MuscleBody
            view="both"
            highlightedMuscles={beforeMuscleColors}
            width={100}
            height={170}
          />
        </View>
        <View className="items-center">
          <Text className="text-gray-400 text-sm font-Poppins_500Medium mb-2">
            After Workout
          </Text>
          <MuscleBody
            view="both"
            highlightedMuscles={afterMuscleColors}
            width={100}
            height={170}
          />
        </View>
      </View>
    </View>
  );
};
