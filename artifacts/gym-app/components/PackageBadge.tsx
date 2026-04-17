import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PackageBadgeProps {
  type: string;
}

const packageConfig: Record<string, { bg: string; text: string }> = {
  Daily: { bg: "#3b82f620", text: "#3b82f6" },
  Monthly: { bg: "#22c55e20", text: "#22c55e" },
  "6 Months": { bg: "#8b5cf620", text: "#8b5cf6" },
  "1 Year": { bg: "#f59e0b20", text: "#f59e0b" },
};

export function PackageBadge({ type }: PackageBadgeProps) {
  const config = packageConfig[type] || { bg: "#6366f120", text: "#6366f1" };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
