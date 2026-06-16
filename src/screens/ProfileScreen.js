import { StyleSheet, Text, View } from "react-native";
import { HelpCircle, Settings, ShieldCheck, User } from "lucide-react-native";

const rows = [
    { label: "Estado Premium", value: "Free", Icon: ShieldCheck },
    { label: "Configuracion", value: "Preferencias", Icon: Settings },
    { label: "Ayuda", value: "Soporte", Icon: HelpCircle }
];

export default function ProfileScreen() {
    return (
        <View style={styles.screen}>
            <View style={styles.avatar}>
                <User color="#0b1f45" size={34} strokeWidth={2.2} />
            </View>
            <Text style={styles.title}>Perfil</Text>
            <Text style={styles.subtitle}>Atlas viajero</Text>

            <View style={styles.rows}>
                {rows.map(({ label, value, Icon }) => (
                    <View key={label} style={styles.row}>
                        <Icon color="#4da3ff" size={23} strokeWidth={2.2} />
                        <Text style={styles.label}>{label}</Text>
                        <Text style={styles.value}>{value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f5f8fc",
        paddingHorizontal: 20,
        paddingTop: 62
    },
    avatar: {
        width: 76,
        height: 76,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 38,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0"
    },
    title: {
        color: "#0b1f45",
        fontSize: 30,
        fontWeight: "800",
        marginTop: 16
    },
    subtitle: {
        color: "#6f7b8d",
        fontSize: 15,
        fontWeight: "700",
        marginTop: 4
    },
    rows: {
        marginTop: 24,
        gap: 10
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
        borderColor: "#e2e8f0"
    },
    label: {
        flex: 1,
        color: "#0b1f45",
        fontSize: 15,
        fontWeight: "800"
    },
    value: {
        color: "#6f7b8d",
        fontSize: 13,
        fontWeight: "700"
    }
});
