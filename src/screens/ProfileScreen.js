import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { HelpCircle, LogOut, Settings, ShieldCheck } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../lib/auth";
import { clearLocalCountryStates } from "../data/countryStore";

const menuRows = [
    { label: "Estado Premium", value: "Free", Icon: ShieldCheck },
    { label: "Configuración", value: "Preferencias", Icon: Settings },
    { label: "Ayuda", value: "Soporte", Icon: HelpCircle },
];

async function handleSignOut() {
    await clearLocalCountryStates();
    await signOut();
}

export default function ProfileScreen() {
    const { user } = useAuth();
    const name = user?.user_metadata?.full_name || "Usuario";
    const email = user?.email || "";
    const avatarUrl = user?.user_metadata?.avatar_url;

    return (
        <View style={styles.screen}>
            {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{name[0]}</Text>
                </View>
            )}
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.subtitle}>{email}</Text>

            <View style={styles.rows}>
                {menuRows.map(({ label, value, Icon }) => (
                    <View key={label} style={styles.row}>
                        <Icon color="#4da3ff" size={23} strokeWidth={2.2} />
                        <Text style={styles.label}>{label}</Text>
                        <Text style={styles.value}>{value}</Text>
                    </View>
                ))}

                <Pressable
                    onPress={handleSignOut}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                    <LogOut color="#dc2626" size={23} strokeWidth={2.2} />
                    <Text style={[styles.label, styles.signOutLabel]}>Cerrar sesión</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f5f8fc",
        paddingHorizontal: 20,
        paddingTop: 62,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    avatarFallback: {
        backgroundColor: "#0b1f45",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "800",
    },
    title: {
        color: "#0b1f45",
        fontSize: 30,
        fontWeight: "800",
        marginTop: 16,
    },
    subtitle: {
        color: "#6f7b8d",
        fontSize: 15,
        fontWeight: "700",
        marginTop: 4,
    },
    rows: {
        marginTop: 24,
        gap: 10,
    },
    row: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    rowPressed: {
        opacity: 0.6,
    },
    label: {
        flex: 1,
        color: "#0b1f45",
        fontSize: 15,
        fontWeight: "800",
    },
    value: {
        color: "#6f7b8d",
        fontSize: 13,
        fontWeight: "700",
    },
    signOutLabel: {
        color: "#dc2626",
    },
});
