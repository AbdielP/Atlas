import { useMemo } from "react";
import * as THREE from "three";
import earcut from "earcut";
import world from "../../assets/data/world.json";
import { latLonToXYZ } from "../utils/geoUtils";

const panama = world.features.find(
  (country) => country.properties.NAME === "Panama"
);

export default function CountryFill() {
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
      finalVertices.push(
        vertices[i],
        vertices[i + 1],
        vertices[i + 2]
      );
    });

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(finalVertices, 3)
    );

    bufferGeometry.computeVertexNormals();

    return bufferGeometry;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#4da3ff"
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}