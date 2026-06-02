import { useMemo, useRef } from "react";
import * as THREE from "three";
import earcut from "earcut";
import world from "../../assets/data/world.json";
import { latLonToXYZ } from "../utils/geoUtils";

const panama = world.features.find(
    (country) => country.properties.NAME === "Panama"
);

export default function CountryFill() {
    const materialRef = useRef(null);
    const statusRef = useRef("none");

    const geometry = useMemo(() => {
        const ring = panama.geometry.coordinates[0];

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
            finalVertices.push(vertices[i], vertices[i + 1], vertices[i + 2]);
        });

        const bufferGeometry = new THREE.BufferGeometry();

        bufferGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(finalVertices, 3)
        );

        bufferGeometry.computeVertexNormals();

        return bufferGeometry;
    }, []);

    function handlePress() {
        if (!materialRef.current) return;

        if (statusRef.current === "none") {
            statusRef.current = "visited";
            materialRef.current.color.set("#4da3ff");
            console.log("Panama visited");
            return;
        }

        if (statusRef.current === "visited") {
            statusRef.current = "desired";
            materialRef.current.color.set("#f2c94c");
            console.log("Panama desired");
            return;
        }

        statusRef.current = "none";
        materialRef.current.color.set("#ffffff");
        console.log("Panama none");
    }

    return (
        <mesh geometry={geometry} onClick={handlePress}>
            <meshBasicMaterial
                ref={materialRef}
                color="#ffffff"
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}