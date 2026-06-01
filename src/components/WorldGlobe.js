import { Canvas } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import world from "../../assets/data/world.json";
import { latLonToXYZ } from "../utils/geoUtils";
import CountryFill from "./CountryFill";

function GlobeBase() {
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial color="#eeeeee" />
    </mesh>
  );
}

function CountryBorders() {
  const geometry = useMemo(() => {
    const positions = [];

    function addRing(ring) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];

        positions.push(...latLonToXYZ(lat1, lon1, 1.02));
        positions.push(...latLonToXYZ(lat2, lon2, 1.02));
      }
    }

    world.features.forEach((country) => {
      if (country.geometry.type === "Polygon") {
        country.geometry.coordinates.forEach(addRing);
      }

      if (country.geometry.type === "MultiPolygon") {
        country.geometry.coordinates.forEach((polygon) => {
          polygon.forEach(addRing);
        });
      }
    });

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return bufferGeometry;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#555555" />
    </lineSegments>
  );
}

function GlobeScene() {
  const globeRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  function handlePointerDown(event) {
    isDraggingRef.current = true;
    lastPointerRef.current = {
      x: event.nativeEvent?.locationX ?? event.clientX ?? 0,
      y: event.nativeEvent?.locationY ?? event.clientY ?? 0,
    };
  }

  function handlePointerMove(event) {
    if (!isDraggingRef.current || !globeRef.current) return;

    const x = event.nativeEvent?.locationX ?? event.clientX ?? 0;
    const y = event.nativeEvent?.locationY ?? event.clientY ?? 0;

    const deltaX = x - lastPointerRef.current.x;
    const deltaY = y - lastPointerRef.current.y;

    globeRef.current.rotation.y += deltaX * 0.005;
    globeRef.current.rotation.x += deltaY * 0.005;

    lastPointerRef.current = { x, y };
  }

  function handlePointerUp() {
    isDraggingRef.current = false;
  }

  return (
    <group
      ref={globeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
    >
      <GlobeBase />
      <CountryFill />
      <CountryBorders />
    </group>
  );
}

export default function WorldGlobe() {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <GlobeScene />
    </Canvas>
  );
}