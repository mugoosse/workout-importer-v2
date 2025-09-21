import {
  activeWorkoutAtom,
  discardWorkoutAction,
  workoutDurationAtom,
  workoutSetsCountAtom,
} from "@/store/activeWorkout";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { Alert, Text, TouchableOpacity, View } from "react-native";

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

export const ActiveWorkoutBanner = () => {
  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [duration] = useAtom(workoutDurationAtom);
  const [setsCount] = useAtom(workoutSetsCountAtom);
  const [, discardWorkout] = useAtom(discardWorkoutAction);

  // Don't show banner if not active
  if (!activeWorkout.isActive) {
    return null;
  }

  const handleResume = () => {
    router.push("/(app)/(authenticated)/(modal)/workout");
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Workout",
      "Are you sure you want to discard this workout? All progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            discardWorkout();
          },
        },
      ],
    );
  };

  return (
    <View className="bg-[#6F2DBD] p-4 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="barbell" size={20} color="white" />
        <View className="ml-3 flex-1">
          <Text className="text-white font-Poppins_600SemiBold text-sm">
            Workout in Progress
          </Text>
          <Text className="text-white/80 text-xs font-Poppins_400Regular">
            {formatDuration(duration)} • {setsCount} sets
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleDiscard}
          className="bg-white/20 px-3 py-2 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-white font-Poppins_500Medium text-xs">
            Discard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleResume}
          className="bg-white px-3 py-2 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-[#6F2DBD] font-Poppins_600SemiBold text-xs">
            Resume
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
