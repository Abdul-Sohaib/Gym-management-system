import React, { useState } from "react";
import {
  Alert,
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
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { FormInput } from "@/components/FormInput";
import { API_BASE_URL_WITH_API_PREFIX } from "@/constants/env";

const API_BASE = API_BASE_URL_WITH_API_PREFIX;

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      await login(data.data.accessToken, data.data.refreshToken, data.data.admin);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoRegister = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/admin-exists`);
      const data = await response.json();
      if (data.data?.exists) {
        Alert.alert("Admin Exists", "An admin account already exists. Please login.");
        return;
      }
    } catch {}
    router.push("/(auth)/register");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: colors.primary + "20" }]}>
            <MaterialCommunityIcons name="dumbbell" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Gym CRM</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to your gym dashboard</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <FormInput
            label="Email Address"
            placeholder="admin@yourgym.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
            error={errors.email}
          />
          <FormInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock"
            error={errors.password}
          />

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.8 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleGoRegister} style={styles.registerLink}>
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
            New gym?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Create Account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  iconBg: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 6 },
  card: { borderRadius: 20, padding: 22, borderWidth: 1, marginBottom: 20 },
  loginBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  registerLink: { alignItems: "center", paddingVertical: 12 },
  registerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
