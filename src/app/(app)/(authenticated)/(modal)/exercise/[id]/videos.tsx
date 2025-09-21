import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAction, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const spacing = 16; // 4 units * 4 = 16px
const itemWidth = (screenWidth - spacing * 3) / 2; // 3 gaps: left margin, center, right margin

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = id as Id<"exercises">;
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const exerciseDetails = useQuery(api.exercises.getExerciseDetails, {
    exerciseId,
  });

  const videos = useQuery(api.exerciseVideos.getVideosForExercise, {
    exerciseId,
  });

  const searchVideos = useAction(api.exerciseVideoActions.searchAndStoreVideos);

  const handleSearchVideos = async () => {
    if (!exerciseDetails?.title) return;

    setIsSearching(true);
    try {
      await searchVideos({
        exerciseId,
        searchQuery: exerciseDetails.title,
      });
    } catch {
      Alert.alert(
        "Search Failed",
        "Unable to search for videos. Please check your internet connection and try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleVideoPress = (video: any) => {
    Linking.openURL(video.link).catch(() => {
      Alert.alert("Error", "Unable to open video link");
    });
  };

  const onRefresh = async () => {
    if (!exerciseDetails?.title) return;

    setRefreshing(true);
    try {
      await searchVideos({
        exerciseId,
        searchQuery: exerciseDetails.title,
      });
    } catch {
      // Silently fail on refresh
    } finally {
      setRefreshing(false);
    }
  };

  if (!exerciseDetails) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const cleanExerciseTitle = (title: string) => {
    return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  };

  return (
    <View className="flex-1 bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6F2DBD"
          />
        }
      >
        {/* Exercise Info Header */}
        <View className="mx-4 mt-4 mb-6">
          <Text className="text-white text-xl font-Poppins_600SemiBold mb-2">
            {cleanExerciseTitle(exerciseDetails.title)}
          </Text>
          <Text className="text-gray-400 text-sm font-Poppins_400Regular">
            {videos?.length || 0} videos found
          </Text>
        </View>

        {/* Videos Grid */}
        {videos && videos.length > 0 ? (
          <View className="mx-4">
            <View className="flex-row flex-wrap justify-between">
              {videos
                .sort((a, b) => {
                  // Sort by searchDate descending (newest first)
                  if (a.searchDate !== b.searchDate) {
                    return b.searchDate - a.searchDate;
                  }
                  // Then by position ascending (lowest position first)
                  return a.position - b.position;
                })
                .map((video, index) => (
                  <TouchableOpacity
                    key={video._id}
                    onPress={() => handleVideoPress(video)}
                    className="mb-4"
                    style={{ width: itemWidth }}
                    activeOpacity={0.7}
                  >
                    <View className="bg-[#1c1c1e] rounded-xl overflow-hidden">
                      {/* Thumbnail with TikTok-like aspect ratio */}
                      <View className="relative">
                        <Image
                          source={{ uri: video.thumbnail }}
                          style={{
                            width: itemWidth,
                            height: itemWidth * 1.77, // 9:16 aspect ratio (16/9 = 1.77)
                          }}
                          className="bg-gray-800"
                          resizeMode="cover"
                        />

                        {/* Play overlay */}
                        <View className="absolute inset-0 items-center justify-center">
                          <View className="bg-black/40 rounded-full w-14 h-14 items-center justify-center">
                            <Ionicons name="play" size={24} color="#ffffff" />
                          </View>
                        </View>

                        {/* Position badge - top left */}
                        <View className="absolute top-2 left-2">
                          <View className="bg-black/70 rounded-full px-2 py-1">
                            <Text className="text-white text-xs font-bold">
                              #{video.position}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Video Info - more compact like TikTok */}
                      <View className="p-2">
                        <Text
                          className="text-white text-sm font-Poppins_500Medium mb-1"
                          numberOfLines={2}
                        >
                          {video.title}
                        </Text>

                        <View className="flex-row items-center justify-between">
                          <Text
                            className="text-gray-400 text-xs font-Poppins_400Regular flex-1"
                            numberOfLines={1}
                          >
                            {video.channel}
                          </Text>

                          {/* Source badge - smaller and more subtle */}
                          <View className="bg-gray-700 rounded px-2 py-0.5">
                            <Text className="text-gray-300 text-xs">
                              {video.source}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ) : (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-4 mt-20">
            <View className="bg-[#1c1c1e] rounded-2xl p-8 items-center">
              <View className="bg-[#2c2c2e] rounded-full w-16 h-16 items-center justify-center mb-4">
                <Ionicons name="videocam-outline" size={32} color="#6F2DBD" />
              </View>

              <Text className="text-white text-lg font-Poppins_600SemiBold mb-2 text-center">
                No videos found
              </Text>

              <Text className="text-gray-400 text-sm font-Poppins_400Regular mb-6 text-center leading-5">
                Search for exercise videos to help you learn proper form and
                technique.
              </Text>

              <TouchableOpacity
                onPress={handleSearchVideos}
                disabled={isSearching}
                className="bg-[#6F2DBD] rounded-xl px-6 py-3 flex-row items-center"
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="search" size={20} color="#ffffff" />
                )}
                <Text className="text-white font-Poppins_600SemiBold ml-2">
                  {isSearching ? "Searching..." : "Search Videos"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Search Again Button (when videos exist) */}
        {videos && videos.length > 0 && (
          <View className="mx-4 mt-6">
            <TouchableOpacity
              onPress={handleSearchVideos}
              disabled={isSearching}
              className="bg-[#2c2c2e] rounded-xl p-4 flex-row items-center justify-center"
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#6F2DBD" />
              ) : (
                <Ionicons name="refresh" size={20} color="#6F2DBD" />
              )}
              <Text className="text-white font-Poppins_500Medium ml-2">
                {isSearching ? "Searching..." : "Search for More Videos"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Page;
