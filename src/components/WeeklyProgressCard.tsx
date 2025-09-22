import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { api } from "@/convex/_generated/api";
import {
  getGroupProgressForMuscle,
  getProgressColor,
  weeklyProgressAtom,
} from "@/store/weeklyProgress";
import {
  getMajorGroupFromMuscle,
  muscleToGroupMapping,
} from "@/utils/muscleMapping";
import { useQuery } from "convex/react";
import { router, usePathname, useSegments } from "expo-router";
import { useAtom } from "jotai";
import { Text, View } from "react-native";

const ColorLegend = () => {
  const legendItems = [
    { color: "#FF5C14", label: "0-24%" },
    { color: "#FF8A1B", label: "25-49%" },
    { color: "#FCD514", label: "50-74%" },
    { color: "#98DA00", label: "75-99%" },
    { color: "#1FD224", label: "100%+" },
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

const getCurrentWeekRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate Sunday of current week
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  // Calculate Saturday of current week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDate = (date: Date) => {
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      .toUpperCase()
      .replace(",", "");
  };

  return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
};

export const WeeklyProgressCard = () => {
  const muscles = useQuery(api.muscles.list);
  const [weeklyProgress] = useAtom(weeklyProgressAtom);
  const segments = useSegments();
  const pathname = usePathname();

  // Check if we're currently viewing a muscle group modal
  const muscleGroupIndex = (segments as string[]).findIndex(
    (segment) => segment === "muscle-group",
  );
  const isInMuscleGroupModal = muscleGroupIndex !== -1;

  // Extract muscle group from pathname
  let activeMuscleGroup: string | null = null;
  if (isInMuscleGroupModal && pathname) {
    const match = pathname.match(/\/muscle-group\/([^\/]+)/);
    activeMuscleGroup = match ? match[1] : null;
  }

  if (!muscles) {
    return null;
  }

  // Filter muscles by major group if modal is open, similar to muscles.tsx
  const filteredMuscles = activeMuscleGroup
    ? muscles.filter((muscle) => muscle.majorGroup === activeMuscleGroup)
    : muscles;

  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  filteredMuscles.forEach((muscle) => {
    if (seenMuscleIds.has(muscle.svgId)) {
      return;
    }
    seenMuscleIds.add(muscle.svgId);

    // Use group progress percentage instead of individual muscle progress
    const groupProgress = getGroupProgressForMuscle(
      muscle.svgId,
      weeklyProgress,
      muscleToGroupMapping,
    );
    const color = getProgressColor(groupProgress);

    highlightedMuscles.push({
      muscleId: muscle.svgId as MuscleId,
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
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-Poppins_600SemiBold">
            Weekly Progress
          </Text>
          <Text className="text-gray-400 text-sm font-Poppins_500Medium">
            {getCurrentWeekRange()}
          </Text>
        </View>

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
