import { Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MuscleBody, type MuscleColorPair } from '@/components/muscle-body/MuscleBody';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';

const levelProgress = [
  { majorGroup: 'chest', level: 8, xp: 12450, nextLevel: 15000, percentage: 15, streak: 3 },
  { majorGroup: 'back', level: 9, xp: 16800, nextLevel: 20000, percentage: 35, streak: 2 },
  { majorGroup: 'legs', level: 10, xp: 22100, nextLevel: 25000, percentage: 60, streak: 6 },
  { majorGroup: 'shoulders', level: 6, xp: 8200, nextLevel: 10000, percentage: 85, streak: 1 },
  { majorGroup: 'arms', level: 7, xp: 9800, nextLevel: 12000, percentage: 105, streak: 8 },
  { majorGroup: 'core', level: 5, xp: 5900, nextLevel: 7500, percentage: 79, streak: 4 },
];

const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#6F2DBD';
  if (progress >= 75) return '#A663CC';
  if (progress >= 50) return '#B298DC';
  if (progress >= 25) return '#B8D0EB';
  return '#E9FF70';
};

const getStreakEmoji = (streak: number) => {
  if (streak >= 8) return '🔥';
  if (streak >= 4) return '💪';
  if (streak >= 2) return '⭐';
  return '👍';
};

const ColorLegend = () => {
  const legendItems = [
    { color: '#E9FF70', label: '0-24%' },
    { color: '#B8D0EB', label: '25-49%' },
    { color: '#B298DC', label: '50-74%' },
    { color: '#A663CC', label: '75-99%' },
    { color: '#6F2DBD', label: '100%+' },
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
            width={250}
            height={400}
          />
          <ColorLegend />
        </View>
      </View>

      <View className="bg-[#1c1c1e] rounded-2xl p-4 mt-4">
        <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
          Major Muscle Groups
        </Text>

        <View>
          {levelProgress.map((group, index) => (
            <View key={group.majorGroup} className={`${index > 0 ? 'mt-6' : ''}`}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <Text className="text-white font-Poppins_500Medium capitalize">
                    {group.majorGroup}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Badge variant="outline">
                      <Text className="text-white">
                        {getStreakEmoji(group.streak)} {group.streak} weeks
                      </Text>
                    </Badge>
                  </View>
                </View>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                  {group.xp} / {group.nextLevel} XP
                </Text>
              </View>

              <ProgressBar value={group.percentage} className="my-2" />

              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                  {group.percentage}% of weekly goal
                </Text>
                {group.percentage >= 100 && (
                  <Text className="text-emerald-500 text-xs font-Poppins_500Medium">
                    Goal Met! 🎯
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};