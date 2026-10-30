import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "expo-router";

// Точка входа: сразу отправляем по состоянию сессии. Redirect заменяет этот экран в стеке,
// так что с главной некуда «свайпнуть назад».
export default function Index() {
  const { status } = useAuth();

  return <Redirect href={status === "signedIn" ? "/home" : "/auth/sign-in"} />;
}
