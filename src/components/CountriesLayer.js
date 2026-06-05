import world from "../../assets/data/world-lite.json";
import CountryMesh from "./CountryMesh";

export default function CountriesLayer({
    onCountryPress
}) {
    return (
        <>
            {world.features.map((feature, index) => (
                <CountryMesh
                    key={`${feature.id}-${index}`}
                    feature={feature}
                    onCountryPress={onCountryPress}
                />
            ))}
        </>
    );
}
