import FormInput from "@/components/screens/driver-details/form-input";
import {
    DriverDetailsSchema,
    driverDetailsSchema,
    PERSONAL_FIELDS,
} from "@/components/screens/driver-details/driver-details.schema";
import LicencePhotoPicker, { EXISTING_PHOTO } from "@/components/screens/driver-details/licence-photo-picker";
import StepProgress from "@/components/screens/driver-details/step-progress";
import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { DriverDetails } from "@/types/api.types";
import { apiFetch, appendImage, errorMessage, readError } from "@/utils/api-client";
import { expiryToIso, isoToExpiry } from "@/utils/date";
import { showMessage } from "@/utils/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 12345678 -> 12/34/5678
const formatExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function DriverDetailsScreen() {
    const { colorScheme } = useTheme();
    const isDark = colorScheme === "dark";
    const { top, bottom } = useSafeAreaInsets();
    const [step, setStep] = useState<0 | 1>(0);
    const [loading, setLoading] = useState(true);
    const [serverPhoto, setServerPhoto] = useState<{ path: string; version: string } | null>(null);

    const {
        control,
        handleSubmit,
        trigger,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<DriverDetailsSchema>({
        resolver: zodResolver(driverDetailsSchema),
        defaultValues: {
            fullName: "",
            phone: "",
            address: "",
            nationalId: "",
            licenceNumber: "",
            expiryDate: "",
            licencePhoto: "",
        },
    });

    // Подтягиваем уже сохранённые данные с сервера (404 = ещё не заполнялось)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await apiFetch("/api/driver-details/me");
                if (res.ok) {
                    const d = (await res.json()) as DriverDetails;
                    if (cancelled) return;
                    reset({
                        fullName: d.fullName,
                        phone: d.phone,
                        address: d.address,
                        nationalId: d.nationalId,
                        licenceNumber: d.licenceNumber,
                        expiryDate: isoToExpiry(d.licenceExpiry),
                        licencePhoto: EXISTING_PHOTO,
                    });
                    setServerPhoto({ path: d.licencePhotoUrl, version: d.updatedAtUtc });
                } else if (res.status !== 404) {
                    throw await readError(res);
                }
            } catch (e) {
                if (!cancelled) showMessage("Could not load your details", errorMessage(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [reset]);

    const leave = () => (router.canGoBack() ? router.back() : router.replace("/home"));

    const goBack = () => {
        if (step === 1) setStep(0);
        else leave();
    };

    const onNext = async () => {
        // валидируем только поля первого таба
        const valid = await trigger([...PERSONAL_FIELDS]);
        if (valid) setStep(1);
    };

    const onSubmit = async (data: DriverDetailsSchema) => {
        try {
            const form = new FormData();
            form.append("FullName", data.fullName.trim());
            form.append("Phone", data.phone.trim());
            form.append("Address", data.address.trim());
            form.append("NationalId", data.nationalId.trim());
            form.append("LicenceNumber", data.licenceNumber.trim());
            form.append("LicenceExpiry", expiryToIso(data.expiryDate));
            // фото отправляем только если выбрано новое; иначе на сервере остаётся прежнее
            if (data.licencePhoto !== EXISTING_PHOTO) {
                await appendImage(form, "LicencePhoto", data.licencePhoto);
            }

            const res = await apiFetch("/api/driver-details/me", { method: "PUT", body: form });
            if (!res.ok) throw await readError(res);

            showMessage("Saved", "Driver details saved", leave);
        } catch (e) {
            showMessage("Could not save", errorMessage(e));
        }
    };

    const textColor = isDark ? layout.colors.white : layout.colors.black;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <StatusBar style="light" />

            <View style={[styles.header, { paddingTop: top + 12 }]}>
                <Pressable onPress={goBack} hitSlop={12} style={styles.back}>
                    <Ionicons name="chevron-back" size={26} color={layout.colors.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Information</Text>
            </View>

            <View style={[styles.sheet, { backgroundColor: isDark ? "#111" : layout.colors.white }]}>
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={layout.colors.primary} />
                    </View>
                ) : (
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <StepProgress step={step} onPressFirst={() => setStep(0)} />

                    {step === 0 ? (
                        <>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Personal Data</Text>

                            <Controller
                                control={control}
                                name="fullName"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <FormInput
                                        isDark={isDark}
                                        placeholder="Full Name"
                                        autoComplete="name"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.fullName?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="phone"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <FormInput
                                        isDark={isDark}
                                        placeholder="Phone Number"
                                        keyboardType="phone-pad"
                                        autoComplete="tel"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.phone?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="address"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <FormInput
                                        isDark={isDark}
                                        placeholder="Address"
                                        autoComplete="street-address"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.address?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="nationalId"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <FormInput
                                        isDark={isDark}
                                        placeholder="National Identity Number"
                                        autoCapitalize="characters"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.nationalId?.message}
                                    />
                                )}
                            />
                        </>
                    ) : (
                        <>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Driving Licence</Text>

                            <Controller
                                control={control}
                                name="licenceNumber"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <FormInput
                                        isDark={isDark}
                                        placeholder="Licence Number"
                                        autoCapitalize="characters"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.licenceNumber?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="expiryDate"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <FormInput
                                        isDark={isDark}
                                        placeholder="Expiry Date (DD/MM/YYYY)"
                                        keyboardType="number-pad"
                                        maxLength={10}
                                        onChangeText={(text) => onChange(formatExpiry(text))}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.expiryDate?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="licencePhoto"
                                render={({ field: { onChange, value } }) => (
                                    <LicencePhotoPicker
                                        isDark={isDark}
                                        value={value}
                                        onChange={onChange}
                                        error={errors.licencePhoto?.message}
                                        serverPhoto={serverPhoto}
                                    />
                                )}
                            />
                        </>
                    )}
                </ScrollView>
                )}

                <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
                    <Pressable
                        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                        onPress={step === 0 ? onNext : handleSubmit(onSubmit)}
                        disabled={isSubmitting || loading}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={layout.colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>{step === 0 ? "Next" : "Save"}</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: layout.colors.black },
    header: {
        backgroundColor: layout.colors.black,
        paddingBottom: 28,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    back: { position: "absolute", left: 16, bottom: 28 },
    headerTitle: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 16,
        color: layout.colors.white,
    },
    sheet: {
        flex: 1,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: "hidden",
    },
    loader: { flex: 1, alignItems: "center", justifyContent: "center" },
    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
    sectionTitle: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 14,
        marginBottom: 16,
    },
    footer: { paddingHorizontal: 40, paddingTop: 8 },
    button: {
        height: 44,
        borderRadius: 22,
        backgroundColor: layout.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: { opacity: 0.8 },
    buttonText: {
        fontFamily: layout.fonts.poppins.poppinsSemiBold,
        fontSize: 14,
        color: layout.colors.white,
    },
});
