import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
    <ScrollView className="flex-1 bg-dark">
      <View className="pt-6">
        <WeeklyProgressCard />

        <View className="px-4 mt-4">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
            Muscle Library
          </Text>

          <View>
            {muscles.map((muscle, index) => (
              <View key={muscle._id} className={index > 0 ? 'mt-4' : ''}>
                <Link
                  href={`/(app)/(authenticated)/(modal)/muscle/${muscle._id}`}
                  asChild
                >
                  <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4 flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-Poppins_600SemiBold">
                        {muscle.name}
                      </Text>
                      <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
                        {muscle.majorGroup}
                      </Text>
                    </View>
                    <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
                      <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </Link>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Page;
