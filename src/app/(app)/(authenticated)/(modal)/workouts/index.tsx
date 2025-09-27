import {
  loggedSetsAtom,
  workoutSessionsAtom,
  type WorkoutSession,
} from "@/store/exerciseLog";
import {
  formatDuration,
  formatLastLoggedDate,
  formatTime,
} from "@/utils/timeFormatters";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { router, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// WorkoutSessionCard component - reused from home.tsx
const WorkoutSessionCard = ({ session }: { session: WorkoutSession }) => {
  const [loggedSets] = useAtom(loggedSetsAtom);
  const duration = session.endTime - session.startTime;

  // Calculate PR count for this workout session
  const prCount = loggedSets
    .filter((set) => set.workoutSessionId === session.id)
    .filter((set) => set.isPR).length;

  return (
    <TouchableOpacity
      className="bg-[#1c1c1e] rounded-xl p-4 mb-3"
      onPress={() =>
        router.push(`/(app)/(authenticated)/(modal)/workout/${session.id}`)
      }
    >
      {/* Workout Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-white font-Poppins_600SemiBold text-base">
            {session.name || "Workout"}
          </Text>
          <Text className="text-gray-400 text-sm font-Poppins_400Regular">
            {formatLastLoggedDate(session.date)} •{" "}
            {formatTime(session.startTime)} • {formatDuration(duration)}
          </Text>
        </View>

        <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs font-Poppins_500Medium">
            {session.totalSets} sets
          </Text>
        </View>
        <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs font-Poppins_500Medium">
            {session.exercises.length} exercise
            {session.exercises.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {prCount > 0 && (
          <View className="bg-[#FFD700] rounded-full px-3 py-1">
            <Text className="text-black text-xs font-Poppins_500Medium">
              {prCount} PR{prCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
        {session.totalXP > 0 && (
          <View className="bg-[#2c2c2e] rounded-full px-3 py-1">
            <Text className="text-[#6F2DBD] text-xs font-Poppins_500Medium">
              +{session.totalXP} XP
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter Status Bar component
const FilterStatusBar = ({
  startDate,
  endDate,
  onClearFilter,
}: {
  startDate?: string;
  endDate?: string;
  onClearFilter: () => void;
}) => {
  if (!startDate && !endDate) return null;

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFilterText = () => {
    if (startDate && endDate && startDate === endDate) {
      return `Filtered: ${formatDisplayDate(startDate)}`;
    }
    if (startDate && endDate) {
      return `Filtered: ${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    }
    if (startDate) {
      return `From: ${formatDisplayDate(startDate)}`;
    }
    if (endDate) {
      return `Until: ${formatDisplayDate(endDate)}`;
    }
    return "Filtered";
  };

  return (
    <View className="mb-4 bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="calendar" size={16} color="#6F2DBD" />
        <Text className="text-white ml-2 font-Poppins_500Medium">
          {getFilterText()}
        </Text>
      </View>
      <TouchableOpacity onPress={onClearFilter}>
        <View className="bg-[#1c1c1e] rounded-lg px-3 py-1">
          <Text className="text-gray-400 font-Poppins_400Regular">Clear</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const Page = () => {
  const params = useLocalSearchParams<{
    startDate?: string;
    endDate?: string;
  }>();

  const [workoutSessions] = useAtom(workoutSessionsAtom);

  // Filter and sort workout sessions
  const filteredWorkouts = useMemo(() => {
    let filtered = [...workoutSessions];

    // Apply date filters
    if (params.startDate || params.endDate) {
      filtered = filtered.filter((session) => {
        const sessionDate = new Date(session.date);

        if (params.startDate && params.endDate) {
          const start = new Date(params.startDate);
          const end = new Date(params.endDate);
          return sessionDate >= start && sessionDate <= end;
        }

        if (params.startDate) {
          const start = new Date(params.startDate);
          return sessionDate >= start;
        }

        if (params.endDate) {
          const end = new Date(params.endDate);
          return sessionDate <= end;
        }

        return true;
      });
    }

    // Sort by date descending (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [workoutSessions, params.startDate, params.endDate]);

  const handleClearFilter = () => {
    router.replace("/(app)/(authenticated)/(modal)/workouts");
  };

  return (
    <View className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Filter Status Bar */}
        <FilterStatusBar
          startDate={params.startDate}
          endDate={params.endDate}
          onClearFilter={handleClearFilter}
        />

        {/* Workouts List */}
        {filteredWorkouts.length > 0 ? (
          <LegendList
            data={filteredWorkouts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: session }) => (
              <WorkoutSessionCard session={session} />
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <View className="bg-[#1c1c1e] rounded-xl p-8 items-center">
              <View className="bg-[#2c2c2e] w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="barbell-outline" size={28} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold mb-2 text-center">
                {params.startDate || params.endDate
                  ? "No workouts found"
                  : "No workouts yet"}
              </Text>
              <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
                {params.startDate || params.endDate
                  ? "Try adjusting your date filter or clear it to see all workouts."
                  : "Start your fitness journey by logging your first workout!"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Page;
