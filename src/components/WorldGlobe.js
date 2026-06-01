import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { View, PanResponder } from "react-native";
import * as THREE from "three";
import world from "../../assets/data/world.json";
import { latLonToXYZ } from "../utils/geoUtils";
import CountryFill from "./CountryFill";

const rotationState = {
  x: 0,
  y: 0,
};

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

  useFrame(() => {
    if (!globeRef.current) return;

    globeRef.current.rotation.x = rotationState.x;
    globeRef.current.rotation.y = rotationState.y;
  });

  return (
    <group ref={globeRef}>
      <GlobeBase />
      <CountryFill />
      <CountryBorders />
    </group>
  );
}

export default function WorldGlobe() {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderMove: (_, gestureState) => {
          rotationState.y += gestureState.vx * 0.08;
          rotationState.x += gestureState.vy * 0.08;
        },
      }),
    []
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <GlobeScene />
      </Canvas>
    </View>
  );
}