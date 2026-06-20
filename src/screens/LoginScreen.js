import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Globe2 } from "lucide-react-native";
import { signInWithGoogleNative, signInWithIdToken } from "../lib/auth";

let useIdTokenAuthRequest = null;
let WebBrowser = null;

if (Platform.OS === "web") {
    WebBrowser = require("expo-web-browser");
    WebBrowser.maybeCompleteAuthSession();
    useIdTokenAuthRequest = require("expo-auth-session/providers/google").useIdTokenAuthRequest;
}

function WebLogin({ onError }) {
    const [loading, setLoading] = useState(false);

    const [request, response, promptAsync] = useIdTokenAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    useEffect(() => {
        if (!response) return;
        if (response.type === "success") {
            setLoading(true);
            signInWithIdToken(response.params.id_token)
                .catch((e) => onError(e.message))
                .finally(() => setLoading(false));
        } else if (response.type === "error") {
            onError(response.error?.message || "Error al iniciar sesión");
        }
    }, [response]);

    return (
        <Pressable
            onPress={() => promptAsync()}
            disabled={!request || loading}
            style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                (!request || loading) && styles.buttonDisabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
            ) : (
                <Text style={styles.buttonText}>Continuar con Google</Text>
            )}
        </Pressable>
    );
}

function NativeLogin({ onError }) {
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        setLoading(true);
        try {
            await signInWithGoogleNative();
        } catch (e) {
            onError(e.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
            ) : (
                <Text style={styles.buttonText}>Continuar con Google</Text>
            )}
        </Pressable>
    );
}

export default function LoginScreen() {
    const [error, setError] = useState(null);

    return (
        <View style={styles.screen}>
            <View style={styles.hero}>
                <View style={styles.iconCircle}>
                    <Globe2 color="#4da3ff" size={52} strokeWidth={1.6} />
                </View>
                <Text style={styles.title}>Atlas</Text>
                <Text style={styles.subtitle}>Tu mundo, tus viajes</Text>
            </View>

            <View style={styles.bottom}>
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {Platform.OS === "web" ? (
                    <WebLogin onError={setError} />
                ) : (
                    <NativeLogin onError={setError} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f5f8fc",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    hero: {
        alignItems: "center",
        marginBottom: 64,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 20,
    },
    title: {
        color: "#0b1f45",
        fontSize: 38,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    subtitle: {
        color: "#6f7b8d",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 6,
    },
    bottom: {
        gap: 16,
    },
    error: {
        color: "#dc2626",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    button: {
        height: 56,
        borderRadius: 14,
        backgroundColor: "#0b1f45",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonPressed: {
        opacity: 0.85,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },
});
