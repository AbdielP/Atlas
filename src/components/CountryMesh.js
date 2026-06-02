import { useMemo } from "react";
import * as THREE from "three";
import earcut from "earcut";
import { latLonToXYZ } from "../utils/geoUtils";

export default function CountryMesh({ feature }) {
    const geometry = useMemo(() => {
        if (feature.geometry.type !== "Polygon") {
            return null;
        }

        const ring = feature.geometry.coordinates[0];

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
    }, [feature]);

    if (!geometry) return null;

    return (
        <mesh
            geometry={geometry}
            onClick={(event) => {
                event.stopPropagation();
                console.log(feature.properties.NAME);
            }}
        >
            <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}