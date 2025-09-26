import { exerciseThumbnails } from "@/assets/images/exercises/thumbnails";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/hooks/cache";
import { cleanExerciseTitle } from "@/utils/exerciseUtils";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useQuery } from "convex/react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
        {/* Title skeleton */}
        <View
          className="bg-gray-600 h-5 rounded mb-2"
          style={{ width: "70%" }}
        />

        {/* Badges skeleton */}
        <View className="flex-row items-center flex-wrap gap-2">
          <View
            className="bg-gray-600 h-6 rounded px-3 py-1"
            style={{ width: 80 }}
          />
          <View
            className="bg-gray-600 h-6 rounded px-3 py-1"
            style={{ width: 60 }}
          />
          <View
            className="bg-gray-600 h-6 rounded px-3 py-1"
            style={{ width: 70 }}
          />
        </View>
      </View>

      {/* Arrow skeleton */}
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

const Page = () => {
  const params = useLocalSearchParams<{
    majorGroups?: string;
    groups?: string;
    muscleIds?: string;
    muscleId?: string;
    muscleRole?: MuscleRole;
    muscleFunctions?: string;
    equipmentIds?: string;
    exerciseTypes?: string;
    search?: string;
  }>();

  const [searchText, setSearchText] = useState(params.search || "");
  const debouncedSearch = useDebounce(searchText, 300);

  // Get muscle and equipment details for display
  const muscle = useQuery(
    api.muscles.get,
    params.muscleId ? { muscleId: params.muscleId as Id<"muscles"> } : "skip",
  );
  const { data: equipment } = useCachedQuery(api.exercises.getAllEquipment, {});
  const { data: muscles } = useCachedQuery(api.muscles.list, {});

  // Parse multi-select parameters
  const majorGroups = params.majorGroups?.split(",");
  const groups = params.groups?.split(",");
  const muscleIds = params.muscleIds?.split(",") as Id<"muscles">[] | undefined;
  const muscleFunctions = params.muscleFunctions?.split(",") as
    | MuscleRole[]
    | undefined;
  const equipmentIds = params.equipmentIds?.split(",") as
    | Id<"equipment">[]
    | undefined;
  const exerciseTypes = params.exerciseTypes?.split(",");

  // Query exercises with current filters using cached stable query for persistent caching
  const { data: exercises, isStale } = useCachedQuery(
    api.exercises.getFilteredExercises,
    {
      majorGroups,
      groups,
      muscleIds,
      muscleId: params.muscleId as Id<"muscles"> | undefined,
      muscleRole: params.muscleRole,
      muscleFunctions,
      equipmentIds,
      exerciseTypes: exerciseTypes as any,
      searchTerm: debouncedSearch || undefined,
    },
  );

  const handleClearFilter = (filterType: string) => {
    const newParams = { ...params };
    delete newParams[filterType as keyof typeof params];

    const searchParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });

    const queryString = searchParams.toString();
    router.replace(
      `/(app)/(authenticated)/(modal)/exercises${queryString ? `?${queryString}` : ""}` as any,
    );
  };

  const handleClearAllFilters = () => {
    router.replace("/(app)/(authenticated)/(modal)/exercises");
    setSearchText("");
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const hasActiveFilters = !!(
    params.majorGroups ||
    params.groups ||
    params.muscleIds ||
    params.muscleId ||
    params.muscleFunctions ||
    params.equipmentIds ||
    params.exerciseTypes ||
    searchText
  );

  const filteredExercises = exercises || [];

  // Only show full loading screen on initial load (no previous data)
  if (exercises === undefined) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      {/* Search Bar */}
      <View className="mx-4 mt-4 mb-4">
        <View className="flex-row items-center bg-[#2c2c2e] rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="white" />
          <TextInput
            className="flex-1 ml-3 text-white font-Poppins_400Regular"
            placeholder="Search exercises..."
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
              if (params.groups)
                filterParams.set("currentGroups", params.groups);
              if (params.muscleFunctions)
                filterParams.set(
                  "currentMuscleFunctions",
                  params.muscleFunctions,
                );
              if (params.equipmentIds)
                filterParams.set("currentEquipmentIds", params.equipmentIds);
              if (params.exerciseTypes)
                filterParams.set("currentExerciseTypes", params.exerciseTypes);

              const queryString = filterParams.toString();
              router.replace(
                `/(app)/(authenticated)/(modal)/exercises/filter${queryString ? `?${queryString}` : ""}` as any,
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

          {groups && groups.length > 0 && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {groups.length === 1
                  ? groups[0].charAt(0).toUpperCase() +
                    groups[0].slice(1).replace(/_/g, " ")
                  : `${groups.length} Specific Groups`}
              </Text>
              <TouchableOpacity onPress={() => handleClearFilter("groups")}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {muscleIds && muscleIds.length > 0 && (
            <View className="bg-[#6F2DBD] rounded-xl px-3 py-3 flex-row items-center">
              <Text className="text-white text-sm font-Poppins_500Medium mr-2">
                {muscleIds.length === 1
                  ? (() => {
                      const muscle = muscles?.find(
                        (m) => m._id === muscleIds[0],
                      );
                      return muscle?.name || "Individual Muscle";
                    })()
                  : `${muscleIds.length} Individual Muscles`}
              </Text>
              <TouchableOpacity onPress={() => handleClearFilter("muscleIds")}>
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
              No exercises found
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
              Try adjusting your filters or search terms to find more exercises.
            </Text>
          </View>
        ) : (
          <LegendList
            data={filteredExercises}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: exercise, index }) => (
              <View className={index > 0 ? "mt-4" : ""}>
                <Link
                  href={`/(app)/(authenticated)/(modal)/exercise/${exercise._id}`}
                  asChild
                >
                  <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                    <View className="flex-row items-center justify-between">
                      {/* Thumbnail Image */}
                      <View className="mr-4 rounded-lg overflow-hidden shadow-lg">
                        {exerciseThumbnails[exercise._id] ? (
                          <Image
                            source={exerciseThumbnails[exercise._id]}
                            className="w-16 h-20"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-16 h-20 bg-[#2c2c2e] items-center justify-center">
                            <Text className="text-gray-500 text-xs">
                              No Image
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-1 mr-3">
                        <Text className="text-white text-xl font-Poppins_600SemiBold mb-3">
                          {cleanExerciseTitle(exercise.title)}
                        </Text>

                        <View className="flex-row items-center flex-wrap gap-2">
                          <Badge variant="outline">
                            <Text className="text-white text-xs">
                              {exercise.exerciseType}
                            </Text>
                          </Badge>

                          {/* Equipment tags inline */}
                          {exercise.equipment
                            .filter((equip) => equip !== null)
                            .slice(0, 1)
                            .map((equip) => (
                              <Badge key={equip._id} variant="outline">
                                <Text className="text-white text-xs">
                                  {equip.name}
                                </Text>
                              </Badge>
                            ))}
                          {exercise.equipment.filter((equip) => equip !== null)
                            .length > 1 && (
                            <Badge variant="outline">
                              <Text className="text-white text-xs">
                                +
                                {exercise.equipment.filter(
                                  (equip) => equip !== null,
                                ).length - 1}
                              </Text>
                            </Badge>
                          )}
                        </View>
                      </View>

                      <View className="bg-[#2c2c2e] w-12 h-12 rounded-xl items-center justify-center shadow-md">
                        <Ionicons
                          name="chevron-forward"
                          size={24}
                          color="#fff"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Page;
