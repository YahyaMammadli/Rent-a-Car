import BookingModal from "@/components/screens/car-details/booking-modal";
import { ErrorView, LoadingView } from "@/components/shared/state-views";
import FeatureTile from "@/components/shared/tile";
import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { Car } from "@/types/car.type";
import { ThemeType } from "@/types/theme-types";
import { apiJson, errorMessage } from "@/utils/api-client";
import { getCarSpecs } from "@/utils/car-specs";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";




const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

export default function CarDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colorScheme } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const themed = getThemedStyles(colorScheme);

    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingOpen, setBookingOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setCar(await apiJson<Car>(`/api/cars/${encodeURIComponent(id)}`));
            setError(null);
        } catch (e) {
            setError(errorMessage(e, "Car not found"));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading || !car) {
        return (
            <SafeAreaView style={themed.container}>
                <Pressable onPress={goBack} hitSlop={12} style={styles.backFloating}>
                    <Ionicons name="chevron-back" size={28} color={colorScheme === "dark" ? layout.colors.white : layout.colors.black} />
                </Pressable>
                {loading ? <LoadingView /> : <ErrorView message={error ?? "Car not found"} onRetry={load} />}
            </SafeAreaView>
        );
    }

    const specs = getCarSpecs(car);
    const iconColor = layout.colors.white;
    const available = (value: boolean) => (value ? "Available" : "—");

    return (
        <View style={themed.container}>
            <SafeAreaView edges={["top"]} style={styles.top}>
                <Pressable onPress={goBack} hitSlop={12} style={styles.back}>
                    <Ionicons name="chevron-back" size={28} color={colorScheme === "dark" ? layout.colors.white : layout.colors.black} />
                </Pressable>
                <Image source={{ uri: car.image }} style={styles.image} contentFit="contain" />
            </SafeAreaView>

            <View style={[styles.sheet, { paddingBottom: bottom + 16 }]}>
                <View style={styles.titleRow}>
                    <Text style={styles.name}>
                        {car.brand} {car.model}
                    </Text>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={20} color={layout.colors.primary} />
                        <Text style={styles.ratingText}>{specs.rating}</Text>
                    </View>
                </View>
                <Text style={styles.perDay}>${car.pricePerDay} per day</Text>

                <Text style={styles.featuresTitle}>Features</Text>
                <View style={styles.grid}>
                    <FeatureTile
                        icon={<Ionicons name="speedometer-outline" size={24} color={iconColor} />}
                        label="TOP SPEED"
                        value={`${specs.topSpeed} km/h`}
                    />
                    <FeatureTile
                        icon={<Ionicons name="wifi" size={24} color={iconColor} />}
                        label="WIFI"
                        value={available(specs.wifi)}
                    />
                    <FeatureTile
                        icon={<MaterialCommunityIcons name="car-seat" size={24} color={iconColor} />}
                        label="SEATS"
                        value={String(specs.seats)}
                    />
                    <FeatureTile
                        icon={<MaterialCommunityIcons name="access-point" size={24} color={iconColor} />}
                        label="SENSOR"
                        value={available(specs.sensor)}
                    />
                    <FeatureTile
                        icon={<Ionicons name="bluetooth" size={24} color={iconColor} />}
                        label="BLUETOOTH"
                        value={specs.bluetooth}
                    />
                    <FeatureTile
                        icon={<MaterialCommunityIcons name="car-door" size={24} color={iconColor} />}
                        label="DOORS"
                        value={String(specs.doors)}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.price}>${car.pricePerDay}</Text>
                    <Pressable
                        style={styles.bookButton}
                        onPress={() => setBookingOpen(true)}
                    >
                        <Text style={styles.bookText}>Book now</Text>
                    </Pressable>
                </View>
            </View>

            <BookingModal car={car} visible={bookingOpen} onClose={() => setBookingOpen(false)} />
        </View>
    );
}

const getThemedStyles = (theme: ThemeType) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === "dark" ? layout.colors.black : layout.colors.white,
        },
        notFoundText: {
            fontFamily: layout.fonts.poppins.poppinsSemiBold,
            fontSize: 18,
            color: theme === "dark" ? layout.colors.white : layout.colors.black,
        },
    });

const styles = StyleSheet.create({
    top: {
        flex: 1,
        paddingHorizontal: 16,
    },
    back: {
        alignSelf: "flex-start",
        paddingVertical: 8,
    },
    backFloating: {
        alignSelf: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    image: {
        flex: 1,
        width: "100%",
    },
    sheet: {
        backgroundColor: "#000",
        borderTopLeftRadius: 56,
        borderTopRightRadius: 56,
        paddingHorizontal: 18,
        paddingTop: 28,
        // чёрная плашка на тёмной теме отделяется тонкой границей
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: "#1A1C1E",
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    name: {
        flexShrink: 1,
        fontFamily: layout.fonts.poppins.poppinsBold,
        fontSize: 20,
        color: layout.colors.white,
    },
    rating: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ratingText: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 16,
        color: layout.colors.white,
    },
    perDay: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 15,
        color: "#B5B5B5",
        marginTop: 2,
    },
    featuresTitle: {
        fontFamily: layout.fonts.poppins.poppinsMedium,
        fontSize: 16,
        color: layout.colors.white,
        marginTop: 20,
        marginBottom: 10,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },

    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 24,
    },
    price: {
        fontFamily: layout.fonts.poppins.poppinsBold,
        fontSize: 22,
        color: layout.colors.white,
    },
    bookButton: {
        backgroundColor: layout.colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    bookText: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 16,
        color: layout.colors.white,
    },
    notFound: {
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    link: {
        fontFamily: layout.fonts.poppins.poppinsMedium,
        color: layout.colors.primary,
    },
});
