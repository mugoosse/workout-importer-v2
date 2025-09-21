import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSetAtom } from "jotai";
import { removeExerciseFromWorkoutAction } from "@/store/activeWorkout";

const Page = () => {
  const { exerciseId, targetMuscleGroups } = useLocalSearchParams<{
    exerciseId: string;
    targetMuscleGroups?: string;
  }>();

  const removeExercise = useSetAtom(removeExerciseFromWorkoutAction);

  const handleReplaceExercise = () => {
    const params = new URLSearchParams({
      replacingExercise: exerciseId,
    });

    if (targetMuscleGroups) {
      params.set("majorGroups", targetMuscleGroups);
    }

    router.replace(`/workout/add-exercises?${params}`);
  };

  const handleRemoveExercise = () => {
    removeExercise(exerciseId as any);
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-2">
      {/* Grabber Handle */}
      <View className="items-center py-2">
        <View className="w-12 h-1 bg-gray-500 rounded-full" />
      </View>
      <View className="flex-1 p-4 rounded-2xl">
        {/* Replace Exercise */}
        <TouchableOpacity
          onPress={handleReplaceExercise}
          className="flex-row items-center justify-between py-4 px-4 bg-[#1c1c1e] rounded-2xl mb-3"
        >
          <View className="flex-row items-center">
            <View className="bg-[#6F2DBD] w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color="white"
              />
            </View>
            <Text className="text-white text-lg font-Poppins_600SemiBold">
              Replace Exercise
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
        </TouchableOpacity>

        {/* Remove Exercise */}
        <TouchableOpacity
          onPress={handleRemoveExercise}
          className="flex-row items-center justify-between py-4 px-4 bg-[#1c1c1e] rounded-2xl mb-3"
        >
          <View className="flex-row items-center">
            <View className="bg-red-600 w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Ionicons name="trash-outline" size={20} color="white" />
            </View>
            <Text className="text-white text-lg font-Poppins_600SemiBold">
              Remove Exercise
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="red" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancel}
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
