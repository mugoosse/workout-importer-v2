import { type Id } from "@/convex/_generated/dataModel";
import {
  getMuscleProgress,
  getProgressColor,
  svgIdProgressAtom,
} from "@/store/weeklyProgress";
import { formatMuscleName } from "@/utils/muscleBodyUtils";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { Text, TouchableOpacity, View } from "react-native";

interface Muscle {
  _id: Id<"muscles">;
  name: string;
  svgId: string;
}

interface ExerciseCounts {
  target: number;
  hasAnyExercises: boolean;
}

interface FilteredMuscleLibraryProps {
  selectedMuscleId: string;
  muscles: Muscle[];
  exerciseCountsData: Record<string, ExerciseCounts>;
  onClearFilter: () => void;
}

export const FilteredMuscleLibrary = ({
  selectedMuscleId,
  muscles,
  exerciseCountsData,
  onClearFilter,
}: FilteredMuscleLibraryProps) => {
  const [svgIdProgress] = useAtom(svgIdProgressAtom);

  return (
    <View className="px-4">
      {/* Filter Status Bar */}
      <View className="mb-4 bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="filter" size={16} color="#6F2DBD" />
          <Text className="text-white ml-2 font-Poppins_500Medium">
            Filtered: {formatMuscleName(selectedMuscleId)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClearFilter}>
          <View className="bg-[#1c1c1e] rounded-lg px-3 py-1">
            <Text className="text-gray-400 font-Poppins_400Regular">Clear</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Muscle Library */}
      <View>
        <Text className="text-white text-xl font-Poppins_600SemiBold mb-4">
          Muscles
        </Text>

        <LegendList
          data={muscles}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          renderItem={({ item: muscle, index }) => {
            const exerciseCounts = exerciseCountsData[muscle._id];
            const hasExercises = exerciseCounts?.hasAnyExercises ?? false;

            const muscleProgress = getMuscleProgress(
              muscle.svgId,
              svgIdProgress,
              hasExercises,
            );

            const progressColor = getProgressColor(
              muscleProgress.percentage,
              true,
            );

            return (
              <TouchableOpacity
                key={muscle._id}
                onPress={() =>
                  router.push(
                    `/(app)/(authenticated)/(modal)/muscles/advanced/${muscle._id}`,
                  )
                }
                className={`bg-[#1c1c1e] rounded-2xl p-4 ${
                  index > 0 ? "mt-3" : ""
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-lg font-Poppins_600SemiBold mb-1">
                      {muscle.name}
                    </Text>
                    <Text className="text-gray-400 text-sm font-Poppins_400Regular mb-3">
                      {exerciseCounts?.target || 0} target exercises
                    </Text>

                    {/* Progress Bar */}
                    <View className="bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, muscleProgress.percentage)}%`,
                          backgroundColor: progressColor,
                        }}
                      />
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row justify-between">
                      <Text className="text-gray-400 text-xs font-Poppins_400Regular">
                        {muscleProgress.xp} XP • {muscleProgress.sets} sets
                      </Text>
                    </View>
                  </View>

                  <View className="bg-[#2c2c2e] w-8 h-8 rounded-lg items-center justify-center ml-4">
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
};
