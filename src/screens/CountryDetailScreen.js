import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, FileText, Globe2, ImagePlus, Lock, Trophy } from "lucide-react-native";
import countries from "../../assets/data/countries.json";
import { countryStates } from "../data/countryStore";
import { catalog, isUnlocked, subscribeAchievements, unsubscribeAchievements } from "../data/achievements";

// Color accent por región del mundo
const REGION_COLOR = {
    Africa:    "#F59E0B",
    Americas:  "#EF4444",
    Asia:      "#8B5CF6",
    Europe:    "#3B82F6",
    Oceania:   "#10B981",
    Antarctic: "#0EA5E9",
};
const FALLBACK_COLOR = "#64748B";

const SUBREGION_LABELS = {
    "North America":             "América del Norte",
    "Central America":           "América Central",
    Caribbean:                   "Caribe",
    "South America":             "América del Sur",
    "Western Europe":            "Europa Occidental",
    "Eastern Europe":            "Europa Oriental",
    "Southern Europe":           "Europa del Sur",
    "Northern Europe":           "Europa del Norte",
    "Western Asia":              "Asia Occidental",
    "Eastern Asia":              "Asia Oriental",
    "South-Eastern Asia":        "Sudeste Asiático",
    "Southern Asia":             "Asia del Sur",
    "Central Asia":              "Asia Central",
    "Northern Africa":           "África del Norte",
    "Eastern Africa":            "África Oriental",
    "Middle Africa":             "África Central",
    "Southern Africa":           "África del Sur",
    "Western Africa":            "África Occidental",
    "Australia and New Zealand": "Australia y Nueva Zelanda",
    Melanesia:                   "Melanesia",
    Micronesia:                  "Micronesia",
    Polynesia:                   "Polinesia",
};

const TABS = [
    { key: "info",    label: "Información", Icon: Globe2    },
    { key: "photos",  label: "Fotos",       Icon: ImagePlus },
    { key: "logros",  label: "Logros",      Icon: Trophy    },
    { key: "notes",   label: "Notas",       Icon: FileText  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function findDetails(cca3) {
    if (!cca3) return null;
    return countries.find((c) => c.cca3 === cca3) ?? null;
}

function resolveName(cca3, details) {
    return (
        details?.translations?.spa?.common ||
        details?.name?.common ||
        cca3 ||
        "País"
    );
}

function resolveLocation(details) {
    if (details?.subregion) return SUBREGION_LABELS[details.subregion] || details.subregion;
    return details?.region ?? null;
}

function resolveCapital(details) {
    return details?.capital?.[0] ?? null;
}

function resolveLanguages(details) {
    const values = Object.values(details?.languages ?? {});
    return values.length ? values.slice(0, 2).join(", ") : null;
}

function resolveCurrencies(details) {
    const entries = Object.entries(details?.currencies ?? {});
    if (!entries.length) return null;
    return entries
        .slice(0, 2)
        .map(([code, { name }]) => `${name} (${code})`)
        .join("  ·  ");
}

function resolveArea(details) {
    if (!details?.area) return null;
    return `${details.area.toLocaleString("es-MX")} km²`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    if (status === "none") return null;
    const visited = status === "visited";
    return (
        <View style={[styles.badge, visited ? styles.badgeVisited : styles.badgeWishlist]}>
            <Text style={[styles.badgeText, visited ? styles.badgeTextVisited : styles.badgeTextWishlist]}>
                {visited ? "Visitado" : "Wishlist"}
            </Text>
        </View>
    );
}

function DataRow({ label, value }) {
    if (!value) return null;
    return (
        <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{label}</Text>
            <Text style={styles.dataValue}>{value}</Text>
        </View>
    );
}

function ComingSoonTab({ Icon, label }) {
    return (
        <View style={styles.comingSoon}>
            <Icon color="#E2E8F0" size={52} strokeWidth={1.4} />
            <Text style={styles.comingSoonTitle}>{label}</Text>
            <Text style={styles.comingSoonSub}>Próximamente</Text>
        </View>
    );
}

function CountryAchievements({ region }) {
    const [, refresh] = useState(0);

    useEffect(() => {
        const update = () => refresh((n) => n + 1);
        subscribeAchievements(update);
        return () => unsubscribeAchievements(update);
    }, []);

    const relevant = catalog.filter(
        (a) => a.region === null || a.region === region
    );

    return (
        <View style={styles.dataSection}>
            {relevant.map((a) => {
                const done = isUnlocked(a.key);
                return (
                    <View key={a.key} style={[styles.achievementRow, !done && styles.achievementLocked]}>
                        {done ? (
                            <Trophy color="#f5a623" size={22} strokeWidth={2.2} />
                        ) : (
                            <Lock color="#cbd5e1" size={22} strokeWidth={2.2} />
                        )}
                        <View style={styles.achievementText}>
                            <Text style={[styles.achievementName, !done && styles.achievementNameLocked]}>
                                {a.title}
                            </Text>
                            <Text style={styles.achievementDetail}>{a.detail}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function CountryDetailScreen({ countryId, onClose }) {
    const [activeTab, setActiveTab] = useState("info");

    const details  = findDetails(countryId);
    const name     = resolveName(countryId, details);
    const location = resolveLocation(details);
    const status   = countryStates[countryId] ?? "none";
    const accent   = REGION_COLOR[details?.region] ?? FALLBACK_COLOR;

    return (
        <View style={styles.root}>
            {/* Header — mismo color que el hero para dar continuidad visual */}
            <SafeAreaView edges={["top"]} style={{ backgroundColor: accent }}>
                <View style={styles.header}>
                    <Pressable onPress={onClose} hitSlop={16} style={styles.headerBtn}>
                        <ArrowLeft color="#fff" size={22} strokeWidth={2.2} />
                    </Pressable>
                    <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
                    {/* Spacer para centrar el título */}
                    <View style={styles.headerBtn} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero: continúa el color del header + emoji de bandera grande */}
                <View style={[styles.hero, { backgroundColor: accent }]}>
                    <Text style={styles.heroFlag}>{details?.flag ?? "🌍"}</Text>
                </View>

                {/* Nombre + ubicación + badge de estado */}
                <View style={styles.identity}>
                    <View style={styles.identityMeta}>
                        <Text style={styles.identityName}>{name}</Text>
                        {location ? (
                            <Text style={styles.identityLocation}>{location}</Text>
                        ) : null}
                    </View>
                    <StatusBadge status={status} />
                </View>

                {/* Tabs */}
                <View style={styles.tabBar}>
                    {TABS.map(({ key, label, Icon }) => {
                        const active = key === activeTab;
                        return (
                            <Pressable
                                key={key}
                                onPress={() => setActiveTab(key)}
                                style={[
                                    styles.tabItem,
                                    active && { borderBottomColor: accent },
                                ]}
                            >
                                <Icon
                                    color={active ? accent : "#94A3B8"}
                                    size={20}
                                    strokeWidth={active ? 2.4 : 1.8}
                                />
                                <Text style={[styles.tabLabel, active && { color: accent }]}>
                                    {label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Contenido del tab activo */}
                {activeTab === "info" && (
                    <View style={styles.dataSection}>
                        <DataRow label="Capital" value={resolveCapital(details)} />
                        <DataRow label="Idioma"  value={resolveLanguages(details)} />
                        <DataRow label="Moneda"  value={resolveCurrencies(details)} />
                        <DataRow label="Área"    value={resolveArea(details)} />
                    </View>
                )}

                {activeTab === "photos" && (
                    <ComingSoonTab Icon={ImagePlus} label="Álbum de fotos" />
                )}

                {activeTab === "logros" && (
                    <CountryAchievements region={details?.region} />
                )}

                {activeTab === "notes" && (
                    <ComingSoonTab Icon={FileText} label="Notas personales" />
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    headerBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 0.1,
    },

    // Hero
    hero: {
        height: 160,
        alignItems: "center",
        justifyContent: "center",
    },
    heroFlag: {
        fontSize: 76,
        lineHeight: 96,
    },

    // ScrollView
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 52,
    },

    // Identidad (nombre + badge)
    identity: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    identityMeta: {
        flex: 1,
    },
    identityName: {
        color: "#0F172A",
        fontSize: 26,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    identityLocation: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 3,
    },

    // Badge de estado
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
    },
    badgeVisited: {
        backgroundColor: "#ECFDF5",
        borderColor: "#6EE7B7",
    },
    badgeWishlist: {
        backgroundColor: "#FFFBEB",
        borderColor: "#FCD34D",
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "700",
    },
    badgeTextVisited: {
        color: "#065F46",
    },
    badgeTextWishlist: {
        color: "#92400E",
    },

    // Tabs
    tabBar: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 14,
        gap: 5,
        borderBottomWidth: 2.5,
        borderBottomColor: "transparent",
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#94A3B8",
        letterSpacing: 0.3,
    },

    // Datos (tab Información)
    dataSection: {
        paddingHorizontal: 22,
        paddingTop: 6,
    },
    dataRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#F8FAFC",
        gap: 16,
    },
    dataLabel: {
        color: "#94A3B8",
        fontSize: 14,
        fontWeight: "600",
        minWidth: 64,
    },
    dataValue: {
        flex: 1,
        color: "#0F172A",
        fontSize: 15,
        fontWeight: "700",
        textAlign: "right",
    },

    // Placeholder tabs
    comingSoon: {
        paddingTop: 72,
        alignItems: "center",
        gap: 12,
    },
    comingSoonTitle: {
        color: "#94A3B8",
        fontSize: 17,
        fontWeight: "700",
    },
    comingSoonSub: {
        color: "#CBD5E1",
        fontSize: 14,
        fontWeight: "600",
    },

    // Logros
    achievementRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F8FAFC",
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementText: {
        flex: 1,
    },
    achievementName: {
        color: "#0F172A",
        fontSize: 15,
        fontWeight: "700",
    },
    achievementNameLocked: {
        color: "#94A3B8",
    },
    achievementDetail: {
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 2,
    },
});
