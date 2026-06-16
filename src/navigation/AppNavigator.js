import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Globe2, List, Trophy, User } from "lucide-react-native";
import WorldGlobe from "../components/WorldGlobe";
import ListScreen from "../screens/ListScreen";
import AchievementsScreen from "../screens/AchievementsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CountryDetailScreen from "../screens/CountryDetailScreen";

const SCREEN_WIDTH = Dimensions.get("window").width;

const tabs = [
    { key: "Explorar", label: "Explorar", Icon: Globe2 },
    { key: "Lista", label: "Lista", Icon: List, Screen: ListScreen },
    { key: "Logros", label: "Logros", Icon: Trophy, Screen: AchievementsScreen },
    { key: "Perfil", label: "Perfil", Icon: User, Screen: ProfileScreen }
];

function NavigationHost() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState("Explorar");
    const [detailCountry, setDetailCountry] = useState(null);
    const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

    const ActiveScreen = useMemo(() => {
        return tabs.find((tab) => tab.key === activeTab)?.Screen || null;
    }, [activeTab]);

    const openDetail = useCallback((countryId) => {
        setDetailCountry(countryId);
        slideAnim.setValue(SCREEN_WIDTH);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start();
    }, [slideAnim]);

    const closeDetail = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_WIDTH,
            duration: 220,
            useNativeDriver: true,
        }).start(() => setDetailCountry(null));
    }, [slideAnim]);

    return (
        <View style={styles.root}>
            <WorldGlobe onOpenDetail={openDetail} />

            {ActiveScreen ? (
                <View style={styles.screenLayer}>
                    <ActiveScreen onOpenDetail={openDetail} />
                </View>
            ) : null}

            <View style={[styles.tabBar, { bottom: Math.max(insets.bottom, 18) }]}>
                {tabs.map(({ key, label, Icon }) => {
                    const active = key === activeTab;
                    const color = active ? "#0b1f45" : "#7a8496";

                    return (
                        <Pressable
                            key={key}
                            onPress={() => setActiveTab(key)}
                            style={styles.tabItem}
                        >
                            <Icon
                                color={color}
                                size={25}
                                strokeWidth={active ? 2.4 : 2}
                            />
                            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Pantalla de detalle — se desliza desde la derecha sobre todo lo demás */}
            {detailCountry !== null ? (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFillObject,
                        { transform: [{ translateX: slideAnim }], elevation: 50 },
                    ]}
                >
                    <CountryDetailScreen countryId={detailCountry} onClose={closeDetail} />
                </Animated.View>
            ) : null}
        </View>
    );
}

export default function AppNavigator() {
    return (
        <SafeAreaProvider>
            <NavigationHost />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1
    },
    screenLayer: {
        ...StyleSheet.absoluteFillObject
    },
    tabBar: {
        position: "absolute",
        left: 18,
        right: 18,
        height: 78,
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 12,
        borderRadius: 32,
        backgroundColor: "rgba(255,255,255,0.94)",
        shadowColor: "#08142a",
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12
    },
    tabItem: {
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        borderRadius: 24
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: "700"
    }
});
