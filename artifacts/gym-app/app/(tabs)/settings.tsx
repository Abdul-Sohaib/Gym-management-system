import React, { useCallback, useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { FormInput } from "@/components/FormInput";

interface SettingsData {
  gymName: string;
  gymAddress?: string;
  gymPhone?: string;
  gymLogo?: string;
  emailUser?: string;
  adminFullName?: string;
  adminEmail?: string;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout, updateAdmin } = useAuth();

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [gymName, setGymName] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [gymPhone, setGymPhone] = useState("");
  const [gymLogo, setGymLogo] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.get<{ success: boolean; data: SettingsData }>("/settings");
      const s = data.data;
      setSettings(s);
      setGymName(s.gymName || "");
      setGymAddress(s.gymAddress || "");
      setGymPhone(s.gymPhone || "");
      setGymLogo(s.gymLogo || "");
      setAdminFullName(s.adminFullName || "");
      setEmailUser(s.emailUser || "");
    } catch {}
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setGymLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const saveGymProfile = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.put("/settings", { gymName, gymAddress, gymPhone, gymLogo, adminFullName });
      updateAdmin({ gymName, gymAddress, gymPhone, gymLogo, fullName: adminFullName } as any);
      Alert.alert("Saved", "Gym profile updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEmail = async () => {
    setSavingEmail(true);
    try {
      await api.put("/settings", { emailUser, emailPass: emailPass || undefined });
      Alert.alert("Saved", "Email settings updated");
      setEmailPass("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      await api.post("/settings/test-email", {});
      Alert.alert("Success", "Test email sent! Check your inbox.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/settings", { currentPassword, newPassword });
      Alert.alert("Success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
  );

  const SaveButton = ({ onPress, loading, label }: { onPress: () => void; loading: boolean; label: string }) => (
    <TouchableOpacity
      style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SectionHeader title="Gym Profile" />
          <FormInput label="Gym Name" value={gymName} onChangeText={setGymName} icon="dumbbell" />
          <FormInput label="Gym Address" value={gymAddress} onChangeText={setGymAddress} icon="map-marker" />
          <FormInput label="Gym Phone" value={gymPhone} onChangeText={setGymPhone} keyboardType="phone-pad" icon="phone" />

          <Text style={[styles.logoLabel, { color: colors.mutedForeground }]}>Gym Logo</Text>
          <TouchableOpacity
            style={[styles.logoPicker, { borderColor: colors.border, backgroundColor: colors.input }]}
            onPress={pickLogo}
          >
            {gymLogo ? (
              <Image source={{ uri: gymLogo }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={24} color={colors.mutedForeground} />
                <Text style={[styles.logoText, { color: colors.mutedForeground }]}>Tap to change</Text>
              </View>
            )}
          </TouchableOpacity>
          <SaveButton onPress={saveGymProfile} loading={saving} label="Save Gym Profile" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SectionHeader title="Admin Account" />
          <FormInput label="Full Name" value={adminFullName} onChangeText={setAdminFullName} icon="account" />
          {settings?.adminEmail && (
            <View style={[styles.emailRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="email" size={16} color={colors.mutedForeground} />
              <Text style={[styles.emailText, { color: colors.mutedForeground }]}>{settings.adminEmail}</Text>
            </View>
          )}
          <SaveButton onPress={saveGymProfile} loading={saving} label="Save Account" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SectionHeader title="Change Password" />
          <FormInput label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} isPassword icon="lock" />
          <FormInput label="New Password" value={newPassword} onChangeText={setNewPassword} isPassword icon="lock-plus" />
          <FormInput label="Confirm New Password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} isPassword icon="lock-check" />
          <SaveButton onPress={savePassword} loading={savingPassword} label="Change Password" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SectionHeader title="Email Configuration" />
          <FormInput label="Gmail Address" value={emailUser} onChangeText={setEmailUser} keyboardType="email-address" autoCapitalize="none" icon="gmail" placeholder="yourgym@gmail.com" />
          <FormInput label="App Password" value={emailPass} onChangeText={setEmailPass} isPassword icon="key" placeholder="16-char Gmail App Password" />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Use a Gmail App Password (not your regular password). Go to Google Account → Security → App Passwords.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[styles.testBtn, { borderColor: colors.primary, flex: 1 }]}
              onPress={testEmail}
              disabled={testingEmail}
            >
              {testingEmail ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={[styles.testBtnText, { color: colors.primary }]}>Send Test Email</Text>
              )}
            </TouchableOpacity>
            <SaveButton onPress={saveEmail} loading={savingEmail} label="Save" />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SectionHeader title="Danger Zone" />
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.danger }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 20, paddingHorizontal: 20 },
  section: { marginHorizontal: 20, borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  logoLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  logoPicker: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", height: 90, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoPreview: { width: 70, height: 70, borderRadius: 10 },
  logoPlaceholder: { alignItems: "center", gap: 4 },
  logoText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saveBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  emailText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 12 },
  testBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", borderWidth: 1, flex: 1 },
  testBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
