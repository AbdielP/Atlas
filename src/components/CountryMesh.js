import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import earcut from "earcut";
import { latLonToXYZ } from "../utils/geoUtils";
import { registerCountryMaterials } from "../data/countryStore";

const COUNTRY_RADIUS = 1.018;
const MAX_TRIANGLE_EDGE = 0.18;
const MAX_SUBDIVISION_DEPTH = 8;

export default function CountryMesh({ feature, onCountryPress }) {
    const iso = feature.properties.ISO_A3;
    const name = feature.properties.NAME;
    const materialRefs = useRef([]);

    const geometries = useMemo(() => {
        const result = [];

        function addOutwardTriangle(finalVertices, a, b, c) {
            const ap = a.position;
            const bp = b.position;
            const cp = c.position;
            const abx = bp[0] - ap[0];
            const aby = bp[1] - ap[1];
            const abz = bp[2] - ap[2];
            const acx = cp[0] - ap[0];
            const acy = cp[1] - ap[1];
            const acz = cp[2] - ap[2];
            const normalX = aby * acz - abz * acy;
            const normalY = abz * acx - abx * acz;
            const normalZ = abx * acy - aby * acx;
            const centerX = ap[0] + bp[0] + cp[0];
            const centerY = ap[1] + bp[1] + cp[1];
            const centerZ = ap[2] + bp[2] + cp[2];

            if (normalX * centerX + normalY * centerY + normalZ * centerZ < 0) {
                finalVertices.push(...ap, ...cp, ...bp);
                return;
            }

            finalVertices.push(...ap, ...bp, ...cp);
        }

        function edgeLengthSquared(a, b) {
            const x = b.position[0] - a.position[0];
            const y = b.position[1] - a.position[1];
            const z = b.position[2] - a.position[2];

            return x * x + y * y + z * z;
        }

        function createVertex(lon, lat) {
            return {
                lon,
                lat,
                position: latLonToXYZ(lat, lon, COUNTRY_RADIUS)
            };
        }

        function midpointOnMap(a, b) {
            const lon = (a.lon + b.lon) / 2;
            const lat = (a.lat + b.lat) / 2;

            return createVertex(lon, lat);
        }

        function unwrapRing(ring) {
            let previousLon = null;

            return ring.map(([rawLon, lat]) => {
                let lon = rawLon;

                if (previousLon !== null) {
                    while (lon - previousLon > 180) lon -= 360;
                    while (lon - previousLon < -180) lon += 360;
                }

                previousLon = lon;

                return [lon, lat];
            });
        }

        function addCurvedTriangle(finalVertices, a, b, c, depth = 0) {
            if (depth >= MAX_SUBDIVISION_DEPTH) {
                addOutwardTriangle(finalVertices, a, b, c);
                return;
            }

            const ab = edgeLengthSquared(a, b);
            const bc = edgeLengthSquared(b, c);
            const ca = edgeLengthSquared(c, a);
            const maxEdge = MAX_TRIANGLE_EDGE * MAX_TRIANGLE_EDGE;

            if (ab <= maxEdge && bc <= maxEdge && ca <= maxEdge) {
                addOutwardTriangle(finalVertices, a, b, c);
                return;
            }

            if (ab >= bc && ab >= ca) {
                const midpoint = midpointOnMap(a, b);

                addCurvedTriangle(finalVertices, a, midpoint, c, depth + 1);
                addCurvedTriangle(finalVertices, midpoint, b, c, depth + 1);
                return;
            }

            if (bc >= ca) {
                const midpoint = midpointOnMap(b, c);

                addCurvedTriangle(finalVertices, a, b, midpoint, depth + 1);
                addCurvedTriangle(finalVertices, a, midpoint, c, depth + 1);
                return;
            }

            const midpoint = midpointOnMap(c, a);

            addCurvedTriangle(finalVertices, a, b, midpoint, depth + 1);
            addCurvedTriangle(finalVertices, midpoint, b, c, depth + 1);
        }

        function buildGeometry(ring) {
            const unwrappedRing = unwrapRing(ring);
            const flat = [];
            const vertices = [];

            unwrappedRing.forEach(([lon, lat]) => {
                flat.push(lon, lat);
                vertices.push(createVertex(lon, lat));
            });

            const triangles = earcut(flat);
            const finalVertices = [];

            for (let i = 0; i < triangles.length; i += 3) {
                addCurvedTriangle(
                    finalVertices,
                    vertices[triangles[i]],
                    vertices[triangles[i + 1]],
                    vertices[triangles[i + 2]]
                );
            }

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

    useEffect(() => {
        registerCountryMaterials(iso, materialRefs.current);
    }, [iso]);

    function handleClick(event) {
        event.stopPropagation();

        onCountryPress?.({
            iso,
            name
        });
    }

    return (
        <>
            {geometries.map((geometry, index) => (
                <mesh key={index} geometry={geometry} onClick={handleClick}>
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
