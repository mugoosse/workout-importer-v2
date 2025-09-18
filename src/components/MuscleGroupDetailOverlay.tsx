import { Modal, Pressable, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { type MajorMuscleGroup } from '@/utils/muscleMapping';

interface MuscleGroupData {
  majorGroup: MajorMuscleGroup;
  level: number;
  xp: number;
  nextLevel: number;
  percentage: number;
  streak: number;
}

interface MuscleGroupDetailOverlayProps {
  visible: boolean;
  onClose: () => void;
  muscleGroupData: MuscleGroupData | null;
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#1FD224';
  if (progress >= 75) return '#98DA00';
  if (progress >= 50) return '#FCD514';
  if (progress >= 25) return '#FF8A1B';
  return '#FF5C14';
};

const getStreakEmoji = (streak: number) => {
  if (streak >= 8) return '🔥';
  if (streak >= 4) return '💪';
  if (streak >= 2) return '⭐';
  return '👍';
};

export const MuscleGroupDetailOverlay = ({
  visible,
  onClose,
  muscleGroupData,
}: MuscleGroupDetailOverlayProps) => {
  if (!muscleGroupData) return null;

  const progressColor = getProgressColor(muscleGroupData.percentage);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable
          className="bg-[#1c1c1e] rounded-3xl p-6 w-full max-w-sm"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-2xl font-Poppins_600SemiBold capitalize">
              {muscleGroupData.majorGroup}
            </Text>
            <Badge variant="outline">
              <Text className="text-white">
                {getStreakEmoji(muscleGroupData.streak)} {muscleGroupData.streak} weeks
              </Text>
            </Badge>
          </View>

          {/* Progress Bar */}
          <View className="mb-4">
            <View
              className="bg-gray-700 rounded-full h-4 overflow-hidden mb-3"
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, muscleGroupData.percentage)}%`,
                  backgroundColor: progressColor
                }}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                {muscleGroupData.percentage}% of weekly goal
              </Text>
              {muscleGroupData.percentage >= 100 && (
                <Text className="text-emerald-500 text-sm font-Poppins_500Medium">
                  Goal Met! 🎯
                </Text>
              )}
            </View>
          </View>

          {/* XP Display */}
          <View className="mb-6">
            <Text className="text-gray-400 text-center font-Poppins_400Regular">
              {muscleGroupData.xp} / {muscleGroupData.nextLevel} XP
            </Text>
          </View>

          {/* CTA Button */}
          <Pressable
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: progressColor }}
            onPress={() => {
              // TODO: Navigate to exercise suggestions
              console.log(`Suggest ${muscleGroupData.majorGroup} exercises`);
              onClose();
            }}
          >
            <Text className="text-white font-Poppins_600SemiBold text-lg">
              Suggest {muscleGroupData.majorGroup.charAt(0).toUpperCase() + muscleGroupData.majorGroup.slice(1)} Exercises
            </Text>
          </Pressable>

          {/* Close hint */}
          <Text className="text-gray-500 text-center text-xs font-Poppins_400Regular mt-4">
            Tap outside to close
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};