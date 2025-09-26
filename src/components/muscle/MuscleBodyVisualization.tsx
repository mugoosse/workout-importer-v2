import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { Text, View } from "react-native";

interface MuscleBodyVisualizationProps {
  highlightedMuscles: MuscleColorPair[];
  size?: "small" | "medium" | "large" | "custom";
  width?: number;
  height?: number;
  view?: "front" | "back" | "both";
  onMusclePress?: (muscleId: MuscleId) => void;
  title?: string;
  footerText?: string;
  interactive?: boolean;
}

const getSizeProps = (size: "small" | "medium" | "large" | "custom") => {
  switch (size) {
    case "small":
      return { width: 200, height: 320 };
    case "medium":
      return { width: 250, height: 400 };
    case "large":
      return { width: 280, height: 400 };
    case "custom":
    default:
      return {};
  }
};

export const MuscleBodyVisualization = ({
  highlightedMuscles,
  size = "medium",
  width,
  height,
  view = "both",
  onMusclePress,
  title,
  footerText,
  interactive = false,
}: MuscleBodyVisualizationProps) => {
  const sizeProps = getSizeProps(size);
  const finalWidth = width || sizeProps.width || 280;
  const finalHeight = height || sizeProps.height || 400;

  return (
    <View className="mx-4 mb-6">
      <View className="bg-[#1c1c1e] rounded-2xl p-4 relative">
        {title && (
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4 text-center">
            {title}
          </Text>
        )}
        <View className="items-center">
          <MuscleBody
            highlightedMuscles={highlightedMuscles}
            width={finalWidth}
            height={finalHeight}
            view={view}
            onMusclePress={interactive ? onMusclePress : undefined}
          />
        </View>
        {footerText && (
          <Text className="absolute bottom-4 left-0 right-0 text-gray-400 text-sm font-Poppins_400Regular mt-4 text-center">
            {footerText}
          </Text>
        )}
      </View>
    </View>
  );
};
