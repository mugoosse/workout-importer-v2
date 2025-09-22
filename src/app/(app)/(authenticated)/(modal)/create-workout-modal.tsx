import { RoutineSelectionModal } from "@/components/RoutineSelectionModal";
import { TopCreateOption } from "@/components/TopCreateOption";
import { startWorkoutAction } from "@/store/activeWorkout";
import {
  routineSelectionOpenAtom,
  shouldReopenModalAtom,
} from "@/store/routines";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Page = () => {
  const [, startWorkout] = useAtom(startWorkoutAction);
  const [, setRoutineSelectionOpen] = useAtom(routineSelectionOpenAtom);
  const [shouldReopenModal, setShouldReopenModal] = useAtom(
    shouldReopenModalAtom,
  );

  // Auto-reopen routine selection modal when returning from routine creation
  useEffect(() => {
    if (shouldReopenModal) {
      setRoutineSelectionOpen(true);
      setShouldReopenModal(false);
    }
  }, [shouldReopenModal, setRoutineSelectionOpen, setShouldReopenModal]);

  const onSelectExercises = () => {
    startWorkout({ startMethod: "quick-start" });
    router.push(
      "/(app)/(authenticated)/(modal)/workout/add-exercises?muscleFunctions=target&mode=workout",
    );
  };

  const onSelectRoutines = () => {
    setRoutineSelectionOpen(true);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-2">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-800">
        <View>
          <Text className="text-white text-xl font-Poppins_600SemiBold">
            Start Workout
          </Text>
          <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
            Choose how you want to train today
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          className="w-8 h-8 rounded-full bg-neutral-800 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <View className="flex-1 p-4 rounded-2xl">
        <View className="flex-row gap-3 mb-3">
          <TopCreateOption
            icon={<Ionicons name="add-outline" size={24} color="white" />}
            title="Quick Start"
            subtitle="Pick exercises and go"
            onPress={onSelectExercises}
          />
          <TopCreateOption
            icon={<Ionicons name="list-outline" size={24} color="white" />}
            title="Use Template"
            subtitle="Follow a pre-built routine"
            onPress={onSelectRoutines}
            disabled={false}
          />
        </View>
      </View>

      <RoutineSelectionModal />
    </View>
  );
};

export default Page;
