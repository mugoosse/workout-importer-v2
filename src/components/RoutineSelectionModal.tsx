import { Badge } from "@/components/ui/Badge";
import { activeWorkoutAtom } from "@/store/activeWorkout";
import {
  myRoutinesAtom,
  newlyCreatedRoutineIdAtom,
  populateRealExerciseIdsAction,
  publicRoutinesAtom,
  realExerciseIdsPopulatedAtom,
  routineSelectionOpenAtom,
  selectedRoutineIdsAtom,
  stackRoutinesAction,
  type Routine,
} from "@/store/routines";
import { Ionicons } from "@expo/vector-icons";
import { useConvex } from "convex/react";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

interface RoutineItemProps {
  routine: Routine;
  isSelected: boolean;
  onToggle: () => void;
}

const RoutineItem: React.FC<RoutineItemProps> = ({
  routine,
  isSelected,
  onToggle,
}) => {
  const exerciseCount = routine.exercises.length;
  const totalSets = routine.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );

  // Get unique exercise types from routine exercises
  const uniqueExerciseTypes = Array.from(
    new Set(
      routine.exercises.map((ex) => ex.exerciseDetails?.type).filter(Boolean),
    ),
  );

  // Get unique equipment from routine exercises (flatten and dedupe)
  const uniqueEquipment = Array.from(
    new Set(
      routine.exercises
        .flatMap((ex) => ex.exerciseDetails?.equipment || [])
        .filter(Boolean),
    ),
  );

  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`bg-[#1c1c1e] rounded-2xl p-4 border-2 mb-3 ${
        isSelected ? "border-[#6F2DBD]" : "border-[#1c1c1e]"
      }`}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
            {routine.title}
          </Text>

          {routine.description && (
            <Text className="text-gray-400 text-sm font-Poppins_400Regular mb-2">
              {routine.description}
            </Text>
          )}

          <View className="flex-row items-center flex-wrap gap-2">
            {/* Exercise types as badges */}
            {uniqueExerciseTypes.slice(0, 2).map((type) => (
              <Badge key={type} variant="outline">
                {type}
              </Badge>
            ))}

            {/* Equipment as badges */}
            {uniqueEquipment.slice(0, 2).map((equipment) => (
              <Badge key={equipment} variant="outline">
                {equipment}
              </Badge>
            ))}

            {/* Show "+" if there are more items */}
            {uniqueExerciseTypes.length + uniqueEquipment.length > 4 && (
              <Badge variant="outline">
                +{uniqueExerciseTypes.length + uniqueEquipment.length - 4}
              </Badge>
            )}
          </View>

          <View className="flex-row gap-4 mt-2">
            <Text className="text-gray-500 text-xs font-Poppins_400Regular">
              {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
            </Text>
            <Text className="text-gray-500 text-xs font-Poppins_400Regular">
              {totalSets} set{totalSets !== 1 ? "s" : ""}
            </Text>
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
  );
};

interface CollapsibleGroupProps {
  title: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  rightAction?: React.ReactNode;
}

const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  title,
  children,
  isCollapsed,
  onToggle,
  rightAction,
}) => {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          onPress={onToggle}
          className="flex-row items-center flex-1"
        >
          <Text className="text-white text-xl font-Poppins_600SemiBold mr-2">
            {title}
          </Text>
          <Ionicons
            name={isCollapsed ? "chevron-down" : "chevron-up"}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
        {rightAction}
      </View>
      {!isCollapsed && <View>{children}</View>}
    </View>
  );
};

interface RoutineSelectionModalProps {
  visible?: boolean;
  onClose?: () => void;
  onSelect?: (selectedRoutines: Routine[]) => void;
  mode?: "create-workout" | "add-to-workout";
  title?: string;
}

export const RoutineSelectionModal: React.FC<RoutineSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  mode = "create-workout",
  title,
}) => {
  const convex = useConvex();
  const [isOpen, setIsOpen] = useAtom(routineSelectionOpenAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedRoutineIdsAtom);
  const [myRoutines] = useAtom(myRoutinesAtom);
  const [publicRoutines] = useAtom(publicRoutinesAtom);
  const [, stackRoutines] = useAtom(stackRoutinesAction);
  const [, setActiveWorkout] = useAtom(activeWorkoutAtom);
  const [, populateRealExerciseIds] = useAtom(populateRealExerciseIdsAction);
  const [isPopulated] = useAtom(realExerciseIdsPopulatedAtom);
  const [newlyCreatedRoutineId, setNewlyCreatedRoutineId] = useAtom(
    newlyCreatedRoutineIdAtom,
  );

  const [myRoutinesCollapsed, setMyRoutinesCollapsed] = useState(false);
  const [publicRoutinesCollapsed, setPublicRoutinesCollapsed] = useState(false);

  // Local state for add-to-workout mode
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  // Use external visible state if provided, otherwise use internal state
  const modalVisible = visible !== undefined ? visible : isOpen;
  const currentSelectedIds =
    mode === "add-to-workout" ? localSelectedIds : selectedIds;

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (modalVisible) {
      // Populate real exercise IDs when modal opens for the first time
      if (!isPopulated) {
        populateRealExerciseIds(convex);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [
    modalVisible,
    isPopulated,
    populateRealExerciseIds,
    convex,
    fadeAnim,
    slideAnim,
  ]);

  // Auto-select newly created routine
  useEffect(() => {
    if (newlyCreatedRoutineId && isOpen) {
      const newSelected = new Set(selectedIds);
      newSelected.add(newlyCreatedRoutineId);
      setSelectedIds(newSelected);
      setNewlyCreatedRoutineId(null); // Clear after using
    }
  }, [
    newlyCreatedRoutineId,
    isOpen,
    selectedIds,
    setSelectedIds,
    setNewlyCreatedRoutineId,
  ]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
    // Reset local selections for add-to-workout mode
    if (mode === "add-to-workout") {
      setLocalSelectedIds(new Set());
    }
  };

  const handleToggleRoutine = (routineId: string) => {
    if (mode === "add-to-workout") {
      const newSelected = new Set(localSelectedIds);
      if (newSelected.has(routineId)) {
        newSelected.delete(routineId);
      } else {
        newSelected.add(routineId);
      }
      setLocalSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(routineId)) {
        newSelected.delete(routineId);
      } else {
        newSelected.add(routineId);
      }
      setSelectedIds(newSelected);
    }
  };

  const handleCreateRoutine = () => {
    // Close the routine selection modal
    setIsOpen(false);

    // Navigate to create routine screen
    router.push("/(app)/(authenticated)/(modal)/create-routine");
  };

  const handleConfirm = () => {
    const currentIds =
      mode === "add-to-workout" ? localSelectedIds : selectedIds;
    if (currentIds.size === 0) return;

    if (mode === "add-to-workout" && onSelect) {
      // For add-to-workout mode, get the selected routines and call onSelect
      const routineIds = Array.from(currentIds);
      const allRoutines = [...myRoutines, ...publicRoutines];
      const selectedRoutines = routineIds
        .map((id) => allRoutines.find((r) => r.id === id))
        .filter((routine): routine is Routine => routine !== undefined);

      onSelect(selectedRoutines);
      return;
    }

    // Original behavior for create-workout mode
    const routineIds = Array.from(selectedIds);
    const workout = stackRoutines(routineIds, {
      clearValues: false,
    });

    // Set the active workout
    setActiveWorkout(workout);

    // Close modal and navigate to workout screen
    handleClose();

    // Close the create modal first, then navigate to workout
    router.back(); // Close create modal
    router.push("/(app)/(authenticated)/(modal)/workout/active-workout");
  };

  const selectedCount = currentSelectedIds.size;

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        className="flex-1"
      >
        <Animated.View
          className="absolute inset-0 bg-black"
          style={{
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          }}
        />
      </TouchableOpacity>

      <Animated.View
        className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl"
        style={{
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [screenHeight * 0.8, 0],
              }),
            },
          ],
          maxHeight: screenHeight * 0.8,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-800">
          <View>
            <Text className="text-white text-xl font-Poppins_600SemiBold">
              {title || "Select Routines"}
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular mt-1">
              {mode === "add-to-workout"
                ? "Select routines to add to your current workout"
                : "Select a routine to follow or combine multiple"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="w-8 h-8 rounded-full bg-neutral-800 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {/* My Routines */}
          <CollapsibleGroup
            title="My Routines"
            isCollapsed={myRoutinesCollapsed}
            onToggle={() => setMyRoutinesCollapsed(!myRoutinesCollapsed)}
          >
            {myRoutines.map((routine) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                isSelected={currentSelectedIds.has(routine.id)}
                onToggle={() => handleToggleRoutine(routine.id)}
              />
            ))}
            <TouchableOpacity
              onPress={handleCreateRoutine}
              className="bg-[#6F2DBD] rounded-xl p-4 mb-4 flex-row items-center justify-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-Poppins_600SemiBold ml-2">
                {myRoutines.length === 0 ? "Create" : "Add"} Routine
              </Text>
            </TouchableOpacity>
          </CollapsibleGroup>

          {/* Public Routines */}
          <CollapsibleGroup
            title="Public Routines"
            isCollapsed={publicRoutinesCollapsed}
            onToggle={() =>
              setPublicRoutinesCollapsed(!publicRoutinesCollapsed)
            }
          >
            {publicRoutines.map((routine) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                isSelected={currentSelectedIds.has(routine.id)}
                onToggle={() => handleToggleRoutine(routine.id)}
              />
            ))}
          </CollapsibleGroup>

          {/* Spacer for bottom action */}
          <View className="h-24" />
        </ScrollView>

        {/* Bottom Action */}
        {selectedCount > 0 && (
          <View className="px-6 py-4 border-t border-neutral-800 bg-neutral-900">
            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-purple-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Add {selectedCount} Routine{selectedCount !== 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};
