import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useCachedStableQuery } from "@/hooks/cachedHooks";
import {
  activeWorkoutAtom,
  addExercisesToWorkoutAction,
  replaceExerciseInWorkoutAction,
} from "@/store/activeWorkout";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type MuscleRole = "target" | "synergist" | "stabilizer" | "lengthening";

const MUSCLE_ROLE_LABELS: Record<MuscleRole, string> = {
  target: "Target",
  synergist: "Synergist",
  stabilizer: "Stabilizer",
  lengthening: "Lengthening",
};

const ExerciseSkeleton = () => (
  <View className="bg-[#1c1c1e] rounded-2xl p-4 mb-4">
    <View className="flex-row items-start justify-between mb-3">
      <View className="flex-1 mr-3">
        <View
          className="bg-gray-600 h-5 rounded mb-2"
          style={{ width: "70%" }}
        />
        <View className="flex-row items-center flex-wrap gap-2">
          <View
            className="bg-gray-600 h-6 rounded px-3 py-1"
            style={{ width: 80 }}
          />
          <View
            className="bg-gray-600 h-6 rounded px-3 py-1"
            style={{ width: 60 }}
          />
        </View>
      </View>
      <View className="bg-gray-600 w-10 h-10 rounded-xl" />
    </View>
  </View>
);

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const cleanExerciseTitle = (title: string) => {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

const Page = () => {
  const params = useLocalSearchParams<{
    majorGroups?: string;
    muscleId?: string;
    muscleRole?: MuscleRole;
    muscleFunctions?: string;
    equipmentIds?: string;
    exerciseTypes?: string;
    search?: string;
    selectedExercises?: string;
    replacingExercise?: string;
  }>();

  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [, addExercisesToWorkout] = useAtom(addExercisesToWorkoutAction);
  const [, replaceExerciseInWorkout] = useAtom(replaceExerciseInWorkoutAction);
  const [searchText, setSearchText] = useState(params.search || "");

  // Check if we're in replacement mode
  const isReplacementMode = !!params.replacingExercise;

  // Initialize selected exercises from URL params
  const initialSelectedExercises = params.selectedExercises
    ? new Set(params.selectedExercises.split(",") as Id<"exercises">[])
    : new Set<Id<"exercises">>();

  const [selectedExercises, setSelectedExercises] = useState<
    Set<Id<"exercises">>
  >(initialSelectedExercises);
  const [selectedExerciseDetails, setSelectedExerciseDetails] = useState<
    Record<Id<"exercises">, any>
  >({});
  const debouncedSearch = useDebounce(searchText, 300);

  // Get muscle and equipment details for display
  const muscle = useQuery(
    api.muscles.get,
    params.muscleId ? { muscleId: params.muscleId as Id<"muscles"> } : "skip",
  );
  const equipment = useQuery(api.exercises.getAllEquipment, {});

  // Parse multi-select parameters
  const majorGroups = params.majorGroups?.split(",");
  const muscleFunctions = params.muscleFunctions?.split(",") as
    | MuscleRole[]
    | undefined;
  const equipmentIds = params.equipmentIds?.split(",") as
    | Id<"equipment">[]
    | undefined;
  const exerciseTypes = params.exerciseTypes?.split(",");

  // Query exercises with current filters using cached stable query for persistent caching
  const { data: exercises, isStale } = useCachedStableQuery(
    api.exercises.getFilteredExercises,
    {
      majorGroups,
      muscleId: params.muscleId as Id<"muscles"> | undefined,
      muscleRole: params.muscleRole,
      muscleFunctions,
      equipmentIds,
      exerciseTypes: exerciseTypes as any,
      searchTerm: debouncedSearch || undefined,
    },
  );

  // Query details for initially selected exercises (to get their details even if filtered out)
  const allSelectedExercises = useQuery(
    api.exercises.getExercisesByIds,
    selectedExercises.size > 0
      ? { exerciseIds: Array.from(selectedExercises) }
      : "skip",
  );

  // Populate exercise details when data loads
  useEffect(() => {
    if (allSelectedExercises && selectedExercises.size > 0) {
      setSelectedExerciseDetails((prevDetails) => {
        const newDetails = { ...prevDetails };
        let hasChanges = false;

        allSelectedExercises.forEach((exercise) => {
          if (
            selectedExercises.has(exercise._id) &&
            !newDetails[exercise._id]
          ) {
            newDetails[exercise._id] = {
              name: exercise.title,
              type: exercise.exerciseType,
              equipment:
                exercise.equipment
                  ?.filter((eq) => eq !== null)
                  .map((eq) => eq.name) || [],
            };
            hasChanges = true;
          }
        });

        return hasChanges ? newDetails : prevDetails;
      });
    }
  }, [allSelectedExercises, selectedExercises]);

  const handleClearFilter = (filterType: string) => {
    const newParams = { ...params };
    delete newParams[filterType as keyof typeof params];

    const searchParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });

    const queryString = searchParams.toString();
    router.replace(
      `/workout/add-exercises${queryString ? `?${queryString}` : ""}`,
    );
  };

  const handleClearAllFilters = () => {
    router.replace("/workout/add-exercises");
    setSearchText("");
  };

  const hasActiveFilters = !!(
    params.majorGroups ||
    params.muscleId ||
    params.muscleFunctions ||
    params.equipmentIds ||
    params.exerciseTypes ||
    searchText
  );

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const toggleExerciseSelection = async (exerciseId: Id<"exercises">) => {
    // In replacement mode, immediately replace the exercise
    if (isReplacementMode && params.replacingExercise) {
      try {
        // Find exercise details
        let exerciseDetails = selectedExerciseDetails[exerciseId];
        if (!exerciseDetails && exercises) {
          const exercise = exercises.find((ex) => ex._id === exerciseId);
          if (exercise) {
            exerciseDetails = {
              name: exercise.title,
              type: exercise.exerciseType,
              equipment:
                exercise.equipment
                  ?.filter((eq) => eq !== null)
                  .map((eq) => eq.name) || [],
            };
          }
        }

        // Replace the exercise
        replaceExerciseInWorkout(
          params.replacingExercise as Id<"exercises">,
          exerciseId,
          exerciseDetails,
        );

        // Navigate back to existing workout screen
        router.back();
        return;
      } catch (error) {
        console.error("Error replacing exercise:", error);
        return;
      }
    }

    // Normal selection mode
    const newSelection = new Set(selectedExercises);
    const newDetails = { ...selectedExerciseDetails };

    if (newSelection.has(exerciseId)) {
      // Remove from selection and details
      newSelection.delete(exerciseId);
      delete newDetails[exerciseId];
    } else {
      // Add to selection and store details
      newSelection.add(exerciseId);
      const exercise = exercises?.find((ex) => ex._id === exerciseId);
      if (exercise) {
        newDetails[exerciseId] = {
          name: exercise.title,
          type: exercise.exerciseType,
          equipment:
            exercise.equipment
              ?.filter((eq) => eq !== null)
              .map((eq) => eq.name) || [],
        };
      }
    }

    setSelectedExercises(newSelection);
    setSelectedExerciseDetails(newDetails);
  };

  const handleAddExercises = async () => {
    if (selectedExercises.size === 0) return;

    try {
      // Use the stored exercise details
      const exercisesToAdd = Array.from(selectedExercises);

      if (exercisesToAdd.length > 0) {
        addExercisesToWorkout(exercisesToAdd, selectedExerciseDetails);
      }

      // Navigate directly to the workout page instead of using router.back()
      // to avoid navigation stack issues when filters were used
      // Use replace to maintain proper back button behavior
      router.replace("/(app)/(authenticated)/(modal)/workout");
    } catch (error) {
      console.error("Error adding exercises:", error);
    }
  };

  const filteredExercises =
    exercises?.filter(
      (exercise) =>
        !activeWorkout.exercises.some((we) => we.exerciseId === exercise._id),
    ) || [];

  // Create a selection key for forcing re-renders
  const selectionKey = Array.from(selectedExercises).join(",");

  // Count total selected exercises (including those not visible due to filters)
  const totalSelectedCount = selectedExercises.size;

  if (!activeWorkout.isActive) {
    return (
      <View className="flex-1 bg-dark justify-center items-center">
        <Text className="text-white text-lg">No active workout</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-Poppins_500Medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (exercises === undefined) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: isReplacementMode ? "Replace Exercise" : "Add Exercises",
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Bar */}
      <View className="mx-4 mt-4 mb-4">
        <View className="flex-row items-center bg-[#2c2c2e] rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="white" />
          <TextInput
            className="flex-1 ml-3 text-white font-Poppins_400Regular"
            placeholder="Search exercise"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={handleSearchChange}
          />
          {searchText && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subtle loading indicator when data is stale */}
      {isStale && (
        <View className="mx-4 mb-2">
          <View className="h-1 bg-[#1c1c1e] rounded-full overflow-hidden">
            <View className="h-full bg-[#6F2DBD] w-1/3 animate-pulse" />
          </View>
        </View>
      )}

      {/* Filter Button and Active Filters Row */}
      <View className="mx-4 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ alignItems: "center", gap: 8 }}
        >
          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => {
              const filterParams = new URLSearchParams();

              // Pass current filter values to filter page
              if (params.majorGroups)
                filterParams.set("currentMajorGroups", params.majorGroups);
              if (params.muscleFunctions)
                filterParams.set(
                  "currentMuscleFunctions",
                  params.muscleFunctions,
                );
              if (params.equipmentIds)
                filterParams.set("currentEquipmentIds", params.equipmentIds);
              if (params.exerciseTypes)
                filterParams.set("currentExerciseTypes", params.exerciseTypes);

              // Pass selected exercises to maintain selection
              if (selectedExercises.size > 0) {
                filterParams.set(
                  "selectedExercises",
                  Array.from(selectedExercises).join(","),
                );
              }

              // Pass return route so filter page knows where to go back
              filterParams.set("returnRoute", "/workout/add-exercises");

              const queryString = filterParams.toString();
              router.replace(
                `/(app)/(authenticated)/exercises/filter${queryString ? `?${queryString}` : ""}` as any,
              );
            }}
            className="flex-row items-center bg-[#1c1c1e] rounded-xl px-3 py-3"
          >
            <Ionicons name="filter" size={16} color="#6F2DBD" />
            <Text className="text-white text-sm font-Poppins_500Medium ml-2">
              Filters
            </Text>
          </TouchableOpacity>

          {/* Active Filter Tags */}
          {majorGroups && majorGroups.length > 0 && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {majorGroups.length === 1
                  ? majorGroups[0].charAt(0).toUpperCase() +
                    majorGroups[0].slice(1)
                  : `${majorGroups.length} Muscle Groups`}
              </Text>
              <TouchableOpacity
                onPress={() => handleClearFilter("majorGroups")}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {muscle && params.muscleRole && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {muscle.name} ({MUSCLE_ROLE_LABELS[params.muscleRole]})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  handleClearFilter("muscleId");
                  handleClearFilter("muscleRole");
                }}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {muscleFunctions && muscleFunctions.length > 0 && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {muscleFunctions.length === 1
                  ? MUSCLE_ROLE_LABELS[muscleFunctions[0]]
                  : `${muscleFunctions.length} Functions`}
              </Text>
              <TouchableOpacity
                onPress={() => handleClearFilter("muscleFunctions")}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {equipmentIds && equipmentIds.length > 0 && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {equipmentIds.length === 1
                  ? equipment?.find((e) => e._id === equipmentIds[0])?.name ||
                    "Equipment"
                  : `${equipmentIds.length} Equipment`}
              </Text>
              <TouchableOpacity
                onPress={() => handleClearFilter("equipmentIds")}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {exerciseTypes && exerciseTypes.length > 0 && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {exerciseTypes.length === 1
                  ? exerciseTypes[0]
                  : `${exerciseTypes.length} Exercise Types`}
              </Text>
              <TouchableOpacity
                onPress={() => handleClearFilter("exerciseTypes")}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {searchText && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                Search: &quot;{searchText}&quot;
              </Text>
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Clear All Button (only when filters exist) */}
          {hasActiveFilters && (
            <TouchableOpacity onPress={handleClearAllFilters}>
              <Text className="text-gray-400 font-Poppins_500Medium px-2">
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Exercise List */}
      <View className="px-4" style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-Poppins_600SemiBold">
            {exercises === undefined
              ? "Loading..."
              : `${filteredExercises.length} Exercise${filteredExercises.length !== 1 ? "s" : ""}`}
          </Text>
          {totalSelectedCount > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSelectedExercises(new Set());
                setSelectedExerciseDetails({});
              }}
              className="px-3 py-1"
            >
              <Text className="text-[#6F2DBD] text-sm font-Poppins_500Medium">
                Clear ({totalSelectedCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {exercises === undefined ? (
          <View>
            {Array.from({ length: 8 }, (_, index) => (
              <ExerciseSkeleton key={index} />
            ))}
          </View>
        ) : filteredExercises.length === 0 ? (
          <View className="bg-[#1c1c1e] rounded-2xl p-6 items-center">
            <Ionicons name="barbell" size={48} color="#666" />
            <Text className="text-white text-lg font-Poppins_600SemiBold mt-4 mb-2">
              No new exercises found
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
              All available exercises have been added to your workout or try
              adjusting your search.
            </Text>
          </View>
        ) : (
          <LegendList
            data={filteredExercises}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            extraData={selectionKey}
            renderItem={({ item: exercise, index }) => {
              const isSelected = selectedExercises.has(exercise._id);
              return (
                <View className={index > 0 ? "mt-4" : ""}>
                  <TouchableOpacity
                    key={`${exercise._id}-${isSelected}`}
                    onPress={() => toggleExerciseSelection(exercise._id)}
                    className={`bg-[#1c1c1e] rounded-2xl p-4 border-2 ${
                      isSelected ? "border-[#6F2DBD]" : "border-[#1c1c1e]"
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
                          {cleanExerciseTitle(exercise.title)}
                        </Text>

                        <View className="flex-row items-center flex-wrap gap-2">
                          <Badge variant="outline">
                            {exercise.exerciseType}
                          </Badge>

                          {exercise.equipment
                            .filter((equip) => equip !== null)
                            .slice(0, 2)
                            .map((equip) => (
                              <Badge key={equip._id} variant="outline">
                                {equip.name}
                              </Badge>
                            ))}
                          {exercise.equipment.filter((equip) => equip !== null)
                            .length > 2 && (
                            <Badge variant="outline">
                              +
                              {exercise.equipment.filter(
                                (equip) => equip !== null,
                              ).length - 2}
                            </Badge>
                          )}
                        </View>
                      </View>

                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center ${
                          isSelected ? "bg-[#6F2DBD]" : "bg-[#2c2c2e]"
                        }`}
                      >
                        <Ionicons
                          name={isSelected ? "checkmark" : "add"}
                          size={20}
                          color="#fff"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Add Exercises Button - Hidden in replacement mode */}
      {totalSelectedCount > 0 && !isReplacementMode && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-dark border-t border-neutral-700">
          <TouchableOpacity
            onPress={handleAddExercises}
            className="bg-[#6F2DBD] rounded-xl py-4 px-6 flex-row items-center justify-center"
          >
            <Text className="text-white font-Poppins_600SemiBold text-lg">
              Add {totalSelectedCount} exercise
              {totalSelectedCount !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Page;
