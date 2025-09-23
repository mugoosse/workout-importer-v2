import { Platform, View } from "react-native";

export const GrabberHandle = () => {
  if (Platform.OS !== "android") {
    return null;
  }

  return (
    <View className="items-center py-2">
      <View className="w-12 h-1 bg-gray-500 rounded-full" />
    </View>
  );
};