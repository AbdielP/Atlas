import { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import countries from "../../assets/data/countries.json";
import { countryStates } from "../data/countryStore";

const filters = [
    { key: "visited", label: "Visitados" },
    { key: "wishlist", label: "Wishlist" },
    { key: "all", label: "Todos" }
];

function getCountryName(country) {
    return country?.name?.common || country?.name || country?.cca2 || "Pais";
}

function getCountryContinent(country) {
    if (Array.isArray(country.continents) && country.continents.length > 0) {
        return country.continents.join(", ");
    }

    return country.region || "Sin continente";
}

export default function ListScreen() {
    const [filter, setFilter] = useState("visited");
    const [query, setQuery] = useState("");
    const [snapshot, setSnapshot] = useState({});

    useEffect(() => {
        setSnapshot({ ...countryStates });
    }, []);

    const stats = useMemo(() => {
        const visited = Object.values(snapshot).filter((state) => state === "visited").length;
        const wishlist = Object.values(snapshot).filter((state) => state === "wishlist").length;
        const continents = new Set(
            countries
                .filter((country) => snapshot[country.cca2] === "visited")
                .flatMap((country) => country.continents || [])
        );

        return {
            visited,
            wishlist,
            worldPercent: Math.round((visited / countries.length) * 100),
            continents: continents.size
        };
    }, [snapshot]);

    const filteredCountries = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return countries
            .filter((country) => {
                const state = snapshot[country.cca2] || "none";

                if (filter !== "all" && state !== filter) return false;
                if (!normalizedQuery) return true;

                return getCountryName(country).toLowerCase().includes(normalizedQuery);
            })
            .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)));
    }, [filter, query, snapshot]);

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Lista</Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{stats.visited}</Text>
                    <Text style={styles.statLabel}>visitados</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{stats.worldPercent}%</Text>
                    <Text style={styles.statLabel}>del mundo</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{stats.continents}</Text>
                    <Text style={styles.statLabel}>continentes</Text>
                </View>
            </View>

            <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar pais"
                placeholderTextColor="#8a93a3"
                style={styles.search}
            />

            <View style={styles.filters}>
                {filters.map((item) => {
                    const active = item.key === filter;

                    return (
                        <Pressable
                            key={item.key}
                            onPress={() => setFilter(item.key)}
                            style={[styles.filterButton, active && styles.filterButtonActive]}
                        >
                            <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.cca2}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const state = snapshot[item.cca2] || "none";

                    return (
                        <View style={styles.countryRow}>
                            <View>
                                <Text style={styles.countryName}>{getCountryName(item)}</Text>
                                <Text style={styles.countryMeta}>{getCountryContinent(item)}</Text>
                            </View>
                            <Text style={[styles.badge, state === "visited" && styles.visitedBadge]}>
                                {state === "wishlist" ? "Wishlist" : state === "visited" ? "Visitado" : "Sin marcar"}
                            </Text>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <Text style={styles.empty}>Aun no hay paises en esta vista.</Text>
                }
            />
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
        fontWeight: "800"
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 18
    },
    stat: {
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0"
    },
    statValue: {
        color: "#0b1f45",
        fontSize: 24,
        fontWeight: "800"
    },
    statLabel: {
        color: "#667085",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 3
    },
    search: {
        height: 46,
        marginTop: 16,
        paddingHorizontal: 14,
        borderRadius: 8,
        color: "#0b1f45",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#dbe3ef",
        fontSize: 15
    },
    filters: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12
    },
    filterButton: {
        flex: 1,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#e9eef6"
    },
    filterButtonActive: {
        backgroundColor: "#0b1f45"
    },
    filterText: {
        color: "#5f6b7d",
        fontSize: 12,
        fontWeight: "800"
    },
    filterTextActive: {
        color: "#ffffff"
    },
    listContent: {
        paddingTop: 14,
        paddingBottom: 122,
        gap: 8
    },
    countryRow: {
        minHeight: 66,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0"
    },
    countryName: {
        color: "#0b1f45",
        fontSize: 16,
        fontWeight: "800"
    },
    countryMeta: {
        color: "#6f7b8d",
        fontSize: 12,
        marginTop: 3
    },
    badge: {
        color: "#6f7b8d",
        fontSize: 12,
        fontWeight: "800"
    },
    visitedBadge: {
        color: "#2368b2"
    },
    empty: {
        color: "#6f7b8d",
        marginTop: 28,
        textAlign: "center",
        fontWeight: "700"
    }
});
