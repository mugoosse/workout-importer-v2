import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

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
    <View className="flex-1 bg-dark items-center justify-center">
      <Text className="text-white text-2xl font-Poppins_600SemiBold">
        {user?.name}&apos;s profile
      </Text>
      <Button title="Sign Out" onPress={handleSignOut} />

      <Button title="Cause Error" onPress={causeError} />
    </View>
  );
};

export default Page;
