import { Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { api } from '@/convex/_generated/api';
import { MuscleBody, type MuscleColorPair, type MuscleId } from '@/components/muscle-body/MuscleBody';
import { getMajorGroupFromMuscle, type MajorMuscleGroup } from '@/utils/muscleMapping';

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


const ColorLegend = () => {
  const legendItems = [
    { color: '#FF5C14', label: '0-24%' },
    { color: '#FF8A1B', label: '25-49%' },
    { color: '#FCD514', label: '50-74%' },
    { color: '#98DA00', label: '75-99%' },
    { color: '#1FD224', label: '100%' },
  ];

  return (
    <View className="flex-row justify-center gap-4 mt-4">
      {legendItems.map((item) => (
        <View key={item.label} className="items-center">
          <View
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <Text className="text-white text-xs font-Poppins_400Regular mt-1">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const WeeklyProgressCard = () => {
  const muscles = useQuery(api.muscles.list);

  if (!muscles) {
    return null;
  }

  const progressMap = new Map(
    levelProgress.map(item => [item.majorGroup, item.percentage])
  );

  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  muscles.forEach(muscle => {
    if (seenMuscleIds.has(muscle.svgId)) {
      return;
    }
    seenMuscleIds.add(muscle.svgId);

    const progress = progressMap.get(muscle.majorGroup) || 0;
    const color = getProgressColor(progress);

    highlightedMuscles.push({
      muscleId: muscle.svgId,
      color,
    });
  });

  const handleMusclePress = (muscleId: MuscleId) => {
    const majorGroup = getMajorGroupFromMuscle(muscleId);
    router.push(`/(app)/(authenticated)/(modal)/muscle-group/${majorGroup}`);
  };

  return (
    <View className="mx-4 mb-6">
      <View className="bg-[#1c1c1e] rounded-2xl p-4">
        <Text className="text-white text-xl font-Poppins_600SemiBold mb-4 text-center">
          Weekly Progress
        </Text>

        <View className="items-center">
          <MuscleBody
            view="both"
            highlightedMuscles={highlightedMuscles}
            onMusclePress={handleMusclePress}
            width={250}
            height={400}
          />
          <ColorLegend />
        </View>
      </View>
    </View>
  );
};