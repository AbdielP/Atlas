export const countryStates = {};
const countryMaterials = {};

export function registerCountryMaterials(iso, materials) {
    countryMaterials[iso] = materials;
}

export function unregisterCountryMaterials(iso) {
    delete countryMaterials[iso];
}

export function getCountryState(iso) {
    return countryStates[iso] || "none";
}

export function setCountryState(iso, state) {
    if (state === "none") {
        delete countryStates[iso];
    } else {
        countryStates[iso] = state;
    }

    const color =
        state === "visited"
            ? "#4da3ff"
            : state === "wishlist"
                ? "#f2c94c"
                : "#ffffff";

    const materials = countryMaterials[iso] || [];

    materials.forEach((material) => {
        if (material) {
            material.color.set(color);
        }
    });
}