import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, Linking } from "react-native";

const Page = () => {
  const { url } = useLocalSearchParams<{ url: string }>();

  const handleLinkToSource = async () => {
    if (url) {
      await Linking.openURL(decodeURIComponent(url));
    }
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-4">
      <View className="flex-1 p-4 rounded-2xl">
        <TouchableOpacity
          onPress={handleLinkToSource}
          className="flex-row items-center justify-between py-4 px-4 bg-[#1c1c1e] rounded-2xl mb-3"
        >
          <View className="flex-row items-center">
            <View className="bg-[#6F2DBD] w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Ionicons name="link-outline" size={20} color="white" />
            </View>
            <Text className="text-white text-lg font-Poppins_600SemiBold">
              Link to source
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancel}
          className="w-full py-4 mb-8 bg-zinc-800 rounded-2xl"
        >
          <Text className="text-center text-lg text-gray-400 font-Poppins_600SemiBold">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Page;
