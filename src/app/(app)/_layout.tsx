import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Redirect, Slot, useSegments } from "expo-router";

const Layout = () => {
  const segments = useSegments();
  const inAuthGroup = segments[1] === "(authenticated)";

  const isSignedIn = useQuery(api.auth.isAuthenticated);

  // Protect the inside area
  if (!isSignedIn && inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (isSignedIn && !inAuthGroup) {
    return <Redirect href="/(app)/(authenticated)/(tabs)/home" />;
  }

  return <Slot />;
};

export default Layout;
