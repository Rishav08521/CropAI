import { Tabs } from "expo-router";
import React from "react";

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="sensors" options={{ title: "Sensors" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
    </Tabs>
  );
}
