import { useAuthActions } from "@convex-dev/auth/react";
import { Button, View } from "react-native";

export default function LogoutScreen() {
  const { signOut } = useAuthActions();
  return (
    <View className="flex-1 items-center justify-center">
      <Button onPress={() => void signOut()} title="Log out" />
    </View>
  );
}
