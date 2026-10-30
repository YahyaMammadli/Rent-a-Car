import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function LoadingView() {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={layout.colors.primary} />
        </View>
    );
}

interface ErrorViewProps {
    message: string;
    onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
    const { colorScheme } = useTheme();
    const color = colorScheme === "dark" ? layout.colors.white : layout.colors.black;

    return (
        <View style={styles.center}>
            <Text style={[styles.message, { color }]}>{message}</Text>
            <Pressable style={styles.button} onPress={onRetry}>
                <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
        </View>
    );
}

export function EmptyView({ text }: { text: string }) {
    const { colorScheme } = useTheme();
    return (
        <View style={styles.center}>
            <Text style={[styles.message, { color: colorScheme === "dark" ? "#B5B5B5" : "#6B6B6B" }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 16,
    },
    message: {
        fontFamily: layout.fonts.poppins.poppinsRegular,
        fontSize: 14,
        textAlign: "center",
    },
    button: {
        backgroundColor: layout.colors.primary,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    buttonText: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        color: layout.colors.black,
    },
});
