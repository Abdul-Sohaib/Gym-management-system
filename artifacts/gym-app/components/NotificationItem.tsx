import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface NotificationItemProps {
  item: {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  };
  onPress: () => void;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  renewal_alert: { icon: "bell-ring", color: "#f59e0b" },
  new_member: { icon: "account-plus", color: "#22c55e" },
  member_deleted: { icon: "account-remove", color: "#ef4444" },
  manual_reminder: { icon: "bell-check", color: "#6366f1" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export function NotificationItem({ item, onPress }: NotificationItemProps) {
  const colors = useColors();
  const config = typeConfig[item.type] || { icon: "bell", color: colors.primary };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: item.isRead ? colors.card : colors.surfaceHigh, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBg, { backgroundColor: config.color + "20" }]}>
        <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
});
