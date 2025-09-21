import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge } from "./ui/Badge";

const { width } = Dimensions.get("window");

interface VideoData {
  _id: string;
  position: number;
  title: string;
  link: string;
  thumbnail: string;
  clip?: string;
  source: string;
  sourceIcon?: string;
  channel: string;
  searchQuery: string;
  searchDate: number;
}

interface ExerciseVideoPlayerProps {
  videos: VideoData[];
  isVisible: boolean;
  onClose: () => void;
  initialVideoIndex?: number;
}

export const ExerciseVideoPlayer = ({
  videos,
  isVisible,
  onClose,
  initialVideoIndex = 0,
}: ExerciseVideoPlayerProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);

  if (!videos || videos.length === 0) return null;

  const currentVideo = videos[currentVideoIndex];

  const handlePlayVideo = () => {
    Linking.openURL(currentVideo.link).catch(() => {
      Alert.alert("Error", "Unable to open video link");
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-dark">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
          <Text className="text-white text-lg font-Poppins_600SemiBold flex-1">
            Exercise Videos
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Video Player Area */}
          <View className="bg-black">
            <View className="relative">
              <Image
                source={{ uri: currentVideo.thumbnail }}
                style={{
                  width: width,
                  height: (width * 9) / 16, // 16:9 aspect ratio
                }}
                className="bg-gray-900"
                resizeMode="cover"
              />

              {/* Play overlay */}
              <TouchableOpacity
                onPress={handlePlayVideo}
                className="absolute inset-0 items-center justify-center"
                activeOpacity={0.8}
              >
                <View className="bg-black/70 rounded-full w-20 h-20 items-center justify-center">
                  <Ionicons name="play" size={32} color="#ffffff" />
                </View>
              </TouchableOpacity>

              {/* Position badge */}
              <View className="absolute top-4 left-4">
                <Badge variant="outline">
                  <Text className="text-white text-sm">
                    #{currentVideo.position}
                  </Text>
                </Badge>
              </View>

              {/* Source badge */}
              <View className="absolute top-4 right-4">
                <Badge variant="outline">
                  <Text className="text-white text-sm">
                    {currentVideo.source}
                  </Text>
                </Badge>
              </View>
            </View>
          </View>

          {/* Video Info */}
          <View className="p-4">
            <Text className="text-white text-xl font-Poppins_600SemiBold mb-3">
              {currentVideo.title}
            </Text>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-300 text-lg font-Poppins_500Medium">
                  {currentVideo.channel}
                </Text>
                <Text className="text-gray-500 text-sm font-Poppins_400Regular">
                  Search: &quot;{currentVideo.searchQuery}&quot; •{" "}
                  {formatDate(currentVideo.searchDate)}
                </Text>
              </View>
            </View>

            {/* Play Button */}
            <TouchableOpacity
              onPress={handlePlayVideo}
              className="bg-[#6F2DBD] rounded-xl p-4 flex-row items-center justify-center mb-6"
            >
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text className="text-white font-Poppins_600SemiBold ml-2">
                Open Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Video Selection (if multiple videos) */}
          {videos.length > 1 && (
            <View className="px-4 pb-4">
              <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
                Other Videos ({videos.length})
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {videos.map((video, index) => (
                  <TouchableOpacity
                    key={video._id}
                    onPress={() => setCurrentVideoIndex(index)}
                    className={`mr-3 ${index === currentVideoIndex ? "" : "opacity-70"}`}
                    activeOpacity={0.7}
                  >
                    <View
                      className={`bg-[#1c1c1e] rounded-xl overflow-hidden border-2 ${
                        index === currentVideoIndex
                          ? "border-[#6F2DBD]"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        source={{ uri: video.thumbnail }}
                        style={{
                          width: 120,
                          height: 68, // 16:9 aspect ratio for small thumbnails
                        }}
                        className="bg-gray-800"
                        resizeMode="cover"
                      />

                      {/* Play icon for non-current videos */}
                      {index !== currentVideoIndex && (
                        <View className="absolute inset-0 items-center justify-center">
                          <View className="bg-black/50 rounded-full w-8 h-8 items-center justify-center">
                            <Ionicons name="play" size={12} color="#ffffff" />
                          </View>
                        </View>
                      )}

                      <View className="p-2">
                        <Text
                          className="text-white text-xs font-Poppins_500Medium"
                          numberOfLines={2}
                        >
                          {video.title}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
