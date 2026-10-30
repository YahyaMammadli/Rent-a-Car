export type ThemeType = "system" | "light" | "dark";

export type ThemeContextType = {
    theme: ThemeType, // current theme => "system" | "light" | "dark"
    colorScheme: "light" | "dark", // current color scheme => "light" | "dark"
    toggleTheme: (theme: ThemeType) => void, // function to toggle the theme
}