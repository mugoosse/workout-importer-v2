import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import {
  maybeCompleteAuthSession,
  openAuthSessionAsync,
} from "expo-web-browser";
import { Button, Platform, View } from "react-native";

maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export default function LoginScreen() {
  const { signIn } = useAuthActions();
  const handleSignIn = async () => {
    const { redirect } = await signIn("github", { redirectTo });
    if (Platform.OS === "web") {
      return;
    }

    const result = await openAuthSessionAsync(redirect!.toString(), redirectTo);

    if (result.type === "success") {
      const { url } = result;
      const code = new URL(url).searchParams.get("code")!;
      await signIn("github", { code });
    }
  };
  return (
    <View className="flex-1 items-center justify-center">
      <Button onPress={handleSignIn} title="Sign in with GitHub" />
    </View>
  );
}
