import { WorkoutTimerProvider } from "@/components/WorkoutTimerProvider";
import { twFullConfig } from "@/utils/twconfig";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

const Layout = () => {
  return (
    <WorkoutTimerProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: (twFullConfig.theme.colors as any).dark,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modal)/create-workout-modal"
          options={{
            presentation: "formSheet",
            animation: "slide_from_bottom",
            sheetAllowedDetents: [0.3],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
            headerShown: false,
            contentStyle: {
              backgroundColor: (twFullConfig.theme.colors as any).dark,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/muscle-group/[group]"
          options={{
            presentation: "formSheet",
            animation: "slide_from_bottom",
            sheetAllowedDetents: [0.5],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
            headerShown: false,
            contentStyle: {
              backgroundColor: (twFullConfig.theme.colors as any).dark,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/exercise/menu"
          options={{
            presentation: "formSheet",
            animation: "slide_from_bottom",
            sheetAllowedDetents: [0.3],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
            headerShown: false,
            contentStyle: {
              backgroundColor: (twFullConfig.theme.colors as any).dark,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/workout/exercise-menu"
          options={{
            presentation: "formSheet",
            animation: "slide_from_bottom",
            sheetAllowedDetents: [0.3],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
            headerShown: false,
            contentStyle: {
              backgroundColor: (twFullConfig.theme.colors as any).dark,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/exercise/[id]"
          options={{
            title: "Exercise Details",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/exercise/[id]/videos"
          options={{
            title: "Exercise Videos",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="(modal)/exercises/index"
          options={{
            title: "Exercises",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="(modal)/exercises/filter"
          options={{
            title: "Filter Exercises",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/equipment/index"
          options={{
            title: "Equipment",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="(modal)/equipment/[id]"
          options={{
            title: "Equipment Details",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="(modal)/muscle/[id]"
          options={{
            title: "Muscle Details",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontFamily: "Poppins_600SemiBold" },
          }}
        />
        <Stack.Screen
          name="(modal)/muscle-group/[group]/muscles"
          options={{
            title: "Muscle Details",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="(modal)/workout/active-workout"
          options={{
            title: "Active Workout",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontFamily: "Poppins_600SemiBold" },
          }}
        />
        <Stack.Screen
          name="(modal)/workout/save-workout"
          options={{
            title: "Save Workout",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontFamily: "Poppins_600SemiBold" },
          }}
        />
        <Stack.Screen
          name="(modal)/workout/add-exercises"
          options={{
            title: "Add Exercises",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="(modal)/workout/[sessionId]"
          options={{
            title: "Workout Details",
            headerShown: true,
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontFamily: "Poppins_600SemiBold" },
          }}
        />
        <Stack.Screen
          name="(modal)/create-routine"
          options={{
            title: "Create Routine",
            headerShown: false, // We handle header in the component
            presentation: "modal",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontFamily: "Poppins_600SemiBold" },
          }}
        />
      </Stack>
    </WorkoutTimerProvider>
  );
};

export default Layout;
