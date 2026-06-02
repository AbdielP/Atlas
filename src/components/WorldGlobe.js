import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { View, PanResponder } from "react-native";
import * as THREE from "three";
import world from "../../assets/data/world.json";
import { latLonToXYZ } from "../utils/geoUtils";
import CountryFill from "./CountryFill";

const globeState = {
    x: 0,
    y: 0,
    zoom: 3
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

    useFrame((state) => {
        if (!globeRef.current) return;

        globeRef.current.rotation.x = globeState.x;
        globeRef.current.rotation.y = globeState.y;
        state.camera.position.z = globeState.zoom;
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
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const initialDistanceRef = useRef(0);
    const initialZoomRef = useRef(3);
    const isPinchingRef = useRef(false);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: (event) => {
                    return event.nativeEvent.touches.length === 2;
                },

                onMoveShouldSetPanResponder: (event, gestureState) => {
                    if (event.nativeEvent.touches.length === 2) return true;

                    return (
                        Math.abs(gestureState.dx) > 6 ||
                        Math.abs(gestureState.dy) > 6
                    );
                },

                onPanResponderGrant: (event) => {
                    const touches = event.nativeEvent.touches;

                    if (touches.length === 1) {
                        lastTouchRef.current = {
                            x: touches[0].pageX,
                            y: touches[0].pageY
                        };
                    }

                    if (touches.length === 2) {
                        const [a, b] = touches;

                        isPinchingRef.current = true;

                        initialDistanceRef.current = Math.hypot(
                            b.pageX - a.pageX,
                            b.pageY - a.pageY
                        );

                        initialZoomRef.current = globeState.zoom;
                    }
                },

                onPanResponderMove: (event) => {
                    const touches = event.nativeEvent.touches;

                    if (touches.length === 2) {
                        const [a, b] = touches;

                        const distance = Math.hypot(
                            b.pageX - a.pageX,
                            b.pageY - a.pageY
                        );

                        if (initialDistanceRef.current <= 0) return;

                        const scale = distance / initialDistanceRef.current;

                        globeState.zoom = Math.max(
                            1.8,
                            Math.min(5.5, initialZoomRef.current / scale)
                        );

                        return;
                    }

                    if (touches.length === 1 && !isPinchingRef.current) {
                        const touch = touches[0];

                        const deltaX = touch.pageX - lastTouchRef.current.x;
                        const deltaY = touch.pageY - lastTouchRef.current.y;

                        globeState.y += deltaX * 0.004;
                        globeState.x += deltaY * 0.004;

                        lastTouchRef.current = {
                            x: touch.pageX,
                            y: touch.pageY
                        };
                    }
                },

                onPanResponderRelease: () => {
                    isPinchingRef.current = false;
                    initialDistanceRef.current = 0;
                },

                onPanResponderTerminate: () => {
                    isPinchingRef.current = false;
                    initialDistanceRef.current = 0;
                }
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