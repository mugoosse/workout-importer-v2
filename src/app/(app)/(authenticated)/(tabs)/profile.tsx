import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useAtom } from "jotai";
import {
  weeklyProgressAtom,
  individualMuscleProgressAtom,
} from "@/store/weeklyProgress";
import { clearAllLogsAction } from "@/store/exerciseLog";
import {
  weightUnitAtom,
  distanceUnitAtom,
  setWeightUnitAction,
  setDistanceUnitAction,
} from "@/store/units";
import { Ionicons } from "@expo/vector-icons";

const Page = () => {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const user = useQuery(api.users.viewer);
  const [, setWeeklyProgress] = useAtom(weeklyProgressAtom);
  const [, setIndividualMuscleProgress] = useAtom(individualMuscleProgressAtom);
  const [, clearAllLogs] = useAtom(clearAllLogsAction);
  const [weightUnit] = useAtom(weightUnitAtom);
  const [distanceUnit] = useAtom(distanceUnitAtom);
  const [, setWeightUnit] = useAtom(setWeightUnitAction);
  const [, setDistanceUnit] = useAtom(setDistanceUnitAction);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleResetProgress = () => {
    Alert.alert(
      "Reset Progress",
      "This will clear all logged exercise sets and reset muscle progress to 0. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            // Clear all logged sets
            clearAllLogs();

            // Reset weekly progress
            setWeeklyProgress([
              {
                majorGroup: "chest",
                level: 1,
                xp: 0,
                nextLevel: 100,
                percentage: 0,
                streak: 0,
              },
              {
                majorGroup: "back",
                level: 1,
                xp: 0,
                nextLevel: 350,
                percentage: 0,
                streak: 0,
              },
              {
                majorGroup: "legs",
                level: 1,
                xp: 0,
                nextLevel: 450,
                percentage: 0,
                streak: 0,
              },
              {
                majorGroup: "shoulders",
                level: 1,
                xp: 0,
                nextLevel: 50,
                percentage: 0,
                streak: 0,
              },
              {
                majorGroup: "arms",
                level: 1,
                xp: 0,
                nextLevel: 350,
                percentage: 0,
                streak: 0,
              },
              {
                majorGroup: "core",
                level: 1,
                xp: 0,
                nextLevel: 200,
                percentage: 0,
                streak: 0,
              },
            ]);

            // Reset individual muscle progress
            setIndividualMuscleProgress((current) => {
              const reset = { ...current };
              Object.keys(reset).forEach((muscleId) => {
                reset[muscleId] = {
                  ...reset[muscleId],
                  xp: 0,
                  percentage: 0,
                  streak: 0,
                  sets: 0,
                };
              });
              return reset;
            });

            Alert.alert("Success", "Progress has been reset successfully.");
          },
        },
      ],
    );
  };

  const causeError = () => {
    throw new Error("Test error");
  };

  return (
    <View className="flex-1 bg-dark">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-white text-2xl font-Poppins_600SemiBold mb-8 text-center">
          {user?.name}&apos;s profile
        </Text>

        <View className="w-full max-w-sm space-y-4">
          {/* Units Settings Section */}
          <View className="bg-[#1c1c1e] rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-4">
              Units
            </Text>

            {/* Weight Unit Setting */}
            <View className="mb-4">
              <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                Weight Unit
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setWeightUnit("kg")}
                  className={`flex-1 p-3 rounded-l-xl flex-row items-center justify-center ${
                    weightUnit === "kg" ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
                  }`}
                >
                  <Text
                    className={`font-Poppins_500Medium ${
                      weightUnit === "kg" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setWeightUnit("lbs")}
                  className={`flex-1 p-3 rounded-r-xl flex-row items-center justify-center ${
                    weightUnit === "lbs" ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
                  }`}
                >
                  <Text
                    className={`font-Poppins_500Medium ${
                      weightUnit === "lbs" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Distance Unit Setting */}
            <View>
              <Text className="text-gray-300 text-sm font-Poppins_500Medium mb-2">
                Distance Unit
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setDistanceUnit("km")}
                  className={`flex-1 p-3 rounded-l-xl flex-row items-center justify-center ${
                    distanceUnit === "km" ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
                  }`}
                >
                  <Text
                    className={`font-Poppins_500Medium ${
                      distanceUnit === "km" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDistanceUnit("miles")}
                  className={`flex-1 p-3 rounded-r-xl flex-row items-center justify-center ${
                    distanceUnit === "miles" ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
                  }`}
                >
                  <Text
                    className={`font-Poppins_500Medium ${
                      distanceUnit === "miles" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    mi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Reset Progress Button */}
          <TouchableOpacity
            onPress={handleResetProgress}
            className="bg-red-600 rounded-xl p-4 flex-row items-center justify-center mb-4"
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="text-white font-Poppins_600SemiBold ml-2">
              Reset Progress
            </Text>
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-[#6F2DBD] rounded-xl p-4 flex-row items-center justify-center mb-4"
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-Poppins_600SemiBold ml-2">
              Sign Out
            </Text>
          </TouchableOpacity>

          {/* Debug Button */}
          <TouchableOpacity
            onPress={causeError}
            className="bg-gray-600 rounded-xl p-4 flex-row items-center justify-center"
          >
            <Ionicons name="bug-outline" size={20} color="white" />
            <Text className="text-white font-Poppins_600SemiBold ml-2">
              Cause Error
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Page;
