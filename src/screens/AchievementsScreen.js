import { StyleSheet, Text, View } from "react-native";
import { Trophy } from "lucide-react-native";

const achievements = [
    { title: "Primer destino", detail: "Marca tu primer pais visitado." },
    { title: "10 paises", detail: "Visita 10 paises." },
    { title: "Explorador continental", detail: "Registra viajes en 3 continentes." }
];

export default function AchievementsScreen() {
    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Logros</Text>

            {achievements.map((achievement) => (
                <View key={achievement.title} style={styles.row}>
                    <Trophy color="#f5a623" size={24} strokeWidth={2.2} />
                    <View style={styles.textBlock}>
                        <Text style={styles.name}>{achievement.title}</Text>
                        <Text style={styles.detail}>{achievement.detail}</Text>
                    </View>
                </View>
            ))}
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
    title: {
        color: "#0b1f45",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 18
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 72,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingHorizontal: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0"
    },
    textBlock: {
        flex: 1
    },
    name: {
        color: "#0b1f45",
        fontSize: 16,
        fontWeight: "800"
    },
    detail: {
        color: "#6f7b8d",
        fontSize: 13,
        marginTop: 3
    }
});
