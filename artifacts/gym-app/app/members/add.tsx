import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { FormInput } from "@/components/FormInput";

const PACKAGES = ["Daily", "Monthly", "6 Months", "1 Year"];

function calculateEndDate(start: Date, packageType: string): Date {
  const end = new Date(start);
  switch (packageType) {
    case "Daily": end.setDate(end.getDate() + 1); break;
    case "Monthly": end.setDate(end.getDate() + 30); break;
    case "6 Months": end.setDate(end.getDate() + 180); break;
    case "1 Year": end.setDate(end.getDate() + 365); break;
  }
  return end;
}

export default function AddMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    packageType: "Monthly",
    totalFeesPaid: "",
    notes: "",
    profilePhoto: "",
  });
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const endDate = calculateEndDate(startDate, form.packageType);

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = result.assets[0].base64;
      if (base64.length > 2 * 1024 * 1024) {
        Alert.alert("File too large", "Please select an image under 2MB");
        return;
      }
      update("profilePhoto", `data:image/jpeg;base64,${base64}`);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name required";
    if (!form.email.trim()) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Phone required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await api.post("/members", {
        fullName: form.fullName.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        packageType: form.packageType,
        packageStartDate: startDate.toISOString(),
        totalFeesPaid: parseFloat(form.totalFeesPaid) || 0,
        notes: form.notes.trim(),
        profilePhoto: form.profilePhoto,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Member added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.topBar, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Add Member</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickPhoto} style={[styles.photoPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {form.profilePhoto ? (
              <Image source={{ uri: form.profilePhoto }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={28} color={colors.mutedForeground} />
                <Text style={[styles.photoText, { color: colors.mutedForeground }]}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Personal Info</Text>
            <FormInput label="Full Name" placeholder="Member full name" value={form.fullName} onChangeText={(v) => update("fullName", v)} icon="account" error={errors.fullName} />
            <FormInput label="Email" placeholder="member@email.com" value={form.email} onChangeText={(v) => update("email", v)} keyboardType="email-address" autoCapitalize="none" icon="email" error={errors.email} />
            <FormInput label="Phone" placeholder="+1 555 000 0000" value={form.phone} onChangeText={(v) => update("phone", v)} keyboardType="phone-pad" icon="phone" error={errors.phone} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Membership</Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Package Type</Text>
            <View style={styles.packageGrid}>
              {PACKAGES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.packagePill,
                    { backgroundColor: form.packageType === p ? colors.primary : colors.input, borderColor: form.packageType === p ? colors.primary : colors.border },
                  ]}
                  onPress={() => update("packageType", p)}
                >
                  <Text style={[styles.packageText, { color: form.packageType === p ? "#fff" : colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Start Date</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={18} color={colors.mutedForeground} />
              <Text style={[styles.dateText, { color: colors.foreground }]}>
                {startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}

            <View style={[styles.endDateRow, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="calendar-check" size={18} color={colors.success} />
              <Text style={[styles.endDateLabel, { color: colors.mutedForeground }]}>Valid until: </Text>
              <Text style={[styles.endDateValue, { color: colors.success }]}>
                {endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </Text>
            </View>

            <FormInput label="Fees Paid" placeholder="0.00" value={form.totalFeesPaid} onChangeText={(v) => update("totalFeesPaid", v)} keyboardType="decimal-pad" icon="currency-usd" />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notes</Text>
            <FormInput label="Notes (optional)" placeholder="Any notes about this member..." value={form.notes} onChangeText={(v) => update("notes", v)} multiline numberOfLines={3} icon="note-text" />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Add Member</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  screenTitle: { fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  container: { flex: 1 },
  photoSection: { alignItems: "center", paddingVertical: 20 },
  photoPicker: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  photoPreview: { width: 90, height: 90, borderRadius: 45 },
  photoPlaceholder: { alignItems: "center", gap: 4 },
  photoText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  packageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  packagePill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  packageText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12 },
  dateText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  endDateRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  endDateLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  endDateValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
