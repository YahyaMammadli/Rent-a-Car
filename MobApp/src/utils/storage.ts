import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// На iOS/Android токены лежат в Keychain/Keystore (SecureStore).
// В браузере SecureStore недоступен, поэтому там используется AsyncStorage (localStorage).
const native = Platform.OS !== "web";

export const secureStorage = {
    getItem: (key: string): Promise<string | null> =>
        native ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key),
    setItem: (key: string, value: string): Promise<void> =>
        native ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value),
    removeItem: (key: string): Promise<void> =>
        native ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key),
};
