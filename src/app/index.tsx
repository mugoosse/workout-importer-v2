import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";

export default function Index() {
  const tasks = useQuery(api.tasks.getTasks);

  return (
    <View className="flex-1 pt-40 bg-dark">
      {tasks?.map(({ _id, text }) => (
        <Text key={_id} className="text-white">
          {text}
        </Text>
      ))}
    </View>
  );
}
