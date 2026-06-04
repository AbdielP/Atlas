export const countryStates = {};

const countryMaterials = {};

const colors = {
    none: "#ffffff",
    visited: "#4da3ff",
    wishlist: "#f2c94c"
};

export function registerCountryMaterials(iso, materials) {
    countryMaterials[iso] = materials;
}

export function setCountryState(iso, state) {
    if (state === "none") {
        delete countryStates[iso];
    } else {
        countryStates[iso] = state;
    }

    const materials = countryMaterials[iso] || [];
    const color = colors[state] || colors.none;

    materials.forEach((material) => {
        if (material) {
            material.color.set(color);
        }
    });
}