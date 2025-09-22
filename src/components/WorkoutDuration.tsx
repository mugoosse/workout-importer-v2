import { workoutDurationAtom } from "@/store/activeWorkout";
import { useAtom } from "jotai";
import React from "react";
import { Text } from "react-native";

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}min ${seconds}s`;
};

export const WorkoutDuration: React.FC = () => {
  const [duration] = useAtom(workoutDurationAtom);

  return (
    <Text className="text-white text-sm font-Poppins_500Medium">
      {formatDuration(duration)}
    </Text>
  );
};
