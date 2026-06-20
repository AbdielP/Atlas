import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Trophy } from "lucide-react-native";

let showToastFn = null;

export function triggerAchievementToast(title) {
    showToastFn?.(title);
}

export default function AchievementToast() {
    const [title, setTitle] = useState(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-40)).current;
    const queue = useRef([]);
    const showing = useRef(false);

    useEffect(() => {
        showToastFn = (t) => {
            queue.current.push(t);
            if (!showing.current) processQueue();
        };
        return () => { showToastFn = null; };
    }, []);

    function processQueue() {
        if (queue.current.length === 0) {
            showing.current = false;
            return;
        }
        showing.current = true;
        const next = queue.current.shift();
        setTitle(next);
        opacity.setValue(0);
        translateY.setValue(-40);

        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start(() => {
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -40, duration: 300, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => {
                    setTitle(null);
                    processQueue();
                });
            }, 3000);
        });
    }

    if (!title) return null;

    return (
        <Animated.View
            style={[styles.container, { opacity, transform: [{ translateY }] }]}
            pointerEvents="none"
        >
            <View style={styles.toast}>
                <View style={styles.iconCircle}>
                    <Trophy color="#f5a623" size={20} strokeWidth={2.4} />
                </View>
                <View style={styles.textBlock}>
                    <Text style={styles.label}>Logro desbloqueado</Text>
                    <Text style={styles.title}>{title}</Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 54,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: "center",
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#0b1f45",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(245, 166, 35, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    textBlock: {
        flex: 1,
    },
    label: {
        color: "#f5a623",
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    title: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        marginTop: 2,
    },
});
