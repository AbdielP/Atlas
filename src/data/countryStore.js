import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import countriesData from "../../assets/data/countries.json";

// Mapeos alpha-3 ↔ alpha-2 (el app usa alpha-3, la BD usa alpha-2)
const alpha3ToAlpha2 = {};
const alpha2ToAlpha3 = {};
countriesData.forEach(({ cca2, cca3 }) => {
    if (cca2 && cca3) {
        alpha3ToAlpha2[cca3] = cca2;
        alpha2ToAlpha3[cca2] = cca3;
    }
});

// Mapeo de status: app usa "visited", la BD usa "visitado"
const statusToDb = { visited: "visitado", wishlist: "wishlist" };
const statusFromDb = { visitado: "visited", wishlist: "wishlist" };

export const countryStates = {};

const countryMaterials = {};
const STORAGE_KEY = "@atlas/country-states/v1";
const savedStates = new Set(["visited", "wishlist"]);
let countryStatesLoadPromise = null;

const colors = {
    none: "#ffffff",
    visited: "#4da3ff",
    wishlist: "#f2c94c"
};

// --- Subscribers (para que ListScreen se refresque sin polling) ---

const subscribers = new Set();

export function subscribe(fn) {
    subscribers.add(fn);
}

export function unsubscribe(fn) {
    subscribers.delete(fn);
}

function notifySubscribers() {
    subscribers.forEach((fn) => fn());
}

// --- Materiales / colores del globo ---

export function registerCountryMaterials(iso, materials) {
    countryMaterials[iso] = materials;
    applyCountryColor(iso, countryStates[iso] || "none");
}

export function getCountryColor(iso) {
    return colors[countryStates[iso] || "none"];
}

export function setCountryState(iso, state) {
    if (state === "none") {
        delete countryStates[iso];
    } else {
        countryStates[iso] = state;
    }

    applyCountryColor(iso, state);
}

// --- Escritura: instántanea en memoria, AsyncStorage y Supabase en background ---

export async function setCountryStateAndPersist(iso, state) {
    setCountryState(iso, state);   // globo pinta aquí, sincrono
    notifySubscribers();            // refresca ListScreen
    await persistCountryStates();  // AsyncStorage
    syncStateToSupabase(iso, state); // fire-and-forget, sin await
}

async function syncStateToSupabase(iso, state) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const countryCode = alpha3ToAlpha2[iso];
        if (!countryCode) return;

        if (state === "none") {
            await supabase
                .from("visited_countries")
                .delete()
                .eq("user_id", user.id)
                .eq("country_code", countryCode);
        } else {
            await supabase
                .from("visited_countries")
                .upsert(
                    { user_id: user.id, country_code: countryCode, status: statusToDb[state] },
                    { onConflict: "user_id,country_code" }
                );
        }
    } catch (_) {
        // silencioso — el estado ya está guardado en AsyncStorage localmente
    }
}

// --- Lectura al abrir la app ---

export async function loadCountryStates() {
    if (countryStatesLoadPromise) {
        return countryStatesLoadPromise;
    }

    countryStatesLoadPromise = readCountryStates();

    return countryStatesLoadPromise;
}

export function preloadCountryStates() {
    return loadCountryStates();
}

// Llamado desde App.js después de que la sesión esté lista.
// Reemplaza el estado local con lo que hay en Supabase y notifica a los subscribers.
export async function syncFromSupabase() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("visited_countries")
            .select("country_code, status")
            .eq("user_id", user.id);

        if (error || !data) return;

        Object.keys(countryStates).forEach((iso) => {
            delete countryStates[iso];
            applyCountryColor(iso, "none");
        });

        data.forEach(({ country_code, status }) => {
            const appStatus = statusFromDb[status];
            const iso = alpha2ToAlpha3[country_code];
            if (!appStatus || !iso) return;
            countryStates[iso] = appStatus;
            applyCountryColor(iso, appStatus);
        });

        await persistCountryStates();
        notifySubscribers();
    } catch (_) {
        // silencioso — el estado de AsyncStorage ya estaba pintado
    }
}

// --- Limpieza al cerrar sesión (para no mezclar datos entre cuentas) ---

export async function clearLocalCountryStates() {
    Object.keys(countryStates).forEach((iso) => {
        delete countryStates[iso];
        applyCountryColor(iso, "none");
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
    notifySubscribers();
}

// --- Internos ---

async function readCountryStates() {
    try {
        const rawStates = await AsyncStorage.getItem(STORAGE_KEY);

        if (!rawStates) return;

        const parsedStates = JSON.parse(rawStates);

        if (!parsedStates || typeof parsedStates !== "object") return;

        Object.keys(countryStates).forEach((iso) => {
            delete countryStates[iso];
            applyCountryColor(iso, "none");
        });

        Object.entries(parsedStates).forEach(([iso, state]) => {
            if (!savedStates.has(state)) return;
            countryStates[iso] = state;
            applyCountryColor(iso, state);
        });
    } catch (_) {
        // silencioso
    }
}

async function persistCountryStates() {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(countryStates));
    } catch (_) {
        // silencioso
    }
}

function applyCountryColor(iso, state) {
    const materials = countryMaterials[iso] || [];
    const color = colors[state] || colors.none;

    materials.forEach((material) => {
        if (material) {
            material.color.set(color);
        }
    });
}
