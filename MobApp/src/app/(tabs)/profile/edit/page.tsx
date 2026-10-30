import Avatar from "@/components/base/avatar";
import Header from "@/components/base/header";
import { layout } from "@/constant/layout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { ThemeType } from "@/types/theme-types";
import { appendImage, apiJson, AuthUser, apiFetch, errorMessage, readError } from "@/utils/api-client";
import { confirmAction, showMessage } from "@/utils/dialog";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// «Назад» с редактирования ведёт именно на профиль, а не на первую вкладку
const goToProfile = () => router.navigate("/profile/page");

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

export default function EditProfile() {
  const { colorScheme } = useTheme();
  const { user, updateUser } = useAuth();
  const styles = getStyles(colorScheme);

  const [name, setName] = useState(user?.name ?? "");
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    setLocalAvatar(asset.uri); // сразу показываем выбранное фото
    setUploading(true);
    try {
      const form = new FormData();
      await appendImage(form, "Avatar", asset.uri, asset.mimeType);

      const res = await apiFetch("/api/profile/avatar", { method: "PUT", body: form });
      if (!res.ok) throw await readError(res);

      updateUser((await res.json()) as AuthUser);
    } catch (e) {
      setLocalAvatar(null);
      showMessage("Could not upload photo", errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const getPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showMessage("Camera access needed", "Allow camera access in settings to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) await uploadAvatar(result.assets[0]);
  };

  const getGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) await uploadAvatar(result.assets[0]);
  };

  const pickImage = () => {
    // в браузере камеры и action sheet нет — сразу открываем выбор файла
    if (Platform.OS === "web") {
      getGallery();
      return;
    }

    Alert.alert("Upload Avatar", "Choose an option", [
      { text: "Take photo", onPress: getPhoto },
      { text: "Choose from gallery", onPress: getGallery },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  };

  const removeAvatar = async () => {
    if (!(await confirmAction("Remove photo", "Delete your profile photo?", "Remove", true))) return;

    setUploading(true);
    try {
      updateUser(await apiJson<AuthUser>("/api/profile/avatar", { method: "DELETE" }));
      setLocalAvatar(null);
    } catch (e) {
      showMessage("Error", errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== user?.name && !saving;

  const saveName = async () => {
    setSaving(true);
    try {
      const updated = await apiJson<AuthUser>("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      updateUser(updated);
      showMessage("Saved", "Your profile was updated", goToProfile);
    } catch (e) {
      showMessage("Could not save", errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const hasAvatar = !!(localAvatar || user?.avatarUrl);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Header title="Edit Profile" onBack={goToProfile} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrapper}>
            <Avatar path={user?.avatarUrl} localUri={localAvatar} name={user?.name} size={110} />

            {uploading && (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color={layout.colors.white} />
              </View>
            )}

            <Pressable style={styles.cameraButton} onPress={pickImage} disabled={uploading}>
              <Ionicons name="camera" size={24} color="black" />
            </Pressable>
          </View>

          {hasAvatar && (
            <Pressable onPress={removeAvatar} disabled={uploading}>
              <Text style={styles.removeText}>Remove photo</Text>
            </Pressable>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#B5B5B5"
              autoCapitalize="words"
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={saveName}
            disabled={!canSave}
          >
            {saving ? <ActivityIndicator color={layout.colors.black} /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: ThemeType) => {
  const text = theme === "dark" ? layout.colors.white : layout.colors.black;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === "dark" ? layout.colors.black : layout.colors.white,
    },
    flex: { flex: 1 },
    content: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 40,
      gap: 12,
    },
    avatarWrapper: {
      width: 110,
      height: 110,
    },
    avatarLoading: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 55,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "white",
      borderRadius: 50,
      padding: 4,
      borderWidth: 1,
      borderColor: layout.colors.primary,
    },
    removeText: {
      fontFamily: layout.fonts.poppins.poppinsMedium,
      fontSize: 13,
      color: "#E5484D",
    },
    field: {
      alignSelf: "stretch",
      gap: 6,
      marginTop: 12,
    },
    label: {
      fontFamily: layout.fonts.poppins.poppinsMedium,
      fontSize: 13,
      color: "#8A8A8A",
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: "#E3E3E3",
      borderRadius: 6,
      paddingHorizontal: 12,
      fontFamily: layout.fonts.poppins.poppinsRegular,
      fontSize: 15,
      color: text,
    },
    email: {
      fontFamily: layout.fonts.poppins.poppinsRegular,
      fontSize: 15,
      color: text,
      opacity: 0.7,
    },
    saveButton: {
      alignSelf: "stretch",
      height: 48,
      borderRadius: 24,
      marginTop: 24,
      backgroundColor: layout.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: { opacity: 0.4 },
    saveText: {
      fontFamily: layout.fonts.poppins.poppinsSemiBold,
      fontSize: 15,
      color: layout.colors.black,
    },
  });
};
