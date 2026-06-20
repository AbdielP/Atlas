import { Platform } from "react-native";
import { supabase } from "./supabase";

export async function signInWithGoogleNative() {
    const { GoogleSignin } = require("@react-native-google-signin/google-signin");

    GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) throw new Error("No se obtuvo ID token de Google");

    const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
    });
    if (error) throw error;
}

export async function signInWithIdToken(idToken) {
    const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
    });
    if (error) throw error;
}

export async function signOut() {
    await supabase.auth.signOut();
    if (Platform.OS !== "web") {
        try {
            const { GoogleSignin } = require("@react-native-google-signin/google-signin");
            await GoogleSignin.revokeAccess();
        } catch (_) {}
    }
}
