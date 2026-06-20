import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet as RNStyleSheet, Text, View, PanResponder } from "react-native";
import * as THREE from "three";
import world from "../../assets/data/world-lite.json";
import countriesData from "../../assets/data/countries.json";
import { latLonToXYZ } from "../utils/geoUtils";
import CountriesLayer from "./CountriesLayer";
import CountryMenu from "./CountryMenu";
import {
    countryStates,
    loadCountryStates,
    setCountryStateAndPersist,
    subscribe,
    unsubscribe,
} from "../data/countryStore";

const globeState = {
    x: 0,
    y: 0,
    zoom: 3
};

const COMPACT_FOCUS_ZOOM = 2.35;
const COMPACT_FOCUS_VERTICAL_OFFSET = 0.34;
const RICH_FOCUS_ZOOM = 2.58;
const RICH_FOCUS_VERTICAL_OFFSET = 0.56;
const FOCUS_ANIMATION_MS = 650;

const globeAnimation = {
    active: false,
    startedAt: 0,
    duration: FOCUS_ANIMATION_MS,
    from: { x: 0, y: 0, zoom: 3 },
    to: { x: 0, y: 0, zoom: 3 }
};

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}

function normalizeAngleNear(target, current) {
    let next = target;

    while (next - current > Math.PI) next -= Math.PI * 2;
    while (next - current < -Math.PI) next += Math.PI * 2;

    return next;
}

function startGlobeAnimation(target, duration = FOCUS_ANIMATION_MS) {
    globeAnimation.active = true;
    globeAnimation.startedAt = Date.now();
    globeAnimation.duration = duration;
    globeAnimation.from = {
        x: globeState.x,
        y: globeState.y,
        zoom: globeState.zoom
    };
    globeAnimation.to = {
        x: target.x,
        y: target.y,
        zoom: target.zoom
    };
}

function stopGlobeAnimation() {
    globeAnimation.active = false;
}

function getFocusTarget(focusPoint, isRichSheet) {
    if (!focusPoint) return null;

    const zoom = isRichSheet ? RICH_FOCUS_ZOOM : COMPACT_FOCUS_ZOOM;
    const verticalOffset = isRichSheet
        ? RICH_FOCUS_VERTICAL_OFFSET
        : COMPACT_FOCUS_VERTICAL_OFFSET;
    const { lat, lon } = focusPoint;
    const point = latLonToXYZ(lat, lon, 1);
    const targetY = normalizeAngleNear(
        Math.atan2(-point[0], point[2]),
        globeState.y
    );
    const targetX = THREE.MathUtils.degToRad(lat) - Math.asin(verticalOffset);

    return {
        x: targetX,
        y: targetY,
        zoom
    };
}

function GlobeBase() {
    return (
        <mesh raycast={() => null}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial color="#e6e6e6" toneMapped={false} />
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

function GlobeScene({ onCountryPress }) {
    const globeRef = useRef(null);

    useFrame((state) => {
        if (!globeRef.current) return;

        if (globeAnimation.active) {
            const elapsed = Date.now() - globeAnimation.startedAt;
            const progress = Math.min(1, elapsed / globeAnimation.duration);
            const eased = easeOutCubic(progress);
            const { from, to } = globeAnimation;

            globeState.x = THREE.MathUtils.lerp(from.x, to.x, eased);
            globeState.y = THREE.MathUtils.lerp(from.y, to.y, eased);
            globeState.zoom = THREE.MathUtils.lerp(from.zoom, to.zoom, eased);

            if (progress >= 1) {
                globeAnimation.active = false;
            }
        }

        globeRef.current.rotation.x = globeState.x;
        globeRef.current.rotation.y = globeState.y;
        state.camera.position.z = globeState.zoom;
    });

    return (
        <group ref={globeRef}>
            <GlobeBase />
            <CountriesLayer
                onCountryPress={onCountryPress}
            />
            <CountryBorders />
        </group>
    );
}

function computeStats() {
    const visited = Object.values(countryStates).filter((s) => s === "visited").length;
    const total = countriesData.length;
    const percent = total > 0 ? Math.round((visited / total) * 100) : 0;
    const continents = new Set(
        Object.entries(countryStates)
            .filter(([, s]) => s === "visited")
            .map(([iso]) => countriesData.find((c) => c.cca3 === iso)?.region)
            .filter((r) => r && r !== "Antarctic")
    );
    return { visited, percent, continents: continents.size };
}

function FloatingStats() {
    const opacity = useRef(new Animated.Value(1)).current;
    const [stats, setStats] = useState(computeStats);
    const visibleRef = useRef(true);

    useEffect(() => {
        const refresh = () => setStats(computeStats());
        subscribe(refresh);
        return () => unsubscribe(refresh);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const shouldShow = globeState.zoom >= 2.8;
            if (shouldShow !== visibleRef.current) {
                visibleRef.current = shouldShow;
                Animated.timing(opacity, {
                    toValue: shouldShow ? 1 : 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <Animated.View style={[floatStyles.container, { opacity }]} pointerEvents="none">
            <View style={floatStyles.stat}>
                <Text style={[floatStyles.number, { fontSize: 42 }]}>{stats.visited}</Text>
                <Text style={[floatStyles.label, { fontSize: 13 }]}>países visitados</Text>
            </View>

            <View style={[floatStyles.stat, { paddingLeft: 14 }]}>
                <Text style={[floatStyles.number, { fontSize: 34 }]}>{stats.percent}%</Text>
                <Text style={[floatStyles.label, { fontSize: 12 }]}>del mundo</Text>
            </View>

            <View style={[floatStyles.stat, { paddingLeft: 28 }]}>
                <Text style={[floatStyles.number, { fontSize: 28 }]}>{stats.continents}</Text>
                <Text style={[floatStyles.label, { fontSize: 11 }]}>continentes</Text>
            </View>
        </Animated.View>
    );
}

const floatStyles = RNStyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        right: 20,
        alignItems: "flex-end",
        gap: 6,
    },
    stat: {
        alignItems: "flex-end",
    },
    number: {
        color: "#0b1f45",
        fontWeight: "900",
        lineHeight: 46,
    },
    label: {
        color: "#6f7b8d",
        fontWeight: "700",
        marginTop: -4,
    },
});

export default function WorldGlobe({ onOpenDetail }) {
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const initialDistanceRef = useRef(0);
    const initialZoomRef = useRef(3);
    const isPinchingRef = useRef(false);
    const focusSnapshotRef = useRef(null);
    const [selectedCountry, setSelectedCountry] = useState(null);

    useEffect(() => {
        loadCountryStates();
    }, []);

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
                    stopGlobeAnimation();

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

    function focusCountry(country) {
        if (!focusSnapshotRef.current) {
            focusSnapshotRef.current = {
                x: globeState.x,
                y: globeState.y,
                zoom: globeState.zoom
            };
        }

        const status = countryStates[country.id] || "none";
        const isRichSheet = status === "visited" || status === "wishlist";
        const target = getFocusTarget(country.focusPoint, isRichSheet);

        if (target) {
            startGlobeAnimation(target);
        }

        setSelectedCountry(country);
    }

    function closeCountryMenu() {
        setSelectedCountry(null);

        if (focusSnapshotRef.current) {
            startGlobeAnimation(focusSnapshotRef.current, 500);
            focusSnapshotRef.current = null;
        }
    }

    function handleViewDetail() {
        const id = selectedCountry?.id;
        setSelectedCountry(null);
        focusSnapshotRef.current = null;
        onOpenDetail?.(id);
    }

    return (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            <>
                <Canvas camera={{ position: [0, 0, 3] }}>
                    <GlobeScene
                        onCountryPress={focusCountry}
                    />
                </Canvas>

                <FloatingStats />

                <CountryMenu
                    visible={!!selectedCountry}
                    country={selectedCountry}
                    onVisited={() => {
                        setCountryStateAndPersist(selectedCountry.id, "visited");
                        closeCountryMenu();
                    }}
                    onWishlist={() => {
                        setCountryStateAndPersist(selectedCountry.id, "wishlist");
                        closeCountryMenu();
                    }}
                    onClear={() => {
                        setCountryStateAndPersist(selectedCountry.id, "none");
                        closeCountryMenu();
                    }}
                    onClose={() => {
                        closeCountryMenu();
                    }}
                    onViewDetail={handleViewDetail}
                />
            </>
        </View>
    );
}
