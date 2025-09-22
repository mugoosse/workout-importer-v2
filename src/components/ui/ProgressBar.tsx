import { View } from "react-native";

interface ProgressBarProps {
  value: number;
  rounded?: boolean;
  className?: string;
}

export const ProgressBar = ({
  value,
  rounded = true,
  className = "",
}: ProgressBarProps) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <View
      className={`overflow-hidden ${rounded ? "rounded-full" : ""} ${className || "bg-gray-700 h-3"}`}
    >
      <View
        className={`bg-[#6F2DBD] h-full ${rounded ? "rounded-full" : ""}`}
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
};
