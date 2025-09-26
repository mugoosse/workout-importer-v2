import { Badge } from "@/components/ui/Badge";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface Muscle {
  _id: string;
  name: string;
  anatomicalGroup?: string;
  group: string;
  majorGroup: string;
  svgId: string;
}

interface MuscleInfoCardProps {
  muscle: Muscle;
  showAnatomicalGroup?: boolean;
  showMajorGroup?: boolean;
  showGroup?: boolean;
  variant?: "basic" | "intermediate" | "advanced";
}

export const MuscleInfoCard = ({
  muscle,
  showAnatomicalGroup = true,
  showMajorGroup = true,
  showGroup = true,
  variant = "advanced",
}: MuscleInfoCardProps) => {
  return (
    <View className="mx-4 mt-4 mb-6">
      {/* Muscle Group Tags */}
      <View className="flex-row flex-wrap gap-2">
        {/* Show both tags for advanced view */}
        {variant === "advanced" && showMajorGroup && (
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/(authenticated)/(modal)/muscles/basic/${muscle.majorGroup}`,
              )
            }
          >
            <Badge variant="outline">
              <Text className="text-white text-sm capitalize">
                {muscle.majorGroup}
              </Text>
            </Badge>
          </TouchableOpacity>
        )}

        {variant === "advanced" && showGroup && (
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/(authenticated)/(modal)/muscles/intermediate/${muscle.group}`,
              )
            }
          >
            <Badge variant="outline">
              <Text className="text-white text-sm capitalize">
                {muscle.group}
              </Text>
            </Badge>
          </TouchableOpacity>
        )}

        {/* Show only majorGroup tag for intermediate view */}
        {variant === "intermediate" && showMajorGroup && (
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/(authenticated)/(modal)/muscles/basic/${muscle.majorGroup}`,
              )
            }
          >
            <Badge variant="outline">
              <Text className="text-white text-sm capitalize">
                {muscle.majorGroup}
              </Text>
            </Badge>
          </TouchableOpacity>
        )}

        {/* No tags for basic view */}
      </View>

      {/* Anatomical Group Card */}
      {showAnatomicalGroup && muscle.anatomicalGroup && (
        <View className="bg-[#1c1c1e] rounded-2xl p-4 mt-4">
          <View className="flex-row items-center mb-2">
            <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Ionicons name="medical-outline" size={20} color="#6F2DBD" />
            </View>
            <Text className="text-white text-lg font-Poppins_600SemiBold">
              Anatomical Group
            </Text>
          </View>
          <Text className="text-gray-300 text-base font-Poppins_400Regular ml-13">
            {muscle.anatomicalGroup}
          </Text>
        </View>
      )}
    </View>
  );
};
