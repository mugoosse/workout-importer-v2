import React, { useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

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
  const swipeableRef = useRef<SwipeableMethods>(null);

  const RightActions = ({
    progress,
    dragX,
  }: {
    progress: SharedValue<number>;
    dragX: SharedValue<number>;
  }) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: progress.value }],
        opacity: progress.value,
      };
    });

    return (
      <View className="w-20 justify-center items-center mb-4">
        <Reanimated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              if (canDelete) {
                onDelete();
              }
            }}
            activeOpacity={0.7}
            className="rounded-xl p-4 justify-center items-center"
          >
            <Ionicons name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </Reanimated.View>
      </View>
    );
  };

  const renderRightActions = (
    progress: SharedValue<number>,
    dragX: SharedValue<number>,
    swipeableMethods: any,
  ) => <RightActions progress={progress} dragX={dragX} />;

  return (
    <ReanimatedSwipeable
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
    </ReanimatedSwipeable>
  );
};
