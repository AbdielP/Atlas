import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, FileText, Globe2, ImagePlus, Lock, Pencil, Plus, Trash2, Trophy, X } from "lucide-react-native";
import countries from "../../assets/data/countries.json";
import { countryStates } from "../data/countryStore";
import { catalog, isUnlocked, subscribeAchievements, unsubscribeAchievements } from "../data/achievements";
import { supabase } from "../lib/supabase";

const cca3ToCca2 = {};
countries.forEach((c) => { if (c.cca2 && c.cca3) cca3ToCca2[c.cca3] = c.cca2; });

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

function formatNoteDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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

function CountryNotes({ countryId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newText, setNewText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [saving, setSaving] = useState(false);
    const countryCode = cca3ToCca2[countryId];

    useEffect(() => {
        if (!countryCode) { setLoading(false); return; }
        let cancelled = false;
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) { setLoading(false); return; }
                const { data } = await supabase
                    .from("notes")
                    .select("id, body, created_at")
                    .eq("user_id", user.id)
                    .eq("country_code", countryCode)
                    .order("created_at", { ascending: false });
                if (!cancelled) setNotes(data || []);
            } catch (_) {}
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [countryCode]);

    async function handleCreate() {
        if (!newText.trim() || !countryCode) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("notes")
                .insert({ user_id: user.id, country_code: countryCode, body: newText.trim() })
                .select("id, body, created_at")
                .single();
            if (data) setNotes((prev) => [data, ...prev]);
        } catch (_) {}
        setNewText("");
        setCreating(false);
        setSaving(false);
    }

    async function handleUpdate(noteId) {
        if (!editText.trim()) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase
                .from("notes")
                .update({ body: editText.trim(), updated_at: new Date().toISOString() })
                .eq("id", noteId)
                .eq("user_id", user.id);
            setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, body: editText.trim() } : n));
        } catch (_) {}
        setEditingId(null);
        setSaving(false);
    }

    async function handleDelete(noteId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } catch (_) {}
    }

    if (loading) {
        return (
            <View style={styles.notesLoading}>
                <ActivityIndicator color="#94A3B8" size="small" />
            </View>
        );
    }

    return (
        <View style={styles.notesContainer}>
            {creating ? (
                <View style={styles.noteCard}>
                    <TextInput
                        value={newText}
                        onChangeText={setNewText}
                        placeholder="Escribe tu nota..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        style={styles.noteCardInput}
                        autoFocus
                    />
                    <View style={styles.noteCardActions}>
                        <Pressable onPress={() => { setCreating(false); setNewText(""); }} style={styles.noteActionBtn}>
                            <X color="#94A3B8" size={18} />
                            <Text style={styles.noteActionTextCancel}>Cancelar</Text>
                        </Pressable>
                        <Pressable onPress={handleCreate} style={[styles.noteActionBtn, styles.noteActionBtnSave]} disabled={saving}>
                            <Check color="#fff" size={18} />
                            <Text style={styles.noteActionTextSave}>{saving ? "Guardando..." : "Guardar"}</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <Pressable onPress={() => setCreating(true)} style={styles.newNoteBtn}>
                    <Plus color="#64748B" size={20} />
                    <Text style={styles.newNoteBtnText}>Nueva nota</Text>
                </Pressable>
            )}

            {notes.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                    {editingId === note.id ? (
                        <>
                            <TextInput
                                value={editText}
                                onChangeText={setEditText}
                                multiline
                                textAlignVertical="top"
                                style={styles.noteCardInput}
                                autoFocus
                            />
                            <View style={styles.noteCardActions}>
                                <Pressable onPress={() => setEditingId(null)} style={styles.noteActionBtn}>
                                    <X color="#94A3B8" size={18} />
                                    <Text style={styles.noteActionTextCancel}>Cancelar</Text>
                                </Pressable>
                                <Pressable onPress={() => handleUpdate(note.id)} style={[styles.noteActionBtn, styles.noteActionBtnSave]} disabled={saving}>
                                    <Check color="#fff" size={18} />
                                    <Text style={styles.noteActionTextSave}>{saving ? "Guardando..." : "Guardar"}</Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.noteCardBody}>{note.body}</Text>
                            <View style={styles.noteCardFooter}>
                                <Text style={styles.noteCardDate}>{formatNoteDate(note.created_at)}</Text>
                                <View style={styles.noteCardIcons}>
                                    <Pressable onPress={() => { setEditingId(note.id); setEditText(note.body); }} hitSlop={8}>
                                        <Pencil color="#94A3B8" size={16} />
                                    </Pressable>
                                    <Pressable onPress={() => handleDelete(note.id)} hitSlop={8}>
                                        <Trash2 color="#EF4444" size={16} />
                                    </Pressable>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            ))}

            {notes.length === 0 && !creating && (
                <Text style={styles.notesEmpty}>Sin notas aún</Text>
            )}
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
                    <CountryNotes countryId={countryId} />
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

    // Notas
    notesContainer: {
        paddingHorizontal: 22,
        paddingTop: 16,
        gap: 12,
    },
    notesLoading: {
        paddingTop: 48,
        alignItems: "center",
    },
    newNoteBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderStyle: "dashed",
    },
    newNoteBtnText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
    },
    noteCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 16,
    },
    noteCardInput: {
        minHeight: 120,
        fontSize: 15,
        color: "#0F172A",
        lineHeight: 22,
        textAlignVertical: "top",
    },
    noteCardBody: {
        fontSize: 15,
        color: "#0F172A",
        lineHeight: 22,
    },
    noteCardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    noteCardDate: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
    },
    noteCardIcons: {
        flexDirection: "row",
        gap: 16,
    },
    noteCardActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    noteActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    noteActionBtnSave: {
        backgroundColor: "#0F172A",
    },
    noteActionTextCancel: {
        color: "#94A3B8",
        fontSize: 13,
        fontWeight: "600",
    },
    noteActionTextSave: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
    },
    notesEmpty: {
        color: "#94A3B8",
        fontSize: 14,
        textAlign: "center",
        paddingTop: 32,
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
