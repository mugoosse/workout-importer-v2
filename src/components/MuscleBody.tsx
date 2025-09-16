import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FrontBodyMuscleMap, type FrontMuscleId } from "@/data/frontBodySvg";
import { BackBodyMuscleMap, type BackMuscleId } from "@/data/backBodySvg";

export type BodyView = "front" | "back" | "both";
export type MuscleId = FrontMuscleId | BackMuscleId;

export interface MuscleBodyProps {
  view?: BodyView;
  highlightedMuscle?: MuscleId;
  highlightColor?: string;
  onMusclePress?: (muscleId: MuscleId) => void;
  width?: number;
  height?: number;
}

export const MuscleBody: React.FC<MuscleBodyProps> = ({
  view = "both",
  highlightedMuscle,
  highlightColor = "#6F2DBD",
  onMusclePress,
  width = 300,
  height = 500,
}) => {
  const [currentView, setCurrentView] = useState<BodyView>(view);

  const renderBodyView = (bodyView: "front" | "back") => {
    const isfront = bodyView === "front";

    if (isfront) {
      return (
        <FrontBodyMuscleMap
          width={width}
          height={height}
          highlightedMuscles={
            highlightedMuscle ? [highlightedMuscle as FrontMuscleId] : []
          }
          muscleColor={highlightColor}
          onMusclePress={onMusclePress}
          style={{ backgroundColor: "transparent" }}
        />
      );
    } else {
      return (
        <BackBodyMuscleMap
          width={width}
          height={height}
          highlightedMuscles={
            highlightedMuscle ? [highlightedMuscle as BackMuscleId] : []
          }
          muscleColor={highlightColor}
          onMusclePress={onMusclePress}
          style={{ backgroundColor: "transparent" }}
        />
      );
    }
  };

  const renderViewToggle = () => {
    if (view !== "both") return null;

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
