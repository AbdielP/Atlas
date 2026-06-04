import { useMemo, useRef } from "react";
import * as THREE from "three";
import earcut from "earcut";
import { latLonToXYZ } from "../utils/geoUtils";

export default function CountryMesh({
    feature,
    onCountryPress
}) {
    const geometries = useMemo(() => {
        const result = [];

        function buildGeometry(ring) {
            const flat = [];
            const vertices = [];

            ring.forEach(([lon, lat]) => {
                flat.push(lon, lat);
                vertices.push(...latLonToXYZ(lat, lon, 1.015));
            });

            const triangles = earcut(flat);

            const finalVertices = [];

            triangles.forEach((index) => {
                const i = index * 3;

                finalVertices.push(
                    vertices[i],
                    vertices[i + 1],
                    vertices[i + 2]
                );
            });

            const geometry = new THREE.BufferGeometry();

            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(finalVertices, 3)
            );

            geometry.computeVertexNormals();

            return geometry;
        }

        if (feature.geometry.type === "Polygon") {
            result.push(buildGeometry(feature.geometry.coordinates[0]));
        }

        if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
                result.push(buildGeometry(polygon[0]));
            });
        }

        return result;
    }, [feature]);

    const materialRefs = useRef([]);
    const stateRef = useRef("none");

    function handleClick(event) {
        event.stopPropagation();
        const iso = feature.properties.ISO_A3;

        onCountryPress?.({
            iso,
            name: feature.properties.NAME
        });

        if (stateRef.current === "none") {
            stateRef.current = "visited";

            materialRefs.current.forEach((material) => {
                if (material) {
                    material.color.set("#4da3ff");
                }
            });

            return;
        }

        if (stateRef.current === "visited") {
            stateRef.current = "wishlist";

            materialRefs.current.forEach((material) => {
                if (material) {
                    material.color.set("#f2c94c");
                }
            });

            return;
        }

        stateRef.current = "none";

        materialRefs.current.forEach((material) => {
            if (material) {
                material.color.set("#ffffff");
            }
        });
    }

    return (
        <>
            {geometries.map((geometry, index) => (
                <mesh
                    key={index}
                    geometry={geometry}
                    onClick={handleClick}
                >
                    <meshBasicMaterial
                        ref={(ref) => {
                            materialRefs.current[index] = ref;
                        }}
                        color="#ffffff"
                        side={THREE.FrontSide}
                    />
                </mesh>
            ))}
        </>
    );
}