import Avatar from "@/components/base/avatar";
import Header from "@/components/base/header";
import Button from "@/components/screens/profile/ui/button";
import { layout } from "@/constant/layout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { ThemeType } from "@/types/theme-types";
import { confirmAction, showMessage } from "@/utils/dialog";
import { errorMessage } from "@/utils/api-client";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { colorScheme } = useTheme();
  const { user, signOut } = useAuth();
  const styles = getStyles(colorScheme);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    const confirmed = await confirmAction("Sign out", "Do you want to sign out of your account?", "Sign out", true);
    if (!confirmed) return;

    setSigningOut(true);
    try {
      // после выхода защищённые экраны закрываются, и приложение само открывает экран входа
      await signOut();
    } catch (e) {
      setSigningOut(false);
      showMessage("Error", errorMessage(e, "Could not sign out"));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Header title="Profile" showBack={false} />

      <View style={styles.userBlock}>
        <Avatar path={user?.avatarUrl} name={user?.name} size={96} />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={() => router.push("/profile/edit/page")}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </Button>

        <Button onPress={() => router.push("/driver-details/page")}>
          <Text style={styles.buttonText}>Driver License</Text>
        </Button>

        <Button onPress={() => router.push("/bookings/page")}>
          <Text style={styles.buttonText}>My Bookings</Text>
        </Button>

        <Button onPress={handleSignOut}>
          {signingOut ? (
            <ActivityIndicator color={layout.colors.primary} />
          ) : (
            <Text style={styles.buttonText}>Sign Out</Text>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === "dark" ? layout.colors.black : layout.colors.white,
  },
  userBlock: {
    alignItems: "center",
    marginTop: 24,
    gap: 4,
  },
  userName: {
    marginTop: 8,
    fontFamily: layout.fonts.poppins.poppinsSemiBold,
    fontSize: 20,
    color: theme === "dark" ? layout.colors.white : layout.colors.black,
  },
  userEmail: {
    fontFamily: layout.fonts.poppins.poppinsRegular,
    fontSize: 14,
    color: "#8A8A8A",
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: "center",
    color: theme === "dark" ? layout.colors.primary : layout.colors.black,
  },
});
