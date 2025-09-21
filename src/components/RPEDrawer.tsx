import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface RPEDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (rpe: number) => void;
  currentRPE: number;
  setNumber: number;
  isEdit?: boolean;
}

const RPE_DESCRIPTIONS: Record<
  number,
  { text: string; subtext: string; color: string }
> = {
  1: {
    text: "Very Easy",
    subtext: "Could continue for hours",
    color: "#10B981",
  },
  2: {
    text: "Easy",
    subtext: "Comfortable pace",
    color: "#34D399",
  },
  3: {
    text: "Light",
    subtext: "Warming up",
    color: "#6EE7B7",
  },
  4: {
    text: "Moderate",
    subtext: "Could do many more reps",
    color: "#86EFAC",
  },
  5: {
    text: "Somewhat Hard",
    subtext: "Could do 5 more reps",
    color: "#FCD34D",
  },
  6: {
    text: "Hard",
    subtext: "Could do 4 more reps",
    color: "#FBBF24",
  },
  7: {
    text: "Hard",
    subtext: "Could do 3 more reps",
    color: "#FB923C",
  },
  8: {
    text: "Very Hard",
    subtext: "Could do 2 more reps",
    color: "#F97316",
  },
  9: {
    text: "Extremely Hard",
    subtext: "Could do 1 more rep",
    color: "#EF4444",
  },
  10: {
    text: "Maximum Effort",
    subtext: "Could not do another rep",
    color: "#DC2626",
  },
};

export const RPEDrawer: React.FC<RPEDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  currentRPE,
  setNumber,
  isEdit = false,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSelectRPE = (rpe: number) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(rpe);
    setTimeout(onClose, 100);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1">
        <Animated.View
          className="absolute inset-0 bg-black"
          style={{
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          }}
        />
      </TouchableOpacity>

      <Animated.View
        className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl"
        style={{
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [screenHeight * 0.7, 0],
              }),
            },
          ],
          maxHeight: screenHeight * 0.7,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-800">
          <View>
            <Text className="text-white text-xl font-Poppins_600SemiBold">
              {isEdit ? "Edit RPE" : "Complete Set"} {setNumber}
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
              Rate your perceived exertion
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* RPE Grid */}
        <View className="flex-1 px-4 py-4">
          <View className="flex-row flex-wrap justify-between">
            {[...Array(10)].map((_, index) => {
              const rpe = index + 1;
              const description = RPE_DESCRIPTIONS[rpe];
              const isSelected = currentRPE === rpe;

              return (
                <TouchableOpacity
                  key={rpe}
                  onPress={() => handleSelectRPE(rpe)}
                  className={`w-[31%] mb-2 rounded-2xl p-3 border-2 ${
                    isSelected
                      ? "border-[#6F2DBD] bg-neutral-800"
                      : "border-neutral-800 bg-neutral-850"
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className="text-2xl font-Poppins_700Bold"
                      style={{ color: description.color }}
                    >
                      {rpe}
                    </Text>
                    {isSelected && (
                      <View className="w-5 h-5 rounded-full bg-[#6F2DBD] items-center justify-center">
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-xs font-Poppins_500Medium mb-1">
                    {description.text}
                  </Text>
                  <Text className="text-gray-500 text-xs font-Poppins_400Regular">
                    {description.subtext}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};
