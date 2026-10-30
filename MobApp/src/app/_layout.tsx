import AuthProvider from "@/context/auth-provider";
import ThemeProvider from "@/context/theme-provider";
import LayoutContent from "@/layout/layout";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
