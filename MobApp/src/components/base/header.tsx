import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
    title?: string;
    /** Показывать ли стрелку «назад». На экранах-вкладках её нет: переход только через табы. */
    showBack?: boolean;
    /** Свой обработчик «назад» (по умолчанию — вернуться по истории или на главную). */
    onBack?: () => void;
}

// На корневых вкладках истории нет, поэтому «назад» ведёт на главную
const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

export default function Header({ title, showBack = true, onBack }: HeaderProps) {
    const { top } = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: top + 16 }]}>
            <StatusBar style="light" />
            {showBack ? (
                <Pressable onPress={onBack ?? goBack} hitSlop={12}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
            ) : (
                <View style={styles.spacer} />
            )}
            <Text style={styles.title}>{title}</Text>
            <View style={styles.spacer} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#000",
        padding: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    spacer: {
        width: 24,
    },
});
