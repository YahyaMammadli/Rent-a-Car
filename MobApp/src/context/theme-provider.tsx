import { ThemeContext } from "@/hooks/use-theme"
import { ThemeType } from "@/types/theme-types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"
import { useColorScheme as useSystemColorScheme } from "react-native"

const THEME_STORAGE_KEY = "app_theme"

interface ThemeProviderProps {
    children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
    const [appTheme, setAppTheme] = useState<ThemeType>("system")
    const systemColorScheme = useSystemColorScheme()

    // Выбранная тема переживает перезапуск приложения
    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY)
            .then((saved) => {
                if (saved === "light" || saved === "dark" || saved === "system") setAppTheme(saved)
            })
            .catch(() => {})
    }, [])

    const toggleTheme = (theme: ThemeType) => {
        setAppTheme(theme)
        AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(() => {})
    }
    const getColorScheme = (): "light" | "dark" => {
        if (appTheme === "light") return "light";
        if (appTheme === "dark") return "dark";
        // For "system" or "auto", use the system color scheme
        return systemColorScheme === "dark" ? "dark" : "light";
    };

    return (
        <ThemeContext.Provider value={{
            theme: appTheme,
            colorScheme: getColorScheme(),
            toggleTheme: toggleTheme,
        }}>
            {children}
        </ThemeContext.Provider>
    )

}
