import React from "react";
import { View, Text } from "react-native";
import { FrontBodyMuscleMap } from "@/data/frontBodySvg";
import { BackBodyMuscleMap } from "@/data/backBodySvg";
// TODO: Import muscle IDs when implementing highlighting
// import { FRONT_MUSCLE_IDS } from "@/data/frontBodySvg";
// import { BACK_MUSCLE_IDS } from "@/data/backBodySvg";

export interface Exercise {
  name: string;
  target_muscles: string[];
  synergist_muscles: string[];
  stabilizer_muscles: string[];
  lengthening_muscles: string[];
}

export interface MuscleColors {
  target: string;
  synergist: string;
  stabilizer: string;
  lengthening: string;
  inactive: string;
}

export interface Config {
  exercises: Record<string, Exercise>;
  muscle_colors: MuscleColors;
  muscle_to_svg_id?: Record<string, string>;
}

export type MuscleType =
  | "target"
  | "synergist"
  | "stabilizer"
  | "lengthening"
  | "inactive";

export type TabType = "exercise" | "progression";

export interface MuscleToggleState {
  target: boolean;
  synergist: boolean;
  stabilizer: boolean;
  lengthening: boolean;
}

interface BodyVisualizationProps {
  view: "front" | "back";
  getMuscleColor: (muscleName: string) => string;
  getAllActiveMuscles: () => Set<string>;
  muscleNameToId: (muscleName: string) => string;
  progressionMode?: boolean;
  progressionColor?: string;
}

export function BodyVisualization({
  view,
  getMuscleColor,
  getAllActiveMuscles,
  muscleNameToId,
  progressionMode = false,
  progressionColor,
}: BodyVisualizationProps) {
  // TODO: Add muscle highlighting logic here
  // const highlightedMuscles = useMemo(() => {
  //   // Logic to determine which muscles should be highlighted based on:
  //   // - getAllActiveMuscles()
  //   // - muscleNameToId()
  //   // - progressionMode and progressionColor
  // }, [view, progressionMode, progressionColor, getAllActiveMuscles, muscleNameToId]);

  const handleMusclePress = (muscleId: string) => {
    console.log(`Muscle pressed: ${muscleId}`);
  };

  return (
    <View className="bg-white rounded-2xl shadow-lg p-5 flex-1 min-w-[300px] max-w-[600px]">
      <Text className="text-center text-gray-800 mb-6 text-2xl font-bold capitalize">
        {view} View
      </Text>
      <View className="min-h-[600px] items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 p-5">
        {view === "front" ? (
          <FrontBodyMuscleMap
            width={350}
            height={500}
            highlightedMuscles={[]} // TODO: Add highlighting logic
            muscleColor="#E74C3C" // TODO: Use dynamic colors
            defaultColor="#BDC3C7"
            onMusclePress={handleMusclePress}
          />
        ) : (
          <BackBodyMuscleMap
            width={350}
            height={500}
            highlightedMuscles={[]} // TODO: Add highlighting logic
            muscleColor="#E74C3C" // TODO: Use dynamic colors
            defaultColor="#BDC3C7"
            onMusclePress={handleMusclePress}
          />
        )}
      </View>
    </View>
  );
}
