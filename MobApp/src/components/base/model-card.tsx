import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { Car } from "@/types/car.type";
import { ThemeType } from "@/types/theme-types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

interface ModelCardProps {
    model: Car;
}

export default function ModelCard({ model }: ModelCardProps) {
    const { colorScheme } = useTheme();
    const styles = getStyles(colorScheme);
    const [imageFailed, setImageFailed] = useState(false);

    const width = useWindowDimensions().width;

    const handleSelectModel = () => {
        router.push(`/car-details/${model.id}/page`)
    }

    return (
        <Pressable style={[styles.modelCard, { width: width - 32 }]} onPress={handleSelectModel}>
            <View style={styles.modelCardTitle}>
                <View style={styles.modelCardBrandName}>
                    <Text style={styles.modelCardBrand}>{model.brand}</Text>
                    <Text style={styles.modelCardModel}>{model.model}</Text>
                </View>
                <Text style={styles.modelPricePerDay}>${model.pricePerDay}</Text>
            </View>
            {imageFailed ? (
                <View style={styles.modelCardImage}>
                    <Ionicons name="car-sport-outline" size={64} color="#9A9A9A" />
                </View>
            ) : (
                <Image
                    source={{ uri: model.image }}
                    style={styles.modelCardImage}
                    contentFit="contain"
                    onError={() => setImageFailed(true)}
                />
            )}
        </Pressable>
    )
}

const getStyles = (theme: ThemeType) => StyleSheet.create({
    modelCard: {
        position: "relative",
        padding: 18,
        borderRadius: 16,
        backgroundColor: theme === "dark"
            ? layout.colors.cardBackgroundDark
            : layout.colors.cardBackgroundLight,
        minHeight: 200,
    },
    modelCardTitle: {
        position: "absolute",
        top: 10,
        left: 10,
        right: 10,
        zIndex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modelCardBrandName: {
        gap: 0,
    },
    modelCardBrand: {
        fontFamily: layout.fonts.poppins.poppinsBold,
        color: theme === "dark" ? layout.colors.black : layout.colors.black,
    },
    modelCardModel: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 12,
        color: layout.colors.black,
    },
    modelPricePerDay: {
        fontFamily: layout.fonts.poppins.poppinsBold,
        color: layout.colors.black,
    },
    modelCardImage: {
        width: "100%",
        height: 150,
        marginTop: 28,
        alignItems: "center",
        justifyContent: "center",
    },
});
