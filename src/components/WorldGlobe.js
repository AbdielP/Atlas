import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet as RNStyleSheet, Text, View, PanResponder } from "react-native";
import * as THREE from "three";
import * as Location from "expo-location";
import { Navigation } from "lucide-react-native";
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

function LocationMarker({ lat, lon }) {
    const groupRef = useRef();
    const pos = useMemo(() => latLonToXYZ(lat, lon, 1.005), [lat, lon]);

    useEffect(() => {
        if (!groupRef.current) return;
        const normal = new THREE.Vector3(...pos).normalize();
        groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    }, [pos]);

    return (
        <group ref={groupRef} position={pos}>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.015, 0.04, 12]} />
                <meshBasicMaterial color="#EF4444" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.055, 0]}>
                <sphereGeometry args={[0.022, 16, 16]} />
                <meshBasicMaterial color="#DC2626" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.055, 0]}>
                <sphereGeometry args={[0.009, 16, 16]} />
                <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
            </mesh>
        </group>
    );
}

function GlobeScene({ onCountryPress, userLocation }) {
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
            {userLocation && (
                <LocationMarker lat={userLocation.lat} lon={userLocation.lon} />
            )}
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

const locStyles = RNStyleSheet.create({
    centerBtn: {
        position: "absolute",
        bottom: 160,
        left: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
});

export default function WorldGlobe({ onOpenDetail }) {
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const initialDistanceRef = useRef(0);
    const initialZoomRef = useRef(3);
    const isPinchingRef = useRef(false);
    const focusSnapshotRef = useRef(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        loadCountryStates();
    }, []);

    useEffect(() => {
        let subscription;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;
                const last = await Location.getLastKnownPositionAsync();
                if (last) setUserLocation({ lat: last.coords.latitude, lon: last.coords.longitude });
                subscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
                    (loc) => setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude })
                );
            } catch (_) {}
        })();
        return () => { subscription?.remove(); };
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

    function handleCenterOnLocation() {
        if (!userLocation) return;
        const target = getFocusTarget(userLocation, false);
        if (target) {
            target.zoom = 2.5;
            startGlobeAnimation(target);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#E8ECF1" }} {...panResponder.panHandlers}>
            <>
                <Canvas camera={{ position: [0, 0, 3] }}>
                    <GlobeScene
                        onCountryPress={focusCountry}
                        userLocation={userLocation}
                    />
                </Canvas>

                <FloatingStats />

                {userLocation && (
                    <Pressable onPress={handleCenterOnLocation} style={locStyles.centerBtn}>
                        <Navigation color="#3B82F6" size={22} strokeWidth={2.2} />
                    </Pressable>
                )}

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
