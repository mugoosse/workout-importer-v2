import { Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { TopCreateOption } from '@/components/TopCreateOption';
import { type MajorMuscleGroup } from '@/utils/muscleMapping';

const levelProgress = [
  { majorGroup: 'chest' as MajorMuscleGroup, level: 8, xp: 12450, nextLevel: 15000, percentage: 15, streak: 3 },
  { majorGroup: 'back' as MajorMuscleGroup, level: 9, xp: 16800, nextLevel: 20000, percentage: 35, streak: 2 },
  { majorGroup: 'legs' as MajorMuscleGroup, level: 10, xp: 22100, nextLevel: 25000, percentage: 60, streak: 6 },
  { majorGroup: 'shoulders' as MajorMuscleGroup, level: 6, xp: 8200, nextLevel: 10000, percentage: 85, streak: 1 },
  { majorGroup: 'arms' as MajorMuscleGroup, level: 7, xp: 9800, nextLevel: 12000, percentage: 105, streak: 8 },
  { majorGroup: 'core' as MajorMuscleGroup, level: 5, xp: 5900, nextLevel: 7500, percentage: 79, streak: 4 },
];

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


const Page = () => {
  const { group } = useLocalSearchParams<{ group: string }>();
  const majorGroup = group as MajorMuscleGroup;

  const muscleGroupData = levelProgress.find(item => item.majorGroup === majorGroup);

  if (!muscleGroupData) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg">Muscle group not found</Text>
      </View>
    );
  }

  const progressColor = getProgressColor(muscleGroupData.percentage);

  const handleSuggestExercises = () => {
    // TODO: Navigate to exercise suggestions
    console.log(`Suggest ${majorGroup} exercises`);
  };

  const handleShowBreakdown = () => {
    router.push(`/(app)/(authenticated)/(modal)/muscle-group/${majorGroup}/breakdown`);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-dark px-4 pt-4">
      <View className="flex-1 p-4 rounded-2xl">
        {/* Progress Section - Compact */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-2xl font-Poppins_600SemiBold capitalize">
              {majorGroup}
            </Text>
            <Badge variant="outline">
              <Text className="text-white">
                {getStreakEmoji(muscleGroupData.streak)} {muscleGroupData.streak} weeks
              </Text>
            </Badge>
          </View>

          <View className="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, muscleGroupData.percentage)}%`,
                backgroundColor: progressColor
              }}
            />
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {muscleGroupData.percentage}% of weekly goal
            </Text>
            {muscleGroupData.percentage >= 100 && (
              <Text className="text-emerald-500 text-sm font-Poppins_500Medium">
                Goal Met! 🎯
              </Text>
            )}
          </View>

          <Text className="text-gray-400 text-center text-sm font-Poppins_400Regular">
            {muscleGroupData.xp} / {muscleGroupData.nextLevel} XP
          </Text>
        </View>

        {/* Action Options */}
        <View className="flex-row gap-3 mb-3">
          <TopCreateOption
            icon={<Ionicons name="fitness-outline" size={24} color="white" />}
            title="Suggest Exercises"
            subtitle={`For ${majorGroup}`}
            onPress={handleSuggestExercises}
          />
          <TopCreateOption
            icon={<Ionicons name="analytics-outline" size={24} color="white" />}
            title="Show Breakdown"
            subtitle="Individual muscles"
            onPress={handleShowBreakdown}
          />
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={handleClose}
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