import { layout } from "@/constant/layout";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface FormInputProps extends TextInputProps {
    error?: string;
    isDark?: boolean;
}

export default function FormInput({ error, isDark, onBlur, ...props }: FormInputProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.field}>
            <TextInput
                {...props}
                placeholderTextColor="#B5B5B5"
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                style={[
                    styles.input,
                    { color: isDark ? layout.colors.white : layout.colors.black },
                    focused && styles.focused,
                    !!error && styles.error,
                ]}
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { marginBottom: 14 },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#E3E3E3",
        borderRadius: 6,
        paddingHorizontal: 12,
        fontFamily: layout.fonts.poppins.poppinsRegular,
        fontSize: 14,
    },
    focused: { borderColor: "#1E90FF", borderWidth: 2 },
    error: { borderColor: "#E5484D" },
    errorText: {
        marginTop: 4,
        fontFamily: layout.fonts.poppins.poppinsRegular,
        fontSize: 12,
        color: "#E5484D",
    },
});
