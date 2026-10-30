import { Alert, Platform } from "react-native";

// Alert.alert в браузере (react-native-web) ничего не показывает, поэтому там используем window.*

export function showMessage(title: string, message?: string, onOk?: () => void) {
    if (Platform.OS === "web") {
        window.alert(message ? `${title}\n\n${message}` : title);
        onOk?.();
        return;
    }
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
}

export function confirmAction(
    title: string,
    message: string,
    confirmText = "OK",
    destructive = false,
): Promise<boolean> {
    if (Platform.OS === "web") return Promise.resolve(window.confirm(`${title}\n\n${message}`));

    return new Promise((resolve) => {
        Alert.alert(
            title,
            message,
            [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: confirmText, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
        );
    });
}
