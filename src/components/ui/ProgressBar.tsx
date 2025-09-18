import { View } from "react-native";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export const ProgressBar = ({ value, className = "" }: ProgressBarProps) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <View
      className={`bg-gray-700 rounded-full h-3 overflow-hidden ${className}`}
    >
      <View
        className="bg-[#6F2DBD] h-full rounded-full"
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
};
