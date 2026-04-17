import { Platform } from "react-native";

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  const { getItemAsync } = await import("expo-secure-store");
  return getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  const { setItemAsync } = await import("expo-secure-store");
  await setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  const { deleteItemAsync } = await import("expo-secure-store");
  await deleteItemAsync(key);
}

export const secureStorage = { getItem, setItem, deleteItem };
