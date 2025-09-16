import React from "react";
import { G, Path } from "react-native-svg";

export interface MuscleGroupProps {
  id: string;
  paths: string[];
  isHighlighted: boolean;
  highlightColor?: string;
  defaultColor?: string;
  onPress?: (muscleId: string) => void;
}

export const MuscleGroup: React.FC<MuscleGroupProps> = ({
  id,
  paths,
  isHighlighted,
  highlightColor = "#6F2DBD",
  defaultColor = "#E5E5E5",
  onPress,
}) => {
  const fillColor = isHighlighted ? highlightColor : defaultColor;
  const opacity = isHighlighted ? 0.8 : 0.6;

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  return (
    <G id={id} onPress={handlePress}>
      {paths.map((pathData, index) => (
        <Path
          key={`${id}-path-${index}`}
          d={pathData}
          fill={fillColor}
          opacity={opacity}
          stroke="none"
          strokeWidth={0}
        />
      ))}
    </G>
  );
};
