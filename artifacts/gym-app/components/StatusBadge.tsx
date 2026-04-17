import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  Active: { bg: "#22c55e20", text: "#22c55e", label: "Active" },
  "Expiring Soon": { bg: "#f59e0b20", text: "#f59e0b", label: "Expiring" },
  Expired: { bg: "#ef444420", text: "#ef4444", label: "Expired" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.Active;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
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
