import React, { useRef } from "react";
import { Text, TouchableOpacity, View, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

interface SwipeableSetRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  canDelete: boolean;
  isCompleted: boolean;
}

export const SwipeableSetRow: React.FC<SwipeableSetRowProps> = ({
  children,
  onDelete,
  canDelete,
  isCompleted,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedAddition,
    dragX: Animated.AnimatedAddition,
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return (
      <View className="flex-1 bg-red-600 rounded-xl justify-center items-center">
        <Animated.View
          style={{
            transform: [{ scale }],
            opacity,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              if (canDelete) {
                onDelete();
              }
            }}
            className="bg-red-600 px-8 py-4 rounded-lg items-center justify-center min-w-[80px]"
            activeOpacity={0.7}
          >
            <Text className="text-white font-Poppins_700Bold text-base">
              DELETE
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={canDelete ? renderRightActions : undefined}
      overshootRight={false}
      rightThreshold={50}
      friction={1.5}
      enableTrackpadTwoFingerGesture
      onSwipeableOpen={(direction) => {
        if (direction === "right" && !canDelete) {
          // If can't delete, immediately close the swipeable
          swipeableRef.current?.close();
        }
      }}
    >
      <View
        className={`border border-[#2c2c2e] rounded-xl p-3 mb-3 ${
          isCompleted ? "bg-green-600/20" : "bg-[#1c1c1e]"
        }`}
      >
        {children}
      </View>
    </Swipeable>
  );
};
