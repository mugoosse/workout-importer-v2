import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";
import { WeeklyProgressCard } from "@/components/WeeklyProgressCard";

const Page = () => {
  const muscles = useQuery(api.muscles.list);

  if (muscles === undefined) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg font-Poppins_500Medium">
          Loading muscles...
        </Text>
      </View>
    );
  }

  if (!muscles.length) {
    return (
      <View className="flex-1 bg-dark items-center justify-center p-4">
        <View className="items-center">
          <Ionicons name="film-outline" size={48} color="#6c6c6c" />
          <Text className="text-white text-xl font-Poppins_600SemiBold mt-4 text-center">
            No muscle yet
          </Text>
          <Text className="text-gray-400 text-base font-Poppins_400Regular mt-2 text-center">
            Please import the data first
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <View className="pt-6">
        <WeeklyProgressCard />
      </View>
    </View>
  );
};

export default Page;
