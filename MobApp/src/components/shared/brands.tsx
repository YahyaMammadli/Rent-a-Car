import { layout } from "@/constant/layout";
import { useBrands } from "@/hooks/use-brands";
import { CarBrand } from "@/types/car.type";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface BrandsProps {
    selectedSlug?: string;
    setSelectedSlug?: (slug: string) => void;
}

export default function Brands({ selectedSlug = "", setSelectedSlug }: BrandsProps) {
    const { brands, loading, error, reload } = useBrands();

    if (loading) {
        return (
            <View style={styles.placeholder}>
                <ActivityIndicator color={layout.colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <Pressable style={styles.placeholder} onPress={reload}>
                <Text style={styles.errorText}>Brands are not available. Tap to retry.</Text>
            </Pressable>
        );
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}>
            {brands.map((brand: CarBrand) => {
                const selected = brand.slug === selectedSlug;
                return (
                    <Pressable
                        key={brand.slug}
                        style={[styles.brand, selected && styles.brandSelected]}
                        // повторное нажатие снимает фильтр
                        onPress={() => setSelectedSlug?.(selected ? "" : brand.slug)}>
                        {brand.image ? (
                            <Image source={{ uri: brand.image }} style={styles.image} contentFit="contain" />
                        ) : (
                            <Text style={styles.brandName} numberOfLines={1}>{brand.name}</Text>
                        )}
                    </Pressable>
                );
            })}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    brand: {
        width: 80,
        height: 80,
        borderWidth: 2,
        borderColor: "transparent",
        borderRadius: 8,
        backgroundColor: "#fff",
        boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
    },
    brandSelected: {
        borderColor: layout.colors.primary,
    },
    image: {
        width: 60,
        height: 50,
    },
    brandName: {
        fontFamily: layout.fonts.poppins.poppinsMedium,
        fontSize: 12,
        color: layout.colors.black,
    },
    placeholder: {
        height: 88,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontFamily: layout.fonts.poppins.poppinsRegular,
        fontSize: 13,
        color: "#B5B5B5",
    },
})
