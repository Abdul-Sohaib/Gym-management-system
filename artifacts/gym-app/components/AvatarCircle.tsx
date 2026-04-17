import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

function hashColor(name: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#06b6d4",
    "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface AvatarCircleProps {
  name: string;
  photo?: string;
  size?: number;
}

export function AvatarCircle({ name, photo, size = 44 }: AvatarCircleProps) {
  const bg = hashColor(name);
  const initials = getInitials(name);
  const fontSize = size * 0.35;

  if (photo && photo.length > 10) {
    const uri = photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`;
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initials, { fontSize, color: "#fff" }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
