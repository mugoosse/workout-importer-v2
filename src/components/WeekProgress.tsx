import React from "react";
import { Pressable, Text, View } from "react-native";

interface WeekProgressProps {
  workoutDays?: number[];
  onDayPress?: (dayInfo: {
    dayIndex: number;
    dayLabel: string;
    hasWorkout: boolean;
    isToday: boolean;
    isPast: boolean;
  }) => void;
}

export const WeekProgress = ({
  workoutDays = [],
  onDayPress,
}: WeekProgressProps) => {
  const today = new Date().getDay();

  // Reorder days to start with Monday
  const days = [
    { label: "M", index: 1 },
    { label: "T", index: 2 },
    { label: "W", index: 3 },
    { label: "T", index: 4 },
    { label: "F", index: 5 },
    { label: "S", index: 6 },
    { label: "S", index: 0 },
  ];

  return (
    <View className="flex-row items-center justify-center mb-6">
      {days.map((day, idx) => {
        const isToday = day.index === today;
        const hasWorkout = workoutDays.includes(day.index);
        const isPast =
          today === 0
            ? day.index !== 0 // If today is Sunday, all other days are past
            : day.index < today && day.index !== 0; // Normal case, but Sunday (0) is never past unless today is Sunday

        return (
          <Pressable
            key={idx}
            onPress={() =>
              onDayPress?.({
                dayIndex: day.index,
                dayLabel: day.label,
                hasWorkout,
                isToday,
                isPast,
              })
            }
            className="mx-1"
          >
            <View className="items-center">
              <Text
                className={`text-[10px] mb-1 font-Poppins_500Medium ${isToday ? "text-white" : "text-gray-500"}`}
              >
                {day.label}
              </Text>
              <View
                className={`
                w-5 h-5 rounded
                ${hasWorkout ? "bg-[#6F2DBD]" : isPast ? "bg-gray-800" : "bg-[#2c2c2e]"}
              `}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
