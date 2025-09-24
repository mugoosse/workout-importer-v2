import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import {
  createRoutineAction,
  generateId,
  newlyCreatedRoutineIdAtom,
  routineEditorAtom,
  routineValidationAtom,
  shouldReopenModalAtom,
  type RoutineDraft,
  type RoutineSet,
} from "@/store/routines";
import { unitsConfigAtom } from "@/store/units";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useAtom } from "jotai";
import React from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CreateRoutinePage = () => {
  const [draft, setDraft] = useAtom(routineEditorAtom);
  const [validation] = useAtom(routineValidationAtom);
  const [, createRoutine] = useAtom(createRoutineAction);
  const [, setNewlyCreatedRoutineId] = useAtom(newlyCreatedRoutineIdAtom);
  const [, setShouldReopenModal] = useAtom(shouldReopenModalAtom);
  const [unitsConfig] = useAtom(unitsConfigAtom);

  // Direct state updates for title and description - no debouncing needed
  const updateTitle = (title: string) => {
    if (draft) {
      setDraft({ ...draft, title });
    }
  };

  const updateDescription = (description: string) => {
    if (draft) {
      setDraft({ ...draft, description });
    }
  };

  // Initialize draft if not exists
  React.useEffect(() => {
    if (!draft) {
      const newDraft: RoutineDraft = {
        title: "",
        description: "",
        exercises: [],
        isUnsaved: true,
      };
      setDraft(newDraft);
    }
  }, [draft, setDraft]);

  const handleSaveRoutine = async () => {
    if (!draft || !validation.isValid) {
      Alert.alert("Validation Error", validation.errors.join("\n"));
      return;
    }

    try {
      const routine = await createRoutine({
        title: draft.title,
        description: draft.description,
        exercises: draft.exercises,
      });

      // Set the newly created routine ID and flag to reopen modal
      setNewlyCreatedRoutineId(routine.id);
      setShouldReopenModal(true);

      // Clear draft and navigate back
      setDraft(null);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to create routine");
    }
  };

  const hasUnsavedChanges = () => {
    if (!draft) return false;
    return (
      draft.title.trim() !== "" ||
      (draft.description || "").trim() !== "" ||
      draft.exercises.length > 0
    );
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setDraft(null);
              router.back();
            },
          },
        ],
      );
    } else {
      setDraft(null);
      router.back();
    }
  };

  // Remove the old direct update functions since we now use debounced inputs

  const addExercise = () => {
    // Navigate to exercise selection in routine mode
    router.push(
      "/(app)/(authenticated)/(modal)/workout/add-exercises?mode=routine",
    );
  };

  const removeExercise = (exerciseId: string) => {
    if (!draft) return;

    setDraft({
      ...draft,
      exercises: draft.exercises.filter((ex) => ex.id !== exerciseId),
    });
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!draft) return;

    const newSet: RoutineSet = {
      id: generateId(),
    };

    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex,
      ),
    });
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    if (!draft) return;

    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((set) => set.id !== setId) }
          : ex,
      ),
    });
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: string,
    value: any,
  ) => {
    if (!draft) return;

    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : ex,
      ),
    });
  };

  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    if (!draft) return;

    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, notes } : ex,
      ),
    });
  };

  if (!draft) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen
        options={{
          title: "New Routine",
          headerShown: true,
          presentation: "modal",
          headerStyle: { backgroundColor: "#000000" },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSaveRoutine}
              disabled={!validation.isValid}
              className={`px-4 py-2 rounded-xl ${
                validation.isValid ? "bg-[#6F2DBD]" : "bg-gray-600"
              }`}
            >
              <Text className="text-white font-Poppins_600SemiBold">Save</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 px-4 py-4">
        {/* Title Input */}
        <View className="mb-4">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
            Routine Title *
          </Text>
          <TextInput
            value={draft.title}
            onChangeText={updateTitle}
            placeholder="Enter routine name"
            placeholderTextColor="#6B7280"
            className="bg-zinc-800 text-white px-4 py-3 rounded-xl font-Poppins_400Regular"
          />
          {!validation.isValid &&
            validation.errors.includes("Title is required") && (
              <Text className="text-red-500 text-sm mt-1 font-Poppins_400Regular">
                Title is required
              </Text>
            )}
        </View>

        {/* Description Input */}
        <View className="mb-6">
          <Text className="text-white text-lg font-Poppins_600SemiBold mb-2">
            Description (Optional)
          </Text>
          <TextInput
            value={draft.description}
            onChangeText={updateDescription}
            placeholder="Describe your routine"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={3}
            className="bg-zinc-800 text-white px-4 py-3 rounded-xl font-Poppins_400Regular"
            textAlignVertical="top"
          />
        </View>

        {/* Exercises Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-Poppins_600SemiBold">
              Exercises ({draft.exercises.length})
            </Text>
            <TouchableOpacity
              onPress={addExercise}
              className="bg-[#1c1c1e] px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-Poppins_500Medium ml-2">
                Add Exercise
              </Text>
            </TouchableOpacity>
          </View>

          {draft.exercises.length === 0 ? (
            <TouchableOpacity
              onPress={addExercise}
              className="bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-xl p-8 items-center"
            >
              <Ionicons name="fitness-outline" size={48} color="#6B7280" />
              <Text className="text-gray-400 text-lg font-Poppins_600SemiBold mt-2">
                Add Your First Exercise
              </Text>
              <Text className="text-gray-500 text-sm font-Poppins_400Regular mt-1 text-center">
                Build your routine by selecting exercises
              </Text>
            </TouchableOpacity>
          ) : (
            // Exercise List
            draft.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                mode="routine"
                exercise={exercise}
                index={index}
                onAddSet={() => addSetToExercise(exercise.id)}
                onRemoveSet={(setId) =>
                  removeSetFromExercise(exercise.id, setId)
                }
                onUpdateSet={(setId, updates) =>
                  Object.entries(updates).forEach(([field, value]) =>
                    updateSet(exercise.id, setId, field, value),
                  )
                }
                onUpdateNotes={(notes) =>
                  updateExerciseNotes(exercise.id, notes)
                }
                onRemoveExercise={() => removeExercise(exercise.id)}
                unitsConfig={unitsConfig}
              />
            ))
          )}
        </View>

        {/* Add Exercise / Discard Routine Buttons */}
        <View className="mb-4">
          {draft.exercises.length > 0 && (
            <TouchableOpacity
              onPress={addExercise}
              className="bg-[#1c1c1e] rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-Poppins_500Medium ml-2">
                Add Exercise
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleGoBack}
            className="bg-[#1c1c1e] rounded-xl p-4 flex-row items-center justify-center mb-4"
          >
            <Ionicons name="trash" size={18} color="#ef4444" />
            <Text className="text-red-500 font-Poppins_500Medium ml-2">
              Discard Routine
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateRoutinePage;
