import Header from "@/components/base/header";
import ThemeSwitch from "@/components/base/theme-switch";
import { layout } from "@/constant/layout";
import { useTheme } from "@/hooks/use-theme";
import { ThemeType } from "@/types/theme-types";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { colorScheme } = useTheme();
  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Header title="Settings" showBack={false} />
      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <Text style={styles.settingItemText}>Theme</Text>
          <ThemeSwitch showIcon={false} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === "dark" ? layout.colors.black : layout.colors.white,
  },
  settingsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingItemText: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: theme === "dark" ? layout.colors.white : layout.colors.black,
  }
});
