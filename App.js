import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { preloadCountryStates, syncFromSupabase } from "./src/data/countryStore";
import { loadAchievementsFromSupabase } from "./src/data/achievements";
import AchievementToast from "./src/components/AchievementToast";

preloadCountryStates();

function Root() {
    const { session, isLoading } = useAuth();

    useEffect(() => {
        if (session) {
            syncFromSupabase()
                .then(() => loadAchievementsFromSupabase())
                .catch(() => {});
        }
    }, [session]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f8fc" }}>
                <ActivityIndicator size="large" color="#4da3ff" />
            </View>
        );
    }

    if (!session) {
        return <LoginScreen />;
    }

    return <AppNavigator />;
}

export default function App() {
    return (
        <AuthProvider>
            <Root />
            <AchievementToast />
        </AuthProvider>
    );
}
