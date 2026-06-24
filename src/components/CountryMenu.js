import { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, Circle, ImagePlus, MapPin, X } from "lucide-react-native";
import countries from "../../assets/data/countries.json";
import { countryStates } from "../data/countryStore";
import { supabase } from "../lib/supabase";

const MAX_FREE_PHOTOS = 5;

const continentLabels = {
    Africa: "Africa",
    Americas: "America",
    Antarctica: "Antartida",
    Asia: "Asia",
    Europe: "Europa",
    Oceania: "Oceania"
};

const subregionLabels = {
    "North America": "America del Norte",
    "Central America": "America Central",
    Caribbean: "Caribe",
    "South America": "America del Sur",
    "Western Europe": "Europa Occidental",
    "Eastern Europe": "Europa Oriental",
    "Southern Europe": "Europa del Sur",
    "Northern Europe": "Europa del Norte",
    "Western Asia": "Asia Occidental",
    "Eastern Asia": "Asia Oriental",
    "South-Eastern Asia": "Sudeste Asiatico",
    "Southern Asia": "Asia del Sur",
    "Central Asia": "Asia Central",
    "Northern Africa": "Africa del Norte",
    "Eastern Africa": "Africa Oriental",
    "Middle Africa": "Africa Central",
    "Southern Africa": "Africa del Sur",
    "Western Africa": "Africa Occidental",
    "Australia and New Zealand": "Australia y Nueva Zelanda",
    Melanesia: "Melanesia",
    Micronesia: "Micronesia",
    Polynesia: "Polinesia"
};

function getCountryDetails(country) {
    if (!country?.id) return null;

    return countries.find((item) => item.cca3 === country.id) || null;
}

function getCountryName(country, details) {
    return (
        details?.translations?.spa?.common ||
        details?.name?.common ||
        country?.name ||
        "Pais"
    );
}

function getContinent(details) {
    if (details?.subregion) {
        return subregionLabels[details.subregion] || details.subregion;
    }

    if (details?.region) {
        return continentLabels[details.region] || details.region;
    }

    return "Region sin definir";
}

function getCapital(details) {
    return details?.capital?.[0] || "Sin capital registrada";
}

function getLanguage(details) {
    const values = Object.values(details?.languages || {});

    if (values.length === 0) return "Sin idioma registrado";

    return values.slice(0, 2).join(", ");
}

function StatusBadge({ status }) {
    const isVisited = status === "visited";
    const label = isVisited ? "Visitado" : "Wishlist";

    return (
        <View style={[styles.badge, isVisited ? styles.visitedBadge : styles.wishlistBadge]}>
            <Text style={[styles.badgeText, isVisited ? styles.visitedBadgeText : styles.wishlistBadgeText]}>
                {label}
            </Text>
        </View>
    );
}

function StateOption({ active, label, onPress, variant }) {
    const color = active ? "#0b1f45" : "#667085";
    const Icon = active ? CheckCircle2 : Circle;

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.stateOption,
                active && styles.stateOptionActive,
                variant === "compact" && styles.compactStateOption
            ]}
        >
            <Icon color={active ? "#2368b2" : "#98a2b3"} size={21} strokeWidth={2.4} />
            <Text style={[styles.stateOptionText, { color }]}>{label}</Text>
        </Pressable>
    );
}

function CompactAction({ label, onPress, type }) {
    const isVisited = type === "visited";
    const Icon = isVisited ? CheckCircle2 : Circle;

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.compactAction,
                isVisited ? styles.compactVisitedAction : styles.compactWishlistAction
            ]}
        >
            <Icon
                color={isVisited ? "#2368b2" : "#8a6200"}
                size={20}
                strokeWidth={2.4}
            />
            <Text
                style={[
                    styles.compactActionText,
                    { color: isVisited ? "#0b1f45" : "#5f4300" }
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function PhotoPreview({ countryCode, onCountChange }) {
    const [photos, setPhotos] = useState([]);

    useEffect(() => {
        if (!countryCode) return;
        let cancelled = false;
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) return;
                const { data } = await supabase
                    .from("photos")
                    .select("id, storage_path")
                    .eq("user_id", user.id)
                    .eq("country_code", countryCode)
                    .order("created_at", { ascending: false })
                    .limit(4);
                if (!cancelled) {
                    setPhotos(data || []);
                    onCountChange?.(data?.length || 0);
                }
            } catch (_) {}
        })();
        return () => { cancelled = true; };
    }, [countryCode]);

    function getPublicUrl(path) {
        const { data } = supabase.storage.from("photos").getPublicUrl(path);
        return data?.publicUrl;
    }

    const emptySlots = Math.max(0, 4 - photos.length);

    return (
        <View style={styles.photoRow}>
            {photos.map((p) => (
                <Image key={p.id} source={{ uri: getPublicUrl(p.storage_path) }} style={styles.photoSlot} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
                <View key={`empty-${i}`} style={[styles.photoSlot, styles.photoSlotEmpty]} />
            ))}
        </View>
    );
}

export default function CountryMenu({
    visible,
    country,
    onVisited,
    onWishlist,
    onClear,
    onClose,
    onViewDetail,
}) {
    const details = getCountryDetails(country);
    const name = getCountryName(country, details);
    const status = countryStates[country?.id] || "none";
    const hasStatus = status === "visited" || status === "wishlist";
    const countryCode = details?.cca2 || null;
    const [photoCount, setPhotoCount] = useState(0);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.sheet, !hasStatus && styles.compactSheet]}
                    onPress={(event) => event.stopPropagation()}
                >
                    {hasStatus ? <View style={styles.handle} /> : null}

                    {hasStatus ? (
                        <ScrollView
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.richContent}
                        >
                            <View style={styles.header}>
                                <View style={styles.flagWrap}>
                                    <Text style={styles.flag}>{details?.flag || "?"}</Text>
                                </View>

                                <View style={styles.headerText}>
                                    <Text style={styles.title}>{name}</Text>
                                    <Text style={styles.subtitle}>{getContinent(details)}</Text>
                                </View>

                                <StatusBadge status={status} />
                            </View>

                            <View style={styles.infoGrid}>
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>Capital</Text>
                                    <Text style={styles.infoValue}>{getCapital(details)}</Text>
                                </View>
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>Idioma</Text>
                                    <Text style={styles.infoValue}>{getLanguage(details)}</Text>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Tu estado</Text>
                                <View style={styles.stateRow}>
                                    <StateOption
                                        active={status === "visited"}
                                        label="Visitado"
                                        onPress={onVisited}
                                    />
                                    <StateOption
                                        active={status === "wishlist"}
                                        label="Wishlist"
                                        onPress={onWishlist}
                                    />
                                    <StateOption
                                        active={status === "none"}
                                        label="Sin marcar"
                                        onPress={onClear}
                                    />
                                </View>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.photoHeader}>
                                    <Text style={styles.sectionTitle}>Album de fotos</Text>
                                    <Text style={styles.photoCount}>{photoCount}/{MAX_FREE_PHOTOS}</Text>
                                </View>
                                <PhotoPreview countryCode={countryCode} onCountChange={setPhotoCount} />
                            </View>

                            <Pressable style={styles.detailsButton} onPress={onViewDetail}>
                                <MapPin color="#2368b2" size={20} strokeWidth={2.2} />
                                <Text style={styles.detailsButtonText}>
                                    Ver informacion completa
                                </Text>
                            </Pressable>
                        </ScrollView>
                    ) : (
                        <View style={styles.compactContent}>
                            <View style={styles.compactHeader}>
                                <View style={styles.flagWrapSmall}>
                                    <Text style={styles.flagSmall}>{details?.flag || "?"}</Text>
                                </View>
                                <View style={styles.headerText}>
                                    <Text style={styles.title}>{name}</Text>
                                    <Text style={styles.subtitle}>{getContinent(details)}</Text>
                                </View>
                            </View>

                            <Text style={styles.prompt}>Marcar pais como</Text>

                            <View style={styles.compactOptions}>
                                <CompactAction
                                    label="Visitado"
                                    onPress={onVisited}
                                    type="visited"
                                />
                                <CompactAction
                                    label="Wishlist"
                                    onPress={onWishlist}
                                    type="wishlist"
                                />
                                <Pressable style={styles.clearAction} onPress={onClose}>
                                    <X color="#98a2b3" size={20} strokeWidth={2.2} />
                                    <Text style={styles.clearActionText}>Cancelar</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "transparent"
    },
    sheet: {
        maxHeight: "88%",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        backgroundColor: "#fbfaf6",
        paddingTop: 12,
        shadowColor: "#08142a",
        shadowOpacity: 0.18,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: -8 },
        elevation: 18
    },
    compactSheet: {
        maxHeight: "60%",
        paddingTop: 10
    },
    handle: {
        alignSelf: "center",
        width: 58,
        height: 5,
        borderRadius: 999,
        backgroundColor: "#c8c8c2",
        marginBottom: 12
    },
    richContent: {
        paddingHorizontal: 22,
        paddingBottom: 28
    },
    compactContent: {
        paddingHorizontal: 18,
        paddingBottom: 14
    },
    header: {
        minHeight: 70,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e2da"
    },
    compactHeader: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    flagWrap: {
        width: 54,
        height: 54,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#ece8df"
    },
    flagWrapSmall: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#ece8df"
    },
    flag: {
        fontSize: 32
    },
    flagSmall: {
        fontSize: 28
    },
    headerText: {
        flex: 1
    },
    title: {
        color: "#111827",
        fontSize: 23,
        fontWeight: "800"
    },
    subtitle: {
        color: "#667085",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 3
    },
    badge: {
        minWidth: 86,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        paddingHorizontal: 12,
        borderWidth: 1
    },
    visitedBadge: {
        backgroundColor: "#e9f5df",
        borderColor: "#75a955"
    },
    wishlistBadge: {
        backgroundColor: "#fff4d6",
        borderColor: "#e5b844"
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "800"
    },
    visitedBadgeText: {
        color: "#356f1f"
    },
    wishlistBadgeText: {
        color: "#8a6200"
    },
    infoGrid: {
        flexDirection: "row",
        gap: 12,
        paddingTop: 18
    },
    infoBlock: {
        flex: 1,
        minHeight: 72,
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#ece8df"
    },
    infoLabel: {
        color: "#667085",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 5
    },
    infoValue: {
        color: "#111827",
        fontSize: 17,
        fontWeight: "800"
    },
    section: {
        paddingTop: 20
    },
    sectionTitle: {
        color: "#111827",
        fontSize: 18,
        fontWeight: "800"
    },
    stateRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12
    },
    stateOption: {
        flex: 1,
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d7d1c7",
        backgroundColor: "#fbfaf6",
        paddingHorizontal: 6
    },
    stateOptionActive: {
        borderColor: "#b9dca0",
        backgroundColor: "#edf8e6"
    },
    compactStateOption: {
        justifyContent: "flex-start",
        paddingHorizontal: 14
    },
    stateOptionText: {
        fontSize: 13,
        fontWeight: "800"
    },
    photoHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    photoCount: {
        color: "#667085",
        fontSize: 15,
        fontWeight: "800"
    },
    photoRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12
    },
    photoSlot: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 8
    },
    photoSlotEmpty: {
        backgroundColor: "#F1F5F9"
    },
    addPhotoSlot: {
        flex: 1,
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#c8c8c2",
        backgroundColor: "#fbfaf6"
    },
    detailsButton: {
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        marginTop: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#2368b2",
        backgroundColor: "#eaf4ff"
    },
    detailsButtonText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "800"
    },
    prompt: {
        color: "#4b5563",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 8,
        marginBottom: 8
    },
    compactOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    compactAction: {
        flex: 1,
        minWidth: 118,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10
    },
    compactVisitedAction: {
        borderColor: "#b9dca0",
        backgroundColor: "#edf8e6"
    },
    compactWishlistAction: {
        borderColor: "#e5d18a",
        backgroundColor: "#fff7dd"
    },
    compactActionText: {
        fontSize: 13,
        fontWeight: "800"
    },
    clearAction: {
        width: "100%",
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#d7d1c7",
        backgroundColor: "#ffffff"
    },
    clearActionText: {
        color: "#667085",
        fontSize: 14,
        fontWeight: "800"
    }
});
