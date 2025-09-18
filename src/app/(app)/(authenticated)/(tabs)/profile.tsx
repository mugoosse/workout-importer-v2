import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import { WeeklyProgressCard } from "@/components/WeeklyProgressCard";

const Page = () => {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const user = useQuery(api.users.viewer);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const causeError = () => {
    throw new Error("Test error");
  };

  return (
    <ScrollView className="flex-1 bg-dark">
      <View className="pt-12">
        <WeeklyProgressCard />

        <View className="items-center px-4">
          <Text className="text-white text-2xl font-Poppins_600SemiBold mb-6">
            {user?.name}&apos;s profile
          </Text>
          <Button title="Sign Out" onPress={handleSignOut} />
          <Button title="Cause Error" onPress={causeError} />
        </View>
      </View>
    </ScrollView>
  );
};

export default Page;
