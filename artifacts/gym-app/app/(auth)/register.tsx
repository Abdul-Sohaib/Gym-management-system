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
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { FormInput } from "@/components/FormInput";
import { API_BASE_URL_WITH_API_PREFIX } from "@/constants/env";

const API_BASE = API_BASE_URL_WITH_API_PREFIX;

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gymName: "",
    gymAddress: "",
    gymPhone: "",
    gymLogo: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      update("gymLogo", `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name required";
    if (!form.email.trim()) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Password required";
    else if (form.password.length < 6) errs.password = "At least 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.gymName.trim()) errs.gymName = "Gym name required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
          gymName: form.gymName.trim(),
          gymAddress: form.gymAddress.trim(),
          gymPhone: form.gymPhone.trim(),
          gymLogo: form.gymLogo,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");
      await login(data.data.accessToken, data.data.refreshToken, data.data.admin);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Create Your Gym Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Set up your gym CRM in minutes</Text>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Admin Details</Text>
          <FormInput label="Full Name" placeholder="Your full name" value={form.fullName} onChangeText={(v) => update("fullName", v)} icon="account" error={errors.fullName} />
          <FormInput label="Email Address" placeholder="admin@yourgym.com" value={form.email} onChangeText={(v) => update("email", v)} keyboardType="email-address" autoCapitalize="none" icon="email" error={errors.email} />
          <FormInput label="Password" placeholder="Create password" value={form.password} onChangeText={(v) => update("password", v)} isPassword icon="lock" error={errors.password} />
          <FormInput label="Confirm Password" placeholder="Repeat password" value={form.confirmPassword} onChangeText={(v) => update("confirmPassword", v)} isPassword icon="lock-check" error={errors.confirmPassword} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Gym Details</Text>
          <FormInput label="Gym Name" placeholder="Your gym name" value={form.gymName} onChangeText={(v) => update("gymName", v)} icon="dumbbell" error={errors.gymName} />
          <FormInput label="Gym Address" placeholder="Gym address (optional)" value={form.gymAddress} onChangeText={(v) => update("gymAddress", v)} icon="map-marker" />
          <FormInput label="Gym Phone" placeholder="+1 555 000 0000 (optional)" value={form.gymPhone} onChangeText={(v) => update("gymPhone", v)} keyboardType="phone-pad" icon="phone" />

          <Text style={[styles.logoLabel, { color: colors.mutedForeground }]}>Gym Logo (optional)</Text>
          <TouchableOpacity
            style={[styles.logoPicker, { borderColor: colors.border, backgroundColor: colors.input }]}
            onPress={pickLogo}
          >
            {form.gymLogo ? (
              <Image source={{ uri: form.gymLogo }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <MaterialCommunityIcons name="image-plus" size={28} color={colors.mutedForeground} />
                <Text style={[styles.logoPlaceholderText, { color: colors.mutedForeground }]}>Tap to add logo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 20, width: 40 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  section: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  logoLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  logoPicker: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", height: 100, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  logoPreview: { width: 80, height: 80, borderRadius: 10 },
  logoPlaceholder: { alignItems: "center", gap: 6 },
  logoPlaceholderText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  registerBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  registerBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
