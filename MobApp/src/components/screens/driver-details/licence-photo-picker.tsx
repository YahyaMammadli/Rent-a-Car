import { layout } from "@/constant/layout";
import { useAuthImage } from "@/hooks/use-auth-image";
import { showMessage } from "@/utils/dialog";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

/** Значение поля, когда фото уже лежит на сервере и новое не выбрано. */
export const EXISTING_PHOTO = "existing";

interface LicencePhotoPickerProps {
    value?: string;
    onChange: (uri: string) => void;
    error?: string;
    isDark?: boolean;
    /** Путь к сохранённому на сервере фото и его версия (updatedAtUtc). */
    serverPhoto?: { path: string; version: string } | null;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
};

export default function LicencePhotoPicker({ value, onChange, error, isDark, serverPhoto }: LicencePhotoPickerProps) {
    const remoteUri = useAuthImage(
        value === EXISTING_PHOTO ? serverPhoto?.path : null,
        serverPhoto?.version,
    );
    const shownUri = value === EXISTING_PHOTO ? remoteUri : value;

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            if (Platform.OS === "web") {
                showMessage("Camera access needed", "Allow camera access in the browser to take a photo.");
                return;
            }
            Alert.alert("Camera access needed", "Allow camera access in settings to take a photo.", [
                { text: "Cancel", style: "cancel" },
                { text: "Open settings", onPress: () => Linking.openSettings() },
            ]);
            return;
        }
        const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
        if (!result.canceled) onChange(result.assets[0].uri);
    };

    const pickFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
        if (!result.canceled) onChange(result.assets[0].uri);
    };

    const openPicker = () => {
        // в браузере нет action sheet и камеры — сразу выбор файла
        if (Platform.OS === "web") {
            pickFromGallery();
            return;
        }
        Alert.alert("Upload licence photo", "Choose an option", [
            { text: "Take photo", onPress: takePhoto },
            { text: "Choose from gallery", onPress: pickFromGallery },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: isDark ? layout.colors.white : layout.colors.black }]}>
                Upload Your Licence Photo
            </Text>

            <Pressable
                onPress={openPicker}
                style={[styles.box, !!error && styles.boxError, !!value && styles.boxFilled]}
            >
                {value ? (
                    <>
                        {shownUri && <Image source={{ uri: shownUri }} style={styles.image} contentFit="cover" />}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color={layout.colors.black} />
                        </View>
                    </>
                ) : (
                    <Ionicons name="camera-outline" size={56} color="#C4C4C4" />
                )}
            </Pressable>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: "center", marginTop: 32 },
    title: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 14,
        marginBottom: 24,
    },
    box: {
        width: 120,
        height: 90,
        borderRadius: 6,
        backgroundColor: "#F1F1F1",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    boxFilled: { width: 240, height: 180 },
    boxError: { borderWidth: 1, borderColor: "#E5484D" },
    image: { width: "100%", height: "100%" },
    editBadge: {
        position: "absolute",
        right: 8,
        bottom: 8,
        backgroundColor: layout.colors.white,
        borderRadius: 14,
        padding: 6,
        borderWidth: 1,
        borderColor: layout.colors.primary,
    },
    errorText: {
        marginTop: 8,
        fontFamily: layout.fonts.poppins.poppinsRegular,
        fontSize: 12,
        color: "#E5484D",
    },
});
