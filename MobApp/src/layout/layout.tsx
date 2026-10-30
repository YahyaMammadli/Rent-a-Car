import { oswaldFont, poppinsFont } from "@/constant/fonts";
import { useAuth } from "@/hooks/use-auth";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function LayoutContent() {
  const [loaded, error] = useFonts({ ...poppinsFont, ...oswaldFont });
  const { status } = useAuth();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  if (error) {
    return <Text>Error loading fonts</Text>;
  }

  // Пока проверяем сохранённую сессию — показываем заставку (без навигации, поэтому
  // стек не накапливает экраны и свайп «назад» не ведёт на логин)
  if (status === "loading") {
    return (
      <View style={styles.splash}>
        <Image source={require("@/assets/images/rent-logo.png")} style={styles.logo} />
      </View>
    );
  }

  const isSignedIn = status === "signedIn";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      {/* Экраны входа доступны только гостю */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
      </Stack.Protected>

      {/* Остальное — только после входа. Свайп с главной не может вернуть на логин */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="car-details/[id]/page" />
        <Stack.Screen name="driver-details/page" />
        <Stack.Screen name="bookings/page" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#F9B401",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 300,
    height: 350,
  },
});
