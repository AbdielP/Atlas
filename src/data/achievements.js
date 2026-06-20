import { supabase } from "../lib/supabase";
import countriesData from "../../assets/data/countries.json";
import { countryStates, subscribe } from "./countryStore";
import { triggerAchievementToast } from "../components/AchievementToast";

const cca3ToCountry = {};
countriesData.forEach((c) => { cca3ToCountry[c.cca3] = c; });

const LATIN_SUBREGIONS = ["South America", "Central America", "Caribbean"];

const unlocked = {};
const uiSubscribers = new Set();
let toastsEnabled = false;

export function subscribeAchievements(fn) { uiSubscribers.add(fn); }
export function unsubscribeAchievements(fn) { uiSubscribers.delete(fn); }
function notifyUI() { uiSubscribers.forEach((fn) => fn()); }

function visitedCountries() {
    return Object.entries(countryStates)
        .filter(([, s]) => s === "visited")
        .map(([iso]) => cca3ToCountry[iso])
        .filter(Boolean);
}

function visitedCount() {
    return Object.values(countryStates).filter((s) => s === "visited").length;
}

function wishlistCount() {
    return Object.values(countryStates).filter((s) => s === "wishlist").length;
}

function visitedRegions() {
    return new Set(visitedCountries().map((c) => c.region).filter((r) => r && r !== "Antarctic"));
}

function visitedInSubregions(subregions) {
    return visitedCountries().filter((c) => subregions.includes(c.subregion)).length;
}

function visitedInRegion(region) {
    return visitedCountries().filter((c) => c.region === region).length;
}

export const catalog = [
    { key: "first_country", title: "Primer destino", detail: "Marca tu primer país como visitado", region: null, evaluate: () => visitedCount() >= 1 },
    { key: "5_countries", title: "Viajero novato", detail: "Visita 5 países", region: null, evaluate: () => visitedCount() >= 5 },
    { key: "10_countries", title: "Trotamundos", detail: "Visita 10 países", region: null, evaluate: () => visitedCount() >= 10 },
    { key: "25_countries", title: "Ciudadano del mundo", detail: "Visita 25 países", region: null, evaluate: () => visitedCount() >= 25 },
    { key: "50_countries", title: "Leyenda viajera", detail: "Visita 50 países", region: null, evaluate: () => visitedCount() >= 50 },
    { key: "first_wishlist", title: "Soñador", detail: "Agrega 1 país a tu wishlist", region: null, evaluate: () => wishlistCount() >= 1 },
    { key: "10_wishlist", title: "Lista de sueños", detail: "Agrega 10 países a tu wishlist", region: null, evaluate: () => wishlistCount() >= 10 },
    { key: "2_continents", title: "Intercontinental", detail: "Visita países en 2 continentes", region: null, evaluate: () => visitedRegions().size >= 2 },
    { key: "3_continents", title: "Explorador continental", detail: "Visita países en 3 continentes", region: null, evaluate: () => visitedRegions().size >= 3 },
    { key: "5_continents", title: "Viajero global", detail: "Visita países en 5 continentes", region: null, evaluate: () => visitedRegions().size >= 5 },
    { key: "6_continents", title: "Planeta desbloqueado", detail: "Visita países en los 6 continentes", region: null, evaluate: () => visitedRegions().size >= 6 },
    { key: "south_america", title: "Alma latina", detail: "Visita 3 países de América Latina", region: "Americas", evaluate: () => visitedInSubregions(LATIN_SUBREGIONS) >= 3 },
    { key: "europe", title: "Eurotrip", detail: "Visita 5 países de Europa", region: "Europe", evaluate: () => visitedInRegion("Europe") >= 5 },
    { key: "asia", title: "Ruta asiática", detail: "Visita 3 países de Asia", region: "Asia", evaluate: () => visitedInRegion("Asia") >= 3 },
    { key: "africa", title: "Safari completo", detail: "Visita 3 países de África", region: "Africa", evaluate: () => visitedInRegion("Africa") >= 3 },
];

export function isUnlocked(key) {
    return !!unlocked[key];
}

export function getUnlockedDate(key) {
    return unlocked[key] || null;
}

function evaluateAndSync() {
    let changed = false;
    for (const achievement of catalog) {
        if (unlocked[achievement.key]) continue;
        if (achievement.evaluate()) {
            unlocked[achievement.key] = new Date().toISOString();
            changed = true;
            if (toastsEnabled) triggerAchievementToast(achievement.title);
            syncAchievementToSupabase(achievement.key);
        }
    }
    if (changed) notifyUI();
}

async function syncAchievementToSupabase(key) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
            .from("achievements")
            .upsert(
                { user_id: user.id, achievement_key: key },
                { onConflict: "user_id,achievement_key" }
            );
    } catch (_) {}
}

export async function loadAchievementsFromSupabase() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from("achievements")
            .select("achievement_key, unlocked_at")
            .eq("user_id", user.id);
        if (error || !data) return;
        data.forEach(({ achievement_key, unlocked_at }) => {
            unlocked[achievement_key] = unlocked_at;
        });
        toastsEnabled = true;
        notifyUI();
    } catch (_) {}
}

// Evaluar cada vez que cambian los países
subscribe(evaluateAndSync);
