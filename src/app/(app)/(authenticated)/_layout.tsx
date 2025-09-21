import { WorkoutTimerProvider } from "@/components/WorkoutTimerProvider";
import { twFullConfig } from "@/utils/twconfig";
import { Stack } from "expo-router";

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
          name="(modal)/create"
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
      </Stack>
    </WorkoutTimerProvider>
  );
};

export default Layout;
