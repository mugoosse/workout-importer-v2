import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const MAJOR_MUSCLE_GROUPS = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "legs", label: "Legs" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
  { id: "core", label: "Core" },
];

const EXERCISE_TYPES = [
  "Weight Reps",
  "Reps Only",
  "Weighted Bodyweight",
  "Assisted Bodyweight",
  "Duration",
  "Weight & Duration",
  "Distance & Duration",
  "Weight & Distance",
];

const Page = () => {
  const params = useLocalSearchParams<{
    currentMajorGroups?: string;
    currentEquipmentIds?: string;
    currentExerciseTypes?: string;
  }>();

  // Parse current filters from params (support comma-separated values)
  const currentMajorGroups = params.currentMajorGroups?.split(",") || [];
  const currentEquipmentIds = params.currentEquipmentIds?.split(",") || [];
  const currentExerciseTypes = params.currentExerciseTypes?.split(",") || [];

  // State for selected filters (now arrays for multi-selection)
  const [selectedMajorGroups, setSelectedMajorGroups] =
    useState<string[]>(currentMajorGroups);
  const [selectedEquipmentIds, setSelectedEquipmentIds] =
    useState<string[]>(currentEquipmentIds);
  const [selectedExerciseTypes, setSelectedExerciseTypes] =
    useState<string[]>(currentExerciseTypes);

  // Get all equipment
  const equipment = useQuery(api.exercises.getAllEquipment, {});

  const handleMajorGroupToggle = (groupId: string) => {
    setSelectedMajorGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId],
    );
  };

  const handleExerciseTypeToggle = (type: string) => {
    setSelectedExerciseTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleApplyFilters = () => {
    const searchParams = new URLSearchParams();

    if (selectedMajorGroups.length > 0) {
      searchParams.set("majorGroups", selectedMajorGroups.join(","));
    }
    if (selectedEquipmentIds.length > 0) {
      searchParams.set("equipmentIds", selectedEquipmentIds.join(","));
    }
    if (selectedExerciseTypes.length > 0) {
      searchParams.set("exerciseTypes", selectedExerciseTypes.join(","));
    }

    const queryString = searchParams.toString();
    router.replace(`/exercises${queryString ? `?${queryString}` : ""}`);
  };

  const handleClearAll = () => {
    setSelectedMajorGroups([]);
    setSelectedEquipmentIds([]);
    setSelectedExerciseTypes([]);
  };

  const handleCancel = () => {
    router.back();
  };

  const hasActiveFilters =
    selectedMajorGroups.length > 0 ||
    selectedEquipmentIds.length > 0 ||
    selectedExerciseTypes.length > 0;

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: "Filter Exercises",
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel} className="ml-2">
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
          headerRight: () =>
            hasActiveFilters && (
              <TouchableOpacity onPress={handleClearAll} className="mr-4">
                <Text className="text-gray-400 font-Poppins_500Medium">
                  Clear all
                </Text>
              </TouchableOpacity>
            ),
        }}
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Major Muscle Groups */}
        <View className="mb-6 mt-4">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            Muscle Groups
            {selectedMajorGroups.length > 0 &&
              ` (${selectedMajorGroups.length} selected)`}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MAJOR_MUSCLE_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => handleMajorGroupToggle(group.id)}
                className={`px-4 py-3 rounded-xl ${
                  selectedMajorGroups.includes(group.id)
                    ? "bg-[#6F2DBD]"
                    : "bg-[#2c2c2e]"
                }`}
              >
                <Text className="text-white font-Poppins_500Medium">
                  {group.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercise Types */}
        <View className="mb-6">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
            Exercise Types
            {selectedExerciseTypes.length > 0 &&
              ` (${selectedExerciseTypes.length} selected)`}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {EXERCISE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleExerciseTypeToggle(type)}
                className={`px-4 py-3 rounded-xl ${
                  selectedExerciseTypes.includes(type)
                    ? "bg-[#6F2DBD]"
                    : "bg-[#2c2c2e]"
                }`}
              >
                <Text className="text-white font-Poppins_500Medium">
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment */}
        {equipment && equipment.length > 0 && (
          <View className="mb-6">
            <Text className="text-white text-lg font-Poppins_600SemiBold mb-3">
              Equipment
              {selectedEquipmentIds.length > 0 &&
                ` (${selectedEquipmentIds.length} selected)`}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {equipment.map((equip) => (
                <TouchableOpacity
                  key={equip._id}
                  onPress={() => handleEquipmentToggle(equip._id)}
                  className={`px-4 py-3 rounded-xl ${
                    selectedEquipmentIds.includes(equip._id)
                      ? "bg-[#6F2DBD]"
                      : "bg-[#2c2c2e]"
                  }`}
                >
                  <Text className="text-white font-Poppins_500Medium">
                    {equip.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View className="px-4 pb-8 pt-4 bg-dark border-t border-gray-800">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleCancel}
            className="flex-1 bg-zinc-800 rounded-2xl py-4"
          >
            <Text className="text-center text-lg text-gray-400 font-Poppins_600SemiBold">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApplyFilters}
            className="flex-1 bg-[#6F2DBD] rounded-2xl py-4"
          >
            <Text className="text-center text-lg text-white font-Poppins_600SemiBold">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Page;
