import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PlanProvider } from "@/features/plan-store";
import { C } from "@/components/investing/ui";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <PlanProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
            animation: "none",
          }}
        />
      </PlanProvider>
    </SafeAreaProvider>
  );
}
