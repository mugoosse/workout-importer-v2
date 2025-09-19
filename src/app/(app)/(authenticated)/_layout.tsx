import { twFullConfig } from "@/utils/twconfig";
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modal)/create"
        options={{
          presentation: "formSheet",
          animation: "slide_from_bottom",
          sheetAllowedDetents: [0.3],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: false,
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
          sheetGrabberVisible: false,
          sheetCornerRadius: 20,
          headerShown: false,
          contentStyle: {
            backgroundColor: (twFullConfig.theme.colors as any).dark,
          },
        }}
      />
      <Stack.Screen
        name="(modal)/exercise/source-menu"
        options={{
          presentation: "formSheet",
          animation: "slide_from_bottom",
          sheetAllowedDetents: [0.3],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: false,
          sheetCornerRadius: 20,
          headerShown: false,
          contentStyle: {
            backgroundColor: (twFullConfig.theme.colors as any).dark,
          },
        }}
      />
    </Stack>
  );
};

export default Layout;
