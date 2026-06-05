import AsyncStorage from "@react-native-async-storage/async-storage";

export const countryStates = {};

const countryMaterials = {};
const STORAGE_KEY = "@atlas/country-states/v1";
const savedStates = new Set(["visited", "wishlist"]);

const colors = {
    none: "#ffffff",
    visited: "#4da3ff",
    wishlist: "#f2c94c"
};

export function registerCountryMaterials(iso, materials) {
    countryMaterials[iso] = materials;
    applyCountryColor(iso, countryStates[iso] || "none");
}

export function setCountryState(iso, state) {
    if (state === "none") {
        delete countryStates[iso];
    } else {
        countryStates[iso] = state;
    }

    applyCountryColor(iso, state);
}

export async function setCountryStateAndPersist(iso, state) {
    setCountryState(iso, state);
    await persistCountryStates();
}

export async function loadCountryStates() {
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
    } catch (error) {
        console.warn("Could not load country states", error);
    }
}

async function persistCountryStates() {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(countryStates));
    } catch (error) {
        console.warn("Could not persist country states", error);
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
