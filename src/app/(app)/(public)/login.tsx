import { twFullConfig } from "@/utils/twconfig";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { makeRedirectUri } from "expo-auth-session";
import { Checkbox } from "expo-checkbox";
import { Link } from "expo-router";
import {
  maybeCompleteAuthSession,
  openAuthSessionAsync,
} from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export default function LoginScreen() {
  const { signIn } = useAuthActions();
  const [isTermsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState<
    "github" | "google" | "apple" | "email" | false
  >(false);
  const [showTermsError, setShowTermsError] = useState(false);

  const handleSignWithGitHubSSO = async () => {
    const { redirect } = await signIn("github", { redirectTo });

    if (Platform.OS === "web") {
      return;
    }

    const result = await openAuthSessionAsync(redirect!.toString(), redirectTo);

    if (result.type === "success") {
      const { url } = result;
      const code = new URL(url).searchParams.get("code")!;
      await signIn("github", { code });
    } else {
      throw new Error("GitHub SSO failed");
    }
  };

  const handleSignInWithSSO = async (
    strategy: "oauth_github" | "oauth_google" | "oauth_apple",
  ) => {
    if (!isTermsChecked) {
      setShowTermsError(true);
      setTimeout(() => setShowTermsError(false), 3000);
      return;
    }

    setShowTermsError(false);

    if (
      strategy === "oauth_google" ||
      strategy === "oauth_apple" ||
      strategy === "oauth_github"
    ) {
      setLoading(
        strategy.replace("oauth_", "") as "github" | "google" | "apple",
      );
    } else {
      setLoading(false);
    }

    try {
      if (strategy === "oauth_github") {
        await handleSignWithGitHubSSO();
      } else {
        throw new Error("SSO strategy not yet implemented");
      }
    } catch (err) {
      console.error("OAuth error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPress = (linkType: "terms" | "privacy") => {
    Linking.openURL(
      linkType === "terms"
        ? "https://mgo.rodeo/terms"
        : "https://mgo.rodeo/privacy",
    );
  };

  return (
    <View className="flex-1 bg-black pt-safe">
      <View className="flex-1 p-6">
        <View className="flex-row justify-end">
          <Link href="/faq" asChild>
            <TouchableOpacity className="bg-gray-700 rounded-xl p-2">
              <Feather name="help-circle" size={30} color="white" />
            </TouchableOpacity>
          </Link>
        </View>

        <View className="items-center mb-8 pt-8">
          <View className="flex-row">
            <Image
              source={require("@/assets/images/muscle-trophy-logo.png")}
              className="w-40 h-40"
            />
          </View>
          <Text className="text-gray-400 text-md mt-2 font-Poppins_400Regular">
            Muscle Trophy
          </Text>
        </View>

        <Pressable
          className="flex-row items-center"
          onPress={() => {
            const newValue = !isTermsChecked;
            setTermsChecked(newValue);
            if (showTermsError) {
              setShowTermsError(false);
            }
          }}
        >
          <Checkbox
            value={isTermsChecked}
            onValueChange={(newValue) => {
              setTermsChecked(newValue);
              if (showTermsError) {
                setShowTermsError(false);
              }
            }}
            color={
              isTermsChecked
                ? (twFullConfig.theme.colors as any).primary
                : undefined
            }
            className="mr-3"
          />
          <Text className="text-gray-400 text-md font-Poppins_500Medium flex-1 flex-wrap">
            I agree to the{" "}
            <Text
              className="text-white underline"
              onPress={(e) => {
                e.stopPropagation();
                handleLinkPress("terms");
              }}
            >
              Terms of Service
            </Text>{" "}
            and acknowledge the{" "}
            <Text
              className="text-white underline"
              onPress={(e) => {
                e.stopPropagation();
                handleLinkPress("privacy");
              }}
            >
              Privacy Policy
            </Text>
          </Text>
        </Pressable>

        {showTermsError && (
          <View className="bg-red-500 p-3 rounded-lg mt-4">
            <Text className="text-white text-center font-Poppins_500Medium">
              Please agree to the Terms of Service and Privacy Policy to
              continue
            </Text>
          </View>
        )}

        <View className="gap-4 mt-6">
          <Pressable
            className={`w-full flex-row justify-center items-center p-4 rounded-lg ${
              isTermsChecked ? "bg-gray-800" : "bg-gray-600 opacity-50"
            }`}
            onPress={() => handleSignInWithSSO("oauth_github")}
            disabled={!!loading}
          >
            {loading === "github" ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="logo-github" size={24} color="white" />
                <Text className="text-white text-center font-Poppins_600SemiBold ml-3 text-base">
                  Continue with GitHub
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className="w-full flex-row justify-center items-center bg-gray-600 p-4 rounded-lg opacity-50"
            onPress={() => handleSignInWithSSO("oauth_apple")}
            disabled={true}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={24} color="white" />
                <Text className="text-white text-center font-Poppins_600SemiBold ml-3 text-base">
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className="w-full flex-row justify-center items-center bg-gray-600 p-4 rounded-lg opacity-50"
            onPress={() => handleSignInWithSSO("oauth_google")}
            disabled={true}
          >
            {loading === "google" ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/google.webp")}
                  className="w-6 h-6"
                />
                <Text className="text-white text-center font-Poppins_600SemiBold ml-3 text-base">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
