import { layout } from "@/constant/layout";
import { Car } from "@/types/car.type";
import { ApiError, apiFetch, errorMessage, jsonBody, readError } from "@/utils/api-client";
import { addDays, formatDate, minStartDate, toIsoDate } from "@/utils/date";
import { confirmAction, showMessage } from "@/utils/dialog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_DAYS = 90;

interface BookingModalProps {
    car: Car;
    visible: boolean;
    onClose: () => void;
}

function Stepper({
    label,
    value,
    onMinus,
    onPlus,
    minusDisabled,
    plusDisabled,
}: {
    label: string;
    value: string;
    onMinus: () => void;
    onPlus: () => void;
    minusDisabled?: boolean;
    plusDisabled?: boolean;
}) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.stepper}>
                <Pressable
                    style={[styles.stepButton, minusDisabled && styles.disabled]}
                    onPress={onMinus}
                    disabled={minusDisabled}
                    hitSlop={8}
                >
                    <Ionicons name="remove" size={20} color={layout.colors.black} />
                </Pressable>
                <Text style={styles.value}>{value}</Text>
                <Pressable
                    style={[styles.stepButton, plusDisabled && styles.disabled]}
                    onPress={onPlus}
                    disabled={plusDisabled}
                    hitSlop={8}
                >
                    <Ionicons name="add" size={20} color={layout.colors.black} />
                </Pressable>
            </View>
        </View>
    );
}

export default function BookingModal({ car, visible, onClose }: BookingModalProps) {
    const { bottom } = useSafeAreaInsets();
    const [start, setStart] = useState(minStartDate);
    const [days, setDays] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // каждый раз открываем с актуальной минимальной датой
    useEffect(() => {
        if (visible) {
            setStart(minStartDate());
            setDays(1);
        }
    }, [visible]);

    const min = minStartDate();
    const end = addDays(start, days);

    const submit = async () => {
        setSubmitting(true);
        try {
            const res = await apiFetch(
                "/api/bookings",
                jsonBody({ carId: car.id, startDate: toIsoDate(start), endDate: toIsoDate(end) }),
            );
            if (!res.ok) throw await readError(res);

            onClose();
            showMessage(
                "Booked!",
                `${car.brand} ${car.model}\n${formatDate(start)} — ${formatDate(end)}\nTotal: $${car.pricePerDay * days}`,
            );
        } catch (e) {
            // сервер требует заполненные данные водителя перед бронированием
            if (e instanceof ApiError && e.hasField("DriverDetails")) {
                const goFill = await confirmAction(
                    "Driver details needed",
                    `${e.message}\n\nFill in your driver details now?`,
                    "Fill in",
                );
                if (goFill) {
                    onClose();
                    router.push("/driver-details/page");
                }
            } else {
                showMessage("Could not book", errorMessage(e));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={styles.flex} onPress={onClose} />
                <View style={[styles.sheet, { paddingBottom: bottom + 20 }]}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {car.brand} {car.model}
                        </Text>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <Ionicons name="close" size={24} color={layout.colors.white} />
                        </Pressable>
                    </View>

                    <Stepper
                        label="Start date"
                        value={formatDate(start)}
                        onMinus={() => setStart((s) => addDays(s, -1))}
                        onPlus={() => setStart((s) => addDays(s, 1))}
                        minusDisabled={toIsoDate(start) <= toIsoDate(min)}
                    />
                    <Stepper
                        label="Days"
                        value={String(days)}
                        onMinus={() => setDays((d) => Math.max(1, d - 1))}
                        onPlus={() => setDays((d) => Math.min(MAX_DAYS, d + 1))}
                        minusDisabled={days <= 1}
                        plusDisabled={days >= MAX_DAYS}
                    />

                    <Text style={styles.range}>
                        Return: {formatDate(end)}
                    </Text>

                    <View style={styles.footer}>
                        <View>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.total}>${car.pricePerDay * days}</Text>
                        </View>
                        <Pressable
                            style={[styles.confirm, submitting && styles.disabled]}
                            onPress={submit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={layout.colors.white} />
                            ) : (
                                <Text style={styles.confirmText}>Confirm booking</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: {
        backgroundColor: "#111",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 18,
    },
    titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
    title: {
        flexShrink: 1,
        fontFamily: layout.fonts.poppins.poppinsBold,
        fontSize: 20,
        color: layout.colors.white,
    },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    label: { fontFamily: layout.fonts.poppins.poppinsMedium, fontSize: 15, color: "#B5B5B5" },
    stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: layout.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    value: {
        minWidth: 110,
        textAlign: "center",
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 15,
        color: layout.colors.white,
    },
    range: { fontFamily: layout.fonts.poppins.poppinsRegular, fontSize: 13, color: "#B5B5B5" },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
    totalLabel: { fontFamily: layout.fonts.poppins.poppinsRegular, fontSize: 12, color: "#B5B5B5" },
    total: { fontFamily: layout.fonts.poppins.poppinsBold, fontSize: 22, color: layout.colors.white },
    confirm: {
        backgroundColor: layout.colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 28,
        minWidth: 170,
        alignItems: "center",
    },
    confirmText: { fontFamily: layout.fonts.poppins.poppinsSemiBold, fontSize: 15, color: layout.colors.white },
    disabled: { opacity: 0.4 },
});
