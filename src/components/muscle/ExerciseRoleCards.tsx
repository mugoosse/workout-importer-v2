import { type MuscleRole } from "@/utils/xpCalculator";
import {
  getRoleColor,
  getRoleDisplayName,
  getRoleDescription,
} from "@/utils/muscleRoles";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type ExerciseRoleCardProps = {
  role: "target" | "synergist" | "stabilizer" | "lengthening";
  count: number;
  muscleId: string;
  onPress?: () => void;
};

const ExerciseRoleCard = ({
  role,
  count,
  muscleId,
  onPress,
}: ExerciseRoleCardProps) => {
  const isDisabled = count === 0;
  const title = getRoleDisplayName(role);
  const description = getRoleDescription(role);
  const color = getRoleColor(role);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(
        `/(app)/(authenticated)/(modal)/exercises?muscleIds=${muscleId}&muscleFunctions=${role}`,
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      className={`bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between mb-3 ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-3 h-3 rounded-full mr-3"
          style={{ backgroundColor: color }}
        />
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-Poppins_500Medium mr-2">
              {title}
            </Text>
            <View className="bg-[#3c3c3e] rounded-full px-2 py-1">
              <Text className="text-gray-300 text-xs font-Poppins_500Medium">
                {count}
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 text-xs font-Poppins_400Regular mt-1">
            {description}
          </Text>
        </View>
      </View>
      {!isDisabled && (
        <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
      )}
    </TouchableOpacity>
  );
};

interface ExerciseRoleCardsProps {
  muscleId: string;
  exerciseCounts: {
    target: number;
    synergist: number;
    stabilizer: number;
    lengthening: number;
  };
  onRolePress?: (role: MuscleRole) => void;
}

export const ExerciseRoleCards = ({
  muscleId,
  exerciseCounts,
  onRolePress,
}: ExerciseRoleCardsProps) => {
  return (
    <View className="bg-[#1c1c1e] rounded-2xl p-4">
      <View className="flex-row items-center mb-4">
        <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
          <Ionicons name="barbell-outline" size={20} color="#6F2DBD" />
        </View>
        <Text className="text-white text-lg font-Poppins_600SemiBold">
          Related Exercises
        </Text>
      </View>

      <View>
        <ExerciseRoleCard
          role="target"
          count={exerciseCounts.target}
          muscleId={muscleId}
          onPress={onRolePress ? () => onRolePress("target") : undefined}
        />

        <ExerciseRoleCard
          role="synergist"
          count={exerciseCounts.synergist}
          muscleId={muscleId}
          onPress={onRolePress ? () => onRolePress("synergist") : undefined}
        />

        <ExerciseRoleCard
          role="stabilizer"
          count={exerciseCounts.stabilizer}
          muscleId={muscleId}
          onPress={onRolePress ? () => onRolePress("stabilizer") : undefined}
        />

        <ExerciseRoleCard
          role="lengthening"
          count={exerciseCounts.lengthening}
          muscleId={muscleId}
          onPress={onRolePress ? () => onRolePress("lengthening") : undefined}
        />
      </View>
    </View>
  );
};
