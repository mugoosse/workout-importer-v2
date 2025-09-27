import {
  MuscleBody,
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import { WeekProgress } from "@/components/WeekProgress";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import { workoutSessionsAtom } from "@/store/exerciseLog";
import {
  getMuscleProgress,
  getProgressColor,
  svgIdProgressAtom,
} from "@/store/weeklyProgress";
import {
  getGroupFromMuscle,
  muscleToIntermediateGroupMapping,
} from "@/utils/muscleMapping";
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

const getWorkoutDaysForCurrentWeek = (workoutSessions: any[]) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();

  // Calculate Sunday of current week
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  // Calculate Saturday of current week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Filter workouts for current week and extract days
  const workoutDays = workoutSessions
    .filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    })
    .map((session) => new Date(session.date).getDay())
    .filter((day, index, array) => array.indexOf(day) === index); // Remove duplicates

  return workoutDays;
};

export const WeeklyProgressCard = () => {
  const { data: muscles } = useCachedQuery(api.muscles.list, {});
  const [svgIdProgress] = useAtom(svgIdProgressAtom);
  const [workoutSessions] = useAtom(workoutSessionsAtom);
  const segments = useSegments();
  const pathname = usePathname();

  // Check if we're currently viewing a muscle modal
  const muscleIndex = (segments as string[]).findIndex(
    (segment) => segment === "muscles",
  );
  const isInMuscleModal = muscleIndex !== -1;

  // Extract muscle group from pathname (support both basic and intermediate)
  let activeMuscleGroup: string | null = null;
  if (isInMuscleModal && pathname) {
    const basicMatch = pathname.match(/\/muscles\/basic\/([^\/]+)/);
    const intermediateMatch = pathname.match(
      /\/muscles\/intermediate\/([^\/]+)/,
    );
    activeMuscleGroup = basicMatch
      ? basicMatch[1]
      : intermediateMatch
        ? intermediateMatch[1]
        : null;
  }

  if (!muscles) {
    return null;
  }

  // Filter muscles by group if modal is open
  const filteredMuscles = activeMuscleGroup
    ? muscles.filter((muscle) => {
        // Check if it's a major group (basic) or intermediate group
        const isMajorGroup = muscle.majorGroup === activeMuscleGroup;
        const isIntermediateGroup =
          muscleToIntermediateGroupMapping[muscle.svgId] === activeMuscleGroup;
        return isMajorGroup || isIntermediateGroup;
      })
    : muscles;

  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  filteredMuscles.forEach((muscle) => {
    if (seenMuscleIds.has(muscle.svgId)) {
      return;
    }
    seenMuscleIds.add(muscle.svgId);

    // Use individual muscle progress for consistent colors across all pages
    const muscleProgress = getMuscleProgress(muscle.svgId, svgIdProgress, true);
    const color = getProgressColor(muscleProgress.percentage, true);

    highlightedMuscles.push({
      muscleId: muscle.svgId as MuscleId,
      color,
    });
  });

  const handleMusclePress = (muscleId: MuscleId) => {
    const intermediateGroup = getGroupFromMuscle(muscleId);
    router.push(
      `/(app)/(authenticated)/(modal)/muscles/intermediate/${intermediateGroup}`,
    );
  };

  const handleDayPress = (dayInfo: {
    dayIndex: number;
    dayLabel: string;
    hasWorkout: boolean;
    isToday: boolean;
    isPast: boolean;
  }) => {
    console.log("Day pressed:", dayInfo);

    if (!dayInfo.hasWorkout && !dayInfo.isPast) {
      // Allow planning future workouts
      router.push("/(app)/(authenticated)/(modal)/create-workout-modal");
    } else if (dayInfo.isPast) {
      // For past days, always navigate to workouts page with date filter for that specific date
      const today = new Date();
      const dayOffset = dayInfo.dayIndex - today.getDay();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);

      const dateString = targetDate.toISOString().split("T")[0];

      // Always filter to the specific date, whether there are workouts or not
      router.push(
        `/(app)/(authenticated)/(modal)/workouts?startDate=${dateString}&endDate=${dateString}`,
      );
    }
  };

  // Get workout days for current week
  const workoutDays = getWorkoutDaysForCurrentWeek(workoutSessions);

  return (
    <View className="mx-4 pt-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-xl font-Poppins_600SemiBold">
          Weekly Progress
        </Text>
        <Text className="text-gray-400 text-sm font-Poppins_500Medium">
          {getCurrentWeekRange()}
        </Text>
      </View>

      <View className="bg-[#1c1c1e] rounded-2xl p-4">
        <WeekProgress workoutDays={workoutDays} onDayPress={handleDayPress} />

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
