import { Badge } from "@/components/ui/Badge";
import { type Id } from "@/convex/_generated/dataModel";
import { type ExerciseType } from "@/store/exerciseLog";
import {
  calculateXPDistribution,
  extractMuscleInvolvement,
} from "@/utils/xpCalculator";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface ExerciseSet {
  id: string;
  exerciseId: Id<"exercises">;
  workoutSessionId?: string;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rpe: number;
  timestamp: number;
  date: string;
}

interface ExerciseDetails {
  _id: Id<"exercises">;
  title: string;
  exerciseType: string;
  equipment: { _id: string; name: string }[];
  muscles?: any[];
}

interface ExerciseLog {
  id: string;
  exerciseId: Id<"exercises">;
  workoutDate: string;
  notes?: string;
  timestamp: number;
}

interface ExerciseSetsDisplayProps {
  exerciseDetail: ExerciseDetails;
  exerciseSets: ExerciseSet[];
  exerciseNotes?: ExerciseLog;
  showHeader?: boolean;
}

const getRequiredFields = (exerciseType: ExerciseType) => {
  switch (exerciseType) {
    case "Weight Reps":
      return {
        needsReps: true,
        needsWeight: true,
        needsDuration: false,
        needsDistance: false,
      };
    case "Reps Only":
      return {
        needsReps: true,
        needsWeight: false,
        needsDuration: false,
        needsDistance: false,
      };
    case "Weighted Bodyweight":
    case "Assisted Bodyweight":
      return {
        needsReps: true,
        needsWeight: true,
        needsDuration: false,
        needsDistance: false,
      };
    case "Duration":
      return {
        needsReps: false,
        needsWeight: false,
        needsDuration: true,
        needsDistance: false,
      };
    case "Weight & Duration":
      return {
        needsReps: false,
        needsWeight: true,
        needsDuration: true,
        needsDistance: false,
      };
    case "Distance & Duration":
      return {
        needsReps: false,
        needsWeight: false,
        needsDuration: true,
        needsDistance: true,
      };
    case "Weight & Distance":
      return {
        needsReps: false,
        needsWeight: true,
        needsDuration: false,
        needsDistance: true,
      };
    default:
      return {
        needsReps: true,
        needsWeight: false,
        needsDuration: false,
        needsDistance: false,
      };
  }
};

const cleanExerciseTitle = (title: string) => {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

export const ExerciseSetsDisplay = ({
  exerciseDetail,
  exerciseSets,
  exerciseNotes,
  showHeader = true,
}: ExerciseSetsDisplayProps) => {
  const requiredFields = getRequiredFields(
    exerciseDetail.exerciseType as ExerciseType,
  );

  return (
    <View>
      {/* Exercise Header */}
      {showHeader && (
        <Link
          href={`/(app)/(authenticated)/(modal)/exercise/${exerciseDetail._id}`}
          asChild
        >
          <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
                  {cleanExerciseTitle(exerciseDetail.title)}
                </Text>

                <View className="flex-row items-center flex-wrap gap-2">
                  <Badge variant="outline">
                    <Text className="text-white text-xs">
                      {exerciseDetail.exerciseType}
                    </Text>
                  </Badge>

                  {/* Equipment tags inline */}
                  {exerciseDetail.equipment.slice(0, 2).map((equip) => (
                    <Badge key={equip._id} variant="outline">
                      <Text className="text-white text-xs">{equip.name}</Text>
                    </Badge>
                  ))}
                  {exerciseDetail.equipment.length > 2 && (
                    <Badge variant="outline">
                      <Text className="text-white text-xs">
                        +{exerciseDetail.equipment.length - 2}
                      </Text>
                    </Badge>
                  )}
                </View>
              </View>

              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      )}

      {/* Exercise Notes */}
      {exerciseNotes?.notes && (
        <View className="rounded-xl mb-3">
          <Text className="text-gray-300 font-Poppins_400Regular italic">
            &ldquo;{exerciseNotes.notes}&rdquo;
          </Text>
        </View>
      )}

      {/* Sets Header */}
      <View className="flex-row items-center mb-2">
        <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-8 text-center">
          SET
        </Text>
        {requiredFields.needsWeight && (
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
            WEIGHT (KG)
          </Text>
        )}
        {requiredFields.needsReps && (
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
            REPS
          </Text>
        )}
        {requiredFields.needsDuration && (
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
            TIME (S)
          </Text>
        )}
        {requiredFields.needsDistance && (
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
            DISTANCE (M)
          </Text>
        )}
        <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-12 text-center">
          RPE
        </Text>
        <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-12 text-center">
          XP
        </Text>
      </View>

      {/* Sets Rows */}
      {exerciseSets.map((set, setIndex) => {
        // Calculate XP for this set
        const muscleInvolvements = exerciseDetail.muscles
          ? extractMuscleInvolvement(exerciseDetail.muscles)
          : [];
        const xpResult = calculateXPDistribution(muscleInvolvements, set.rpe);

        return (
          <View
            key={set.id}
            className={`flex-row items-center py-2 ${setIndex < exerciseSets.length - 1 ? "border-b border-neutral-600" : ""}`}
          >
            {/* Set Number */}
            <Text className="text-white text-sm font-Poppins_600SemiBold w-8 text-center">
              {setIndex + 1}
            </Text>

            {/* Weight */}
            {requiredFields.needsWeight && (
              <Text className="text-gray-300 text-sm font-Poppins_400Regular flex-1 text-center">
                {set.weight ? set.weight.toString() : "-"}
              </Text>
            )}

            {/* Reps */}
            {requiredFields.needsReps && (
              <Text className="text-gray-300 text-sm font-Poppins_400Regular flex-1 text-center">
                {set.reps ? set.reps.toString() : "-"}
              </Text>
            )}

            {/* Duration */}
            {requiredFields.needsDuration && (
              <Text className="text-gray-300 text-sm font-Poppins_400Regular flex-1 text-center">
                {set.duration ? set.duration.toString() : "-"}
              </Text>
            )}

            {/* Distance */}
            {requiredFields.needsDistance && (
              <Text className="text-gray-300 text-sm font-Poppins_400Regular flex-1 text-center">
                {set.distance ? set.distance.toString() : "-"}
              </Text>
            )}

            {/* RPE */}
            <Text className="text-gray-300 text-sm font-Poppins_400Regular w-12 text-center">
              {set.rpe}
            </Text>

            {/* XP */}
            <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium w-12 text-center">
              {xpResult.totalXP}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
