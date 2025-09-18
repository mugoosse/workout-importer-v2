import {
  BACK_MUSCLE_IDS,
  BackBodyMuscleMap,
  BackMuscleId,
  type BackMuscleColorPair,
} from "@/components/muscle-body/backBodySvg";
import {
  FRONT_MUSCLE_IDS,
  FrontBodyMuscleMap,
  FrontMuscleId,
  type FrontMuscleColorPair,
} from "@/components/muscle-body/frontBodySvg";
import { fillColors } from "@/utils/muscleColors";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type BodyView = "front" | "back" | "both";
export type MuscleId = FrontMuscleId | BackMuscleId;

export interface MuscleColorPair {
  muscleId: MuscleId;
  color: string;
}

export interface MuscleBodyProps {
  view?: BodyView;
  highlightedMuscles?: MuscleColorPair[];
  onMusclePress?: (muscleId: MuscleId) => void;
  width?: number;
  height?: number;
}

export const MuscleBody: React.FC<MuscleBodyProps> = ({
  view = "both",
  highlightedMuscles = [],
  onMusclePress,
  width = 300,
  height = 500,
}) => {
  const muscleColorPairs: MuscleColorPair[] = highlightedMuscles;

  // Separate muscle-color pairs by body view
  const frontMuscles: FrontMuscleColorPair[] = muscleColorPairs
    .filter((pair) => FRONT_MUSCLE_IDS.includes(pair.muscleId as FrontMuscleId))
    .map((pair) => ({
      muscleId: pair.muscleId as FrontMuscleId,
      color: pair.color,
    }));

  const backMuscles: BackMuscleColorPair[] = muscleColorPairs
    .filter((pair) => BACK_MUSCLE_IDS.includes(pair.muscleId as BackMuscleId))
    .map((pair) => ({
      muscleId: pair.muscleId as BackMuscleId,
      color: pair.color,
    }));
  const [currentView, setCurrentView] = useState<BodyView>(
    view === "both" ? "front" : view
  );

  const renderBodyView = (bodyView: "front" | "back") => {
    const isfront = bodyView === "front";

    if (isfront) {
      return (
        <FrontBodyMuscleMap
          width={width}
          height={height}
          defaultMuscleColor={fillColors.outline2}
          highlightedMuscles={frontMuscles}
          onMusclePress={onMusclePress}
        />
      );
    } else {
      return (
        <BackBodyMuscleMap
          width={width}
          height={height}
          defaultMuscleColor={fillColors.outline2}
          highlightedMuscles={backMuscles}
          onMusclePress={onMusclePress}
        />
      );
    }
  };

  const renderViewToggle = () => {
    return (
      <View className="flex-row bg-[#2c2c2e] rounded-xl p-1 mb-4">
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-lg ${
            currentView === "front" ? "bg-[#6F2DBD]" : ""
          }`}
          onPress={() => setCurrentView("front")}
        >
          <Text
            className={`text-center font-Poppins_500Medium ${
              currentView === "front" ? "text-white" : "text-gray-400"
            }`}
          >
            Front
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-lg ${
            currentView === "back" ? "bg-[#6F2DBD]" : ""
          }`}
          onPress={() => setCurrentView("back")}
        >
          <Text
            className={`text-center font-Poppins_500Medium ${
              currentView === "back" ? "text-white" : "text-gray-400"
            }`}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (view === "front" || currentView === "front") {
      return <View className="items-center">{renderBodyView("front")}</View>;
    }

    if (view === "back" || currentView === "back") {
      return <View className="items-center">{renderBodyView("back")}</View>;
    }

    // Both view - side by side
    return (
      <View className="flex-row justify-center space-x-4">
        <View className="items-center">
          <Text className="text-gray-400 font-Poppins_500Medium mb-2">
            Front
          </Text>
          {renderBodyView("front")}
        </View>
        <View className="items-center">
          <Text className="text-gray-400 font-Poppins_500Medium mb-2">
            Back
          </Text>
          {renderBodyView("back")}
        </View>
      </View>
    );
  };

  return (
    <View className="items-center">
      {renderViewToggle()}
      {renderContent()}
    </View>
  );
};
