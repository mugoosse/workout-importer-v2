import React from "react";
import { Text, View } from "react-native";

interface WorkoutSummaryProps {
  startTime: number;
  duration: number;
  totalSets: number;
  totalPRs?: number;
  totalXP?: number;
  showDateHeader?: boolean;
  variant?: "clean" | "card";
}

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}min ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    .toUpperCase()
    .replace(",", "");
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  startTime,
  duration,
  totalSets,
  totalPRs,
  totalXP,
  showDateHeader = true,
  variant = "clean",
}) => {
  return (
    <View>
      {/* Date and Start Time Header */}
      {showDateHeader && (
        <View className="mb-4">
          <Text className="text-gray-400 text-sm font-Poppins_400Regular">
            {formatDate(startTime)} • {formatTime(startTime)}
          </Text>
        </View>
      )}

      {/* Workout Stats */}
      <View
        className={
          variant === "card"
            ? "bg-neutral-800 rounded-xl p-4 flex-row justify-around"
            : "flex-row items-center space-x-4"
        }
      >
        <View
          className={
            variant === "card" ? "items-center" : "flex-1 items-center"
          }
        >
          <Text className="text-gray-400 text-xs font-Poppins_400Regular">
            Duration
          </Text>
          <Text className="text-white text-sm font-Poppins_500Medium">
            {formatDuration(duration)}
          </Text>
        </View>
        <View
          className={
            variant === "card" ? "items-center" : "flex-1 items-center"
          }
        >
          <Text className="text-gray-400 text-xs font-Poppins_400Regular">
            Sets
          </Text>
          <Text className="text-white text-sm font-Poppins_500Medium">
            {totalSets}
          </Text>
        </View>
        {totalPRs !== undefined && (
          <View
            className={
              variant === "card" ? "items-center" : "flex-1 items-center"
            }
          >
            <Text className="text-gray-400 text-xs font-Poppins_400Regular">
              PRs
            </Text>
            <Text className="text-white text-sm font-Poppins_500Medium">
              {totalPRs}
            </Text>
          </View>
        )}
        {totalXP !== undefined && (
          <View
            className={
              variant === "card" ? "items-center" : "flex-1 items-center"
            }
          >
            <Text className="text-gray-400 text-xs font-Poppins_400Regular">
              XP Earned
            </Text>
            <Text className="text-white text-sm font-Poppins_500Medium">
              {totalXP}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
