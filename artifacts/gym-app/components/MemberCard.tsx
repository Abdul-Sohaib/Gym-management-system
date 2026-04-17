import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { AvatarCircle } from "./AvatarCircle";
import { StatusBadge } from "./StatusBadge";
import { PackageBadge } from "./PackageBadge";

interface Member {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  packageType: string;
  packageEndDate: string;
  status: string;
  daysRemaining: number;
  profilePhoto?: string;
}

interface MemberCardProps {
  member: Member;
  onPress: () => void;
  onEdit: () => void;
  onRemind: () => void;
  onDelete: () => void;
}

export function MemberCard({ member, onPress, onEdit, onRemind, onDelete }: MemberCardProps) {
  const colors = useColors();

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Member",
      `Are you sure you want to delete ${member.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <AvatarCircle name={member.fullName} photo={member.profilePhoto} size={48} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {member.fullName}
          </Text>
          <Text style={[styles.phone, { color: colors.mutedForeground }]}>{member.phone}</Text>
          <View style={styles.badges}>
            <PackageBadge type={member.packageType} />
            <StatusBadge status={member.status} />
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemind} style={styles.actionBtn}>
            <MaterialCommunityIcons name="bell-ring" size={18} color={colors.warning} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <MaterialCommunityIcons name="delete" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          {member.daysRemaining > 0
            ? `${member.daysRemaining} day${member.daysRemaining === 1 ? "" : "s"} remaining`
            : "Expired"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  phone: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a3a",
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
