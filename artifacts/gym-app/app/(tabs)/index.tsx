import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { StatCard } from "@/components/StatCard";
import { PackageBadge } from "@/components/PackageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { AvatarCircle } from "@/components/AvatarCircle";
import { EmptyState } from "@/components/EmptyState";
import { BarChart } from "react-native-gifted-charts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Summary {
  totalMembers: number;
  activeMembers: number;
  expiringThisWeek: number;
  expiredMembers: number;
  recentMembers: any[];
}

interface ChartPoint {
  month: string;
  value: number;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { admin } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, monthlyRes] = await Promise.all([
        api.get<{ success: boolean; data: Summary }>("/analytics/summary"),
        api.get<{ success: boolean; data: ChartPoint[] }>("/analytics/monthly-signups"),
      ]);
      setSummary(summaryRes.data);
      setMonthlyData(monthlyRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const barData = monthlyData.map((d) => ({
    value: d.value,
    label: d.month,
    frontColor: "#6366f1",
  }));

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.headerSection}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {getGreeting()}, {admin?.fullName?.split(" ")[0] || "Admin"}
          </Text>
          <Text style={[styles.gymName, { color: colors.foreground }]}>{admin?.gymName}</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>
        <View style={[styles.logoBg, { backgroundColor: colors.primary + "20" }]}>
          <MaterialCommunityIcons name="dumbbell" size={28} color={colors.primary} />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard icon="account-group" label="Total Members" value={summary?.totalMembers ?? 0} color={colors.primary} />
          <StatCard icon="account-check" label="Active" value={summary?.activeMembers ?? 0} color={colors.success} />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="clock-alert" label="Expiring" value={summary?.expiringThisWeek ?? 0} color={colors.warning} subtitle="This week" />
          <StatCard icon="account-off" label="Expired" value={summary?.expiredMembers ?? 0} color={colors.danger} />
        </View>
      </View>

      {barData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Signups</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <BarChart
              data={barData}
              barWidth={18}
              spacing={8}
              roundedTop
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 9 }}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value), 4)}
              width={SCREEN_WIDTH - 80}
              isAnimated
              animationDuration={800}
              hideRules
            />
          </View>
        </View>
      )}

      <View style={styles.recentSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Members</Text>
        {(summary?.recentMembers || []).length === 0 ? (
          <EmptyState icon="account-group" title="No members yet" subtitle="Add your first member to get started" />
        ) : (
          (summary?.recentMembers || []).map((member) => (
            <View
              key={member._id}
              style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <AvatarCircle name={member.fullName} photo={member.profilePhoto} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.memberName, { color: colors.foreground }]}>{member.fullName}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 3 }}>
                  <PackageBadge type={member.packageType} />
                  <StatusBadge status={member.status} />
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerSection: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  gymName: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2 },
  date: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  logoBg: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statsGrid: { paddingHorizontal: 16, marginBottom: 24 },
  statsRow: { flexDirection: "row", marginBottom: 0 },
  chartSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  chartCard: { borderRadius: 16, padding: 16, borderWidth: 1, overflow: "hidden" },
  recentSection: { paddingHorizontal: 20, marginBottom: 20 },
  memberRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  memberName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
