import { cn } from "@/utils/cn";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

interface SwipeableSetRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  canDelete: boolean;
  isCompleted: boolean;
  isPR?: boolean;
}

export const SwipeableSetRow: React.FC<SwipeableSetRowProps> = ({
  children,
  onDelete,
  canDelete,
  isCompleted,
  isPR = false,
}) => {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const RightActions = ({ progress }: { progress: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: progress.value }],
        opacity: progress.value,
      };
    });

    return (
      <View className="w-16 justify-center items-center mb-2">
        <Reanimated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              if (canDelete) {
                onDelete();
              }
            }}
            activeOpacity={0.7}
            className="rounded-lg justify-center items-center"
          >
            <Ionicons name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </Reanimated.View>
      </View>
    );
  };

  const renderRightActions = (progress: SharedValue<number>) => (
    <RightActions progress={progress} />
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={canDelete ? renderRightActions : undefined}
      overshootRight={false}
      rightThreshold={40}
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
        className={cn(
          "rounded-xl px-3 py-2 mb-1",
          isCompleted
            ? isPR
              ? "bg-purple-600/80"
              : "bg-green-600/80"
            : "bg-[#1c1c1e]",
        )}
      >
        {children}
      </View>
    </ReanimatedSwipeable>
  );
};
