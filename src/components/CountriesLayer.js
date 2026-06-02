import world from "../../assets/data/world.json";
import CountryMesh from "./CountryMesh";

export default function CountriesLayer() {
    return (
        <>
            {world.features.map((feature, index) => (
                <CountryMesh
                    key={`${feature.properties.ISO_A3}-${index}`}
                    feature={feature}
                />
            ))}
        </>
    );
}