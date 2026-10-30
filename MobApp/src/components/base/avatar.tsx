import { layout } from "@/constant/layout";
import { useAuthImage } from "@/hooks/use-auth-image";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

interface AvatarProps {
    /** Путь аватара на API (user.avatarUrl). */
    path?: string | null;
    /** Локальный uri только что выбранного фото — показывается поверх серверного. */
    localUri?: string | null;
    name?: string;
    size?: number;
}

export default function Avatar({ path, localUri, name, size = 44 }: AvatarProps) {
    const remote = useAuthImage(localUri ? null : path);
    const uri = localUri ?? remote;
    const box = { width: size, height: size, borderRadius: size / 2 };

    if (uri) {
        return <Image source={{ uri }} style={[styles.image, box]} contentFit="cover" />;
    }

    return (
        <View style={[styles.placeholder, box]}>
            <Text style={[styles.letter, { fontSize: size * 0.42 }]}>
                {name?.trim().charAt(0).toUpperCase() || "?"}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        borderWidth: 2,
        borderColor: layout.colors.primary,
        backgroundColor: "#222",
    },
    placeholder: {
        backgroundColor: layout.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    letter: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        color: layout.colors.black,
    },
});
