import { EmptyView, ErrorView, LoadingView } from "@/components/shared/state-views";
import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { Booking } from "@/types/api.types";
import { ThemeType } from "@/types/theme-types";
import { apiFetch, apiJson, errorMessage, readError } from "@/utils/api-client";
import { formatIso, toIsoDate, todayUtc } from "@/utils/date";
import { confirmAction, showMessage } from "@/utils/dialog";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

export default function BookingsScreen() {
    const { colorScheme } = useTheme();
    const styles = getStyles(colorScheme);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const load = useCallback(async (pullToRefresh = false) => {
        if (pullToRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            setBookings(await apiJson<Booking[]>("/api/bookings/my"));
            setError(null);
        } catch (e) {
            setError(errorMessage(e, "Could not load bookings"));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const cancel = async (booking: Booking) => {
        if (!(await confirmAction("Cancel booking", `Cancel ${booking.carName}?`, "Cancel booking", true))) return;

        setCancellingId(booking.id);
        try {
            const res = await apiFetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
            if (!res.ok) throw await readError(res);
            const updated = (await res.json()) as Booking;
            setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        } catch (e) {
            showMessage("Could not cancel", errorMessage(e));
        } finally {
            setCancellingId(null);
        }
    };

    // сервер разрешает отмену только до даты начала (по UTC)
    const today = toIsoDate(todayUtc());

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={goBack} hitSlop={12}>
                    <Ionicons name="chevron-back" size={28} color={colorScheme === "dark" ? layout.colors.white : layout.colors.black} />
                </Pressable>
                <Text style={styles.title}>My Bookings</Text>
                <View style={styles.spacer} />
            </View>

            {loading ? (
                <LoadingView />
            ) : error ? (
                <ErrorView message={error} onRetry={() => load()} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(b) => b.id}
                    refreshing={refreshing}
                    onRefresh={() => load(true)}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<EmptyView text="You have no bookings yet" />}
                    renderItem={({ item }) => {
                        const cancelled = item.status === "Cancelled";
                        const canCancel = !cancelled && item.startDate > today;
                        return (
                            <View style={styles.card}>
                                <Image source={{ uri: item.carImage }} style={styles.image} contentFit="contain" />
                                <View style={styles.info}>
                                    <Text style={styles.carName} numberOfLines={1}>{item.carName}</Text>
                                    <Text style={styles.dates}>
                                        {formatIso(item.startDate)} — {formatIso(item.endDate)}
                                    </Text>
                                    <Text style={styles.dates}>
                                        {item.days} {item.days === 1 ? "day" : "days"} · ${item.totalPrice}
                                    </Text>
                                    <View style={styles.footer}>
                                        <Text style={[styles.status, cancelled ? styles.cancelled : styles.confirmed]}>
                                            {item.status}
                                        </Text>
                                        {canCancel && (
                                            <Pressable onPress={() => cancel(item)} disabled={cancellingId === item.id}>
                                                <Text style={styles.cancelButton}>
                                                    {cancellingId === item.id ? "Cancelling…" : "Cancel"}
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (theme: ThemeType) => {
    const text = theme === "dark" ? layout.colors.white : layout.colors.black;
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === "dark" ? layout.colors.black : layout.colors.white,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
        },
        spacer: { width: 28 },
        title: {
            fontFamily: layout.fonts.poppins.poppinsSemiBold,
            fontSize: 18,
            color: text,
        },
        list: { padding: 16, gap: 12, flexGrow: 1 },
        card: {
            flexDirection: "row",
            gap: 12,
            padding: 12,
            borderRadius: 16,
            backgroundColor: theme === "dark" ? layout.colors.cardBackgroundDark : layout.colors.cardBackgroundLight,
        },
        image: { width: 96, height: 72, alignSelf: "center" },
        info: { flex: 1, gap: 2 },
        carName: {
            fontFamily: layout.fonts.poppins.poppinsBold,
            fontSize: 15,
            color: layout.colors.black,
        },
        dates: {
            fontFamily: layout.fonts.poppins.poppinsRegular,
            fontSize: 12,
            color: "#444",
        },
        footer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 6,
        },
        status: { fontFamily: layout.fonts.poppins.poppinsSemiBold, fontSize: 12 },
        confirmed: { color: "#1E8E3E" },
        cancelled: { color: "#8A8A8A" },
        cancelButton: {
            fontFamily: layout.fonts.poppins.poppinsSemiBold,
            fontSize: 12,
            color: "#E5484D",
        },
    });
};
