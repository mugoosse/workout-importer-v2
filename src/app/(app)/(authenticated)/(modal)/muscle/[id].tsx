import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const muscle = useQuery(api.muscles.get, {
    muscleId: id as Id<"muscles">,
  });

  if (!muscle) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-dark">
      <Stack.Screen
        options={{
          title: muscle.name,
        }}
      />

      {/* Muscle Details */}
      <View className="mt-28 items-center">
        <Text>{muscle.name}</Text>
        <Text>{muscle.majorGroup}</Text>
        <Text>{muscle.anatomicalGroup}</Text>
        <Text>{muscle.svgId}</Text>
      </View>
    </View>
  );
};

export default Page;
