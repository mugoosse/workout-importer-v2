import { HapticTab } from "@/components/HapticTab";
import { activeWorkoutAtom } from "@/store/activeWorkout";
import { twFullConfig } from "@/utils/twconfig";
import { Ionicons } from "@expo/vector-icons";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, Tabs } from "expo-router";
import { useAtom } from "jotai";
import { cssInterop } from "nativewind";
import { Text, TouchableOpacity } from "react-native";

cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});

cssInterop(Ionicons, {
  className: {
    target: "style",
    nativeStyleToProp: { color: true },
  },
});

const CreateButton = () => {
  const [activeWorkout] = useAtom(activeWorkoutAtom);

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeWorkout.isActive) {
      router.push("/(app)/(authenticated)/(modal)/workout/active-workout");
    } else {
      router.push("/(app)/(authenticated)/(modal)/create-workout-modal");
    }
  };

  return (
    <TouchableOpacity
      onPress={handleCreate}
      className="rounded-xl flex-1 items-center justify-center"
    >
      <LinearGradient
        colors={["#6F2DBD", "#6F2DBD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl items-center justify-center px-6 py-2"
      >
        <Text className="text-white text-lg font-Poppins_500Medium">
          {activeWorkout.isActive ? "Resume" : "Start"}
        </Text>
        <Text className="text-white text-lg font-Poppins_500Medium">
          Workout
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// https://github.com/EvanBacon/expo-router-forms-components/blob/main/components/ui/Tabs.tsx
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: (twFullConfig.theme.colors as any).dark,
          elevation: 0,
          height: 100,
          borderTopColor: "#494949",
        },
        headerStyle: {
          backgroundColor: (twFullConfig.theme.colors as any).dark,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontFamily: "Poppins_600SemiBold",
          fontSize: 22,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Poppins_500Medium",
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#6c6c6c",
        headerTintColor: "#fff",
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Muscle Trophy",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <PlatformPressable
              {...props}
              style={{ gap: 6, alignItems: "center", marginTop: 10 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          tabBarButton: () => <CreateButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <PlatformPressable
              {...props}
              style={{ gap: 6, alignItems: "center", marginTop: 10 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
