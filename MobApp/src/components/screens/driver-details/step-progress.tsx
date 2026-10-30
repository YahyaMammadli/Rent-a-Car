import { layout } from "@/constant/layout";
import { Pressable, StyleSheet, View } from "react-native";

interface StepProgressProps {
    step: 0 | 1;
    onPressFirst?: () => void;
}

const INACTIVE = "#C9C9C9";

export default function StepProgress({ step, onPressFirst }: StepProgressProps) {
    const secondActive = step === 1;

    return (
        <View style={styles.row}>
            <Pressable hitSlop={12} onPress={onPressFirst}>
                <View style={[styles.dot, { backgroundColor: layout.colors.primary }]} />
            </Pressable>
            <View
                style={[styles.line, { backgroundColor: secondActive ? layout.colors.primary : INACTIVE }]}
            />
            <View style={[styles.dot, { backgroundColor: secondActive ? layout.colors.primary : INACTIVE }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    line: { flex: 1, height: 2 },
});
