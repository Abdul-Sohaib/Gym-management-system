import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { MemberCard } from "@/components/MemberCard";
import { EmptyState } from "@/components/EmptyState";

const FILTERS = ["All", "Active", "Expiring Soon", "Expired"];

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

export default function MembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMembers = useCallback(async (searchQuery = "", statusFilter = "All") => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "All") params.set("status", statusFilter);
      params.set("limit", "100");

      const data = await api.get<{ success: boolean; data: { members: Member[] } }>(
        `/members?${params.toString()}`
      );
      setMembers(data.data?.members ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadMembers(search, filter);
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadMembers(text, filter);
    }, 400);
  };

  const handleFilter = (f: string) => {
    setFilter(f);
    loadMembers(search, f);
  };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await api.delete(`/members/${id}`);
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRemind = async (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.post(`/members/${id}/remind`, {});
      Alert.alert("Reminder Sent", `Renewal reminder sent to ${name}`);
      loadMembers(search, filter);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers(search, filter);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Members</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); loadMembers("", filter); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                { backgroundColor: filter === f ? colors.primary : colors.card, borderColor: filter === f ? colors.primary : colors.border },
              ]}
              onPress={() => handleFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m._id}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              onPress={() => router.push({ pathname: "/members/[id]", params: { id: item._id } })}
              onEdit={() => router.push({ pathname: "/members/edit/[id]", params: { id: item._id } })}
              onRemind={() => handleRemind(item._id, item.fullName)}
              onDelete={() => handleDelete(item._id)}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="account-group"
              title="No members found"
              subtitle={search ? "Try a different search term" : "Tap + to add your first member"}
            />
          }
          scrollEnabled
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (Platform.OS === "web" ? 34 : insets.bottom) + 80 }]}
        onPress={() => router.push("/members/add")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 14 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterRow: { marginBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: 20, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
