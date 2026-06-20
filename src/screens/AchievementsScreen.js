import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Lock, Trophy } from "lucide-react-native";
import {
    catalog,
    isUnlocked,
    subscribeAchievements,
    unsubscribeAchievements,
} from "../data/achievements";

function AchievementRow({ achievement }) {
    const done = isUnlocked(achievement.key);

    return (
        <View style={[styles.row, !done && styles.rowLocked]}>
            {done ? (
                <Trophy color="#f5a623" size={24} strokeWidth={2.2} />
            ) : (
                <Lock color="#cbd5e1" size={24} strokeWidth={2.2} />
            )}
            <View style={styles.textBlock}>
                <Text style={[styles.name, !done && styles.nameLocked]}>
                    {achievement.title}
                </Text>
                <Text style={styles.detail}>{achievement.detail}</Text>
            </View>
        </View>
    );
}

export default function AchievementsScreen() {
    const [, refresh] = useState(0);

    useEffect(() => {
        const update = () => refresh((n) => n + 1);
        subscribeAchievements(update);
        return () => unsubscribeAchievements(update);
    }, []);

    const unlockedList = catalog.filter((a) => isUnlocked(a.key));
    const lockedList = catalog.filter((a) => !isUnlocked(a.key));
    const sorted = [...unlockedList, ...lockedList];

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Logros</Text>
            <Text style={styles.counter}>
                {unlockedList.length} / {catalog.length}
            </Text>

            <FlatList
                data={sorted}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => <AchievementRow achievement={item} />}
            />
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
    title: {
        color: "#0b1f45",
        fontSize: 30,
        fontWeight: "800",
    },
    counter: {
        color: "#6f7b8d",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
        marginBottom: 18,
    },
    listContent: {
        paddingBottom: 122,
        gap: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 72,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    rowLocked: {
        opacity: 0.55,
    },
    textBlock: {
        flex: 1,
    },
    name: {
        color: "#0b1f45",
        fontSize: 16,
        fontWeight: "800",
    },
    nameLocked: {
        color: "#94a3b8",
    },
    detail: {
        color: "#6f7b8d",
        fontSize: 13,
        marginTop: 3,
    },
});
