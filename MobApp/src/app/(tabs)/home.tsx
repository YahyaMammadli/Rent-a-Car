import Avatar from '@/components/base/avatar';
import ThemeSwitch from '@/components/base/theme-switch';
import Brands from '@/components/shared/brands';
import Models from '@/components/shared/models';
import { layout } from '@/constant/layout';
import { useAuth } from '@/hooks/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { ThemeType } from '@/types/theme-types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { colorScheme } = useTheme()
  const { user } = useAuth();
  const styles = getStyles(colorScheme)

  const [selectedSlug, setSelectedSlug] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  return (
    <View style={styles.contentContainer}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <View style={styles.topRow}>
          <Pressable style={styles.profile} onPress={() => router.navigate('/profile/page')}>
            <Avatar path={user?.avatarUrl} name={user?.name} size={46} />
            <View style={styles.profileText}>
              <Text style={styles.hello}>Welcome back</Text>
              <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
            </View>
          </Pressable>

          <ThemeSwitch />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="search" size={24} color="#B5B5B5" />
          <TextInput
            style={styles.input}
            placeholder="Search"
            placeholderTextColor="#B5B5B5"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color="#B5B5B5" />
            </Pressable>
          )}
        </View>

        <Text style={styles.brandsTitle}>Brands</Text>
        <Brands selectedSlug={selectedSlug} setSelectedSlug={setSelectedSlug} />
      </View>

      <View style={styles.modelsHeader}>
        <Text style={styles.modelsTitle}>Hot Deals</Text>
        <Pressable onPress={() => router.push('/(tabs)/models')}>
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.modelsContainer}>
        <Models selectedSlug={selectedSlug} search={debouncedSearch} />
      </View>
    </View>
  );
}

const getStyles = (theme: ThemeType) => StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: theme === "dark" ? layout.colors.black : layout.colors.white,
  },
  header: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  profileText: {
    flexShrink: 1,
  },
  hello: {
    fontFamily: layout.fonts.poppins.poppinsRegular,
    fontSize: 12,
    color: "#B5B5B5",
  },
  name: {
    fontFamily: layout.fonts.poppins.poppinsSemiBold,
    fontSize: 16,
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    color: "#000",
  },
  brandsTitle: {
    fontFamily: layout.fonts.poppins.poppinsSemiBold,
    fontSize: 20,
    color: "#fff",
    marginLeft: -2,
  },
  modelsContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modelsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  modelsTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    color: theme === "dark" ? layout.colors.white : layout.colors.black,
  },
  viewAllText: {
    fontFamily: layout.fonts.poppins.poppinsRegular,
    fontSize: 16,
    color: layout.colors.primary,
  },
});
