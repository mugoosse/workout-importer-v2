import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="faq" options={{ presentation: "modal" }} />
    </Stack>
  );
};

export default Layout;
