import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { PackageBadge } from "@/components/PackageBadge";

interface MemberDetail {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  packageType: string;
  packageStartDate: string;
  packageEndDate: string;
  totalFeesPaid: number;
  notes?: string;
  status: string;
  daysRemaining: number;
  profilePhoto?: string;
}

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: color || colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function MemberDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);

  const loadMember = useCallback(async () => {
    try {
      const data = await api.get<{ success: boolean; data: MemberDetail }>(`/members/${id}`);
      setMember(data.data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleRemind = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminding(true);
    try {
      await api.post(`/members/${id}/remind`, {});
      Alert.alert("Reminder Sent", `Renewal reminder sent to ${member?.fullName}`);
      loadMember();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setReminding(false);
    }
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Member", `Delete ${member?.fullName}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/members/${id}`);
            router.back();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!member) return null;

  const progressPercent = member.daysRemaining > 0
    ? Math.min(member.daysRemaining / 30, 1)
    : 0;

  const statusColor = member.status === "Active" ? colors.success : member.status === "Expiring Soon" ? colors.warning : colors.danger;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Member Details</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/members/edit/[id]", params: { id } })}
          style={styles.editBtn}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 40 }}
      >
        <View style={styles.profileSection}>
          <AvatarCircle name={member.fullName} photo={member.profilePhoto} size={80} />
          <Text style={[styles.memberName, { color: colors.foreground }]}>{member.fullName}</Text>
          <View style={styles.badges}>
            <PackageBadge type={member.packageType} />
            <StatusBadge status={member.status} />
          </View>

          <View style={[styles.daysCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.daysProgress, { backgroundColor: colors.surfaceHigh }]}>
              <View style={[styles.daysProgressFill, { backgroundColor: statusColor, width: `${progressPercent * 100}%` as any }]} />
            </View>
            <Text style={[styles.daysRemaining, { color: statusColor }]}>
              {member.daysRemaining > 0 ? `${member.daysRemaining} days remaining` : "Expired"}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <InfoRow icon="email" label="Email" value={member.email} />
          <InfoRow icon="phone" label="Phone" value={member.phone} />
          <InfoRow icon="currency-usd" label="Fees Paid" value={`$${member.totalFeesPaid.toFixed(2)}`} color={colors.success} />
          <InfoRow
            icon="calendar-start"
            label="Start Date"
            value={new Date(member.packageStartDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          />
          <InfoRow
            icon="calendar-end"
            label="Expiry Date"
            value={new Date(member.packageEndDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            color={statusColor}
          />
          {member.notes ? (
            <InfoRow icon="note-text" label="Notes" value={member.notes} />
          ) : null}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning + "20", borderColor: colors.warning }]}
            onPress={handleRemind}
            disabled={reminding}
          >
            {reminding ? (
              <ActivityIndicator color={colors.warning} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="bell-ring" size={20} color={colors.warning} />
                <Text style={[styles.actionButtonText, { color: colors.warning }]}>Send Reminder</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.danger + "20", borderColor: colors.danger }]}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons name="delete" size={20} color={colors.danger} />
            <Text style={[styles.actionButtonText, { color: colors.danger }]}>Delete Member</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  editBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  screenTitle: { fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  profileSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20, gap: 10 },
  memberName: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  badges: { flexDirection: "row", gap: 8 },
  daysCard: { width: "100%", borderRadius: 14, padding: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  daysProgress: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden" },
  daysProgressFill: { height: "100%", borderRadius: 3 },
  daysRemaining: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  infoCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2a2a3a" },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  infoValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  actionsSection: { flexDirection: "row", gap: 12, paddingHorizontal: 20 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1 },
  actionButtonText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
