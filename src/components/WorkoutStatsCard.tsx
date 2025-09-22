import React from "react";
import { Text, View } from "react-native";

interface WorkoutStatsCardProps {
  startTime: number;
  duration: number;
  totalSets: number;
  totalXP?: number;
}

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}min`;
  } else {
    return `${totalSeconds}s`;
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const WorkoutStatsCard: React.FC<WorkoutStatsCardProps> = ({
  startTime,
  duration,
  totalSets,
  totalXP,
}) => {
  return (
    <View className="flex-row justify-around bg-[#1c1c1e] rounded-xl p-4">
      <View className="items-center">
        <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
          Start Time
        </Text>
        <Text className="text-white text-lg font-Poppins_600SemiBold">
          {formatTime(startTime)}
        </Text>
      </View>
      <View className="items-center">
        <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
          Duration
        </Text>
        <Text className="text-white text-lg font-Poppins_600SemiBold">
          {formatDuration(duration)}
        </Text>
      </View>
      <View className="items-center">
        <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
          Total Sets
        </Text>
        <Text className="text-white text-lg font-Poppins_600SemiBold">
          {totalSets}
        </Text>
      </View>
      {totalXP !== undefined && (
        <View className="items-center">
          <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
            XP Earned
          </Text>
          <Text className="text-white text-lg font-Poppins_600SemiBold">
            {totalXP}
          </Text>
        </View>
      )}
    </View>
  );
};
