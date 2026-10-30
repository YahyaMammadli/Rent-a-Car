import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, View } from "react-native";

interface ThemeSwitchProps {
    showIcon?: boolean;
}

/** Тумблер светлой/тёмной темы. Включён = тёмная тема. */
export default function ThemeSwitch({ showIcon = true }: ThemeSwitchProps) {
    const { colorScheme, toggleTheme } = useTheme();
    const isDark = colorScheme === "dark";

    return (
        <View style={styles.row}>
            {showIcon && (
                <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={layout.colors.primary} />
            )}
            <Switch
                value={isDark}
                onValueChange={(value) => toggleTheme(value ? "dark" : "light")}
                trackColor={{ false: "#d1d5db", true: "#6a6a6a" }}
                thumbColor={isDark ? layout.colors.white : layout.colors.primary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
});
