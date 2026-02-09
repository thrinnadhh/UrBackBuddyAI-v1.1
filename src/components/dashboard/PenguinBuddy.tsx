import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cone, Float, Sparkles, Cloud, Capsule } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

// --- DIALOGUE ENGINE ---
const getSmartGreeting = (userName: string = "Friend") => {
    const hasMetPenguin = localStorage.getItem('hasMetPenguin');
    if (!hasMetPenguin) {
        localStorage.setItem('hasMetPenguin', 'true');
        return "Standing tall and slim!";
    }
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";

    const quotes = [
        "Stand tall like a mountain!", "Posture makes you look taller!", "Elegance is key!", "Looking sharp!"
    ];
    return `${greeting}, ${userName}! ${quotes[Math.floor(Math.random() * quotes.length)]}`;
};

// --- COMPONENT: JAGGED HIMALAYAN MOUNTAINS ---
const HimalayanMountains = ({ isGoodPosture }: { isGoodPosture: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => new THREE.PlaneGeometry(60, 30, 128, 128), []);
    const originalPositions = useMemo(() => geometry.attributes.position.array.slice(), [geometry]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        const positions = meshRef.current.geometry.attributes.position;
        const array = positions.array as Float32Array;

        for (let i = 0; i < originalPositions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            let elevation = Math.abs(noise2D(x * 0.05, y * 0.05)) * 8;
            elevation += (1.0 - Math.abs(noise2D(x * 0.15 + time * 0.01, y * 0.15))) * 3;
            elevation += noise2D(x * 0.5, y * 0.5) * 0.5;
            const distanceMask = Math.max(0, y + 5) / 10;
            array[i + 2] = originalPositions[i + 2] + (elevation * distanceMask);
        }
        positions.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
    });

    return (
        <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -3.5, -15]}>
            <meshStandardMaterial
                color={isGoodPosture ? "#e0f2fe" : "#cbd5e1"}
                roughness={0.9}
                metalness={0.1}
                flatShading={true}
            />
        </mesh>
    );
};

// --- COMPONENT: SNOW DUST ---
const SnowDust = ({ isGoodPosture }: { isGoodPosture: boolean }) => {
    return (
        <Sparkles
            count={isGoodPosture ? 150 : 50}
            scale={isGoodPosture ? [5, 3, 3] : [3, 1, 3]}
            size={isGoodPosture ? 3 : 2}
            speed={isGoodPosture ? 2 : 0.5}
            opacity={0.7}
            color="#fff"
            position={[0, -1.2, 0.5]}
        />
    );
}

// --- THE PENGUIN 12.0 (Slim & Cute) ---
const Penguin = ({ isGoodPosture }: { isGoodPosture: boolean }) => {
    const bodyRef = useRef<THREE.Group>(null);
    const headGroupRef = useRef<THREE.Group>(null);
    const leftWingRef = useRef<THREE.Mesh>(null);
    const rightWingRef = useRef<THREE.Mesh>(null);
    const pupilsRef = useRef<THREE.Group>(null);

    const globalMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            globalMouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            globalMouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const [blinking, setBlinking] = useState(false);
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setBlinking(true);
            setTimeout(() => setBlinking(false), 150);
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, []);

    useFrame((state) => {
        if (!bodyRef.current || !headGroupRef.current) return;
        const time = state.clock.getElapsedTime();
        const targetX = globalMouse.current.x;
        const targetY = globalMouse.current.y * 0.5;

        // Head Tracking
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetX * 0.5, 0.1);
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, -targetY * 0.4, 0.1);

        // Eye Tracking
        if (pupilsRef.current) {
            pupilsRef.current.position.x = THREE.MathUtils.lerp(pupilsRef.current.position.x, targetX * 0.15, 0.2);
            pupilsRef.current.position.y = THREE.MathUtils.lerp(pupilsRef.current.position.y, targetY * 0.15, 0.2);
        }

        // ANIMATIONS
        if (isGoodPosture) {
            // ELEGANT BOUNCE
            bodyRef.current.position.y = Math.sin(time * 4) * 0.05 + 0.1; // Higher base position
            // Wings Wide (Greeting)
            if (leftWingRef.current) leftWingRef.current.rotation.z = -0.8 + Math.sin(time * 6) * 0.1;
            if (rightWingRef.current) rightWingRef.current.rotation.z = 0.8 - Math.sin(time * 6) * 0.1;
            // Happy Head Tilt
            headGroupRef.current.rotation.z = Math.sin(time * 2) * 0.05;
        } else {
            // SLUMP
            bodyRef.current.position.y = 0;
            headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, 0.3, 0.05); // droop
            // Wings Tucked
            if (leftWingRef.current) leftWingRef.current.rotation.z = -0.1;
            if (rightWingRef.current) rightWingRef.current.rotation.z = 0.1;
        }

        if (clicked) {
            bodyRef.current.rotation.y += 0.2; // Spin slower/elegant
            if (bodyRef.current.rotation.y > Math.PI * 2) {
                bodyRef.current.rotation.y = 0;
                setClicked(false);
            }
        }
    });

    const bodyColor = "#222";
    const whiteColor = "#ffffff";
    const beakColor = "#fb923c";

    return (
        <group ref={bodyRef} onClick={() => setClicked(true)}>

            {/* --- SLIM BODY (Capsule) --- */}
            {/* Replaced Sphere with Capsule for elongated look */}
            <mesh position={[0, -0.3, 0]}>
                <capsuleGeometry args={[0.55, 0.9, 4, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={1} />
            </mesh>

            {/* Slim White Belly Patch */}
            <mesh position={[0, -0.35, 0.25]} rotation={[-0.1, 0, 0]}>
                <capsuleGeometry args={[0.5, 0.85, 4, 16]} />
                <meshStandardMaterial color={whiteColor} roughness={1} />
            </mesh>

            {/* --- SNOW DUST --- */}
            <SnowDust isGoodPosture={isGoodPosture} />

            {/* --- HEAD GROUP (Big & Cute) --- */}
            <group ref={headGroupRef} position={[0, 0.6, 0]}>
                <Sphere args={[0.62, 32, 32]}>
                    <meshStandardMaterial color={bodyColor} roughness={1} />
                </Sphere>

                {/* Heart Face Mask */}
                <group position={[0, 0, 0.38]}>
                    <Sphere args={[0.32, 32, 32]} position={[-0.16, 0.06, 0]} scale={[1, 1.3, 0.6]} rotation={[0, 0, -0.15]}> <meshStandardMaterial color={whiteColor} roughness={1} /> </Sphere>
                    <Sphere args={[0.32, 32, 32]} position={[0.16, 0.06, 0]} scale={[1, 1.3, 0.6]} rotation={[0, 0, 0.15]}> <meshStandardMaterial color={whiteColor} roughness={1} /> </Sphere>
                </group>

                {/* --- FACE --- */}
                <group position={[0, -0.08, 0.62]}>
                    {/* Tiny Cute Beak */}
                    <Cone args={[0.07, 0.12, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <meshStandardMaterial color={beakColor} />
                    </Cone>

                    {/* MOUTH */}
                    {isGoodPosture ? (
                        <group position={[0, -0.04, 0]} rotation={[-0.3, 0, 0]}>
                            <mesh>
                                <circleGeometry args={[0.09, 32, 0, Math.PI]} />
                                <meshBasicMaterial color="#7f1d1d" />
                            </mesh>
                            {/* Tongue */}
                            <mesh position={[0, -0.04, 0.01]}>
                                <circleGeometry args={[0.045, 32, 0, Math.PI]} />
                                <meshBasicMaterial color="#f472b6" />
                            </mesh>
                        </group>
                    ) : (
                        <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>

                            {/* Simple line for sad mouth */}
                            <boxGeometry args={[0.02, 0.08, 0.02]} />
                            <meshBasicMaterial color="#d97706" />
                        </mesh>
                    )}
                </group>

                {/* --- EYES --- */}
                <group position={[0, 0.12, 0.65]}>
                    <Sphere args={[0.11, 32, 32]} position={[-0.2, 0, 0]} scale={[1, blinking ? 0.1 : 1.3, 0.4]}> <meshStandardMaterial color="#111" roughness={0} /> </Sphere>
                    <Sphere args={[0.11, 32, 32]} position={[0.2, 0, 0]} scale={[1, blinking ? 0.1 : 1.3, 0.4]}> <meshStandardMaterial color="#111" roughness={0} /> </Sphere>
                    <group ref={pupilsRef}>
                        <Sphere args={[0.035, 16, 16]} position={[-0.17, 0.04, 0.1]}> <meshBasicMaterial color="white" /> </Sphere>
                        <Sphere args={[0.035, 16, 16]} position={[0.23, 0.04, 0.1]}> <meshBasicMaterial color="white" /> </Sphere>
                    </group>
                </group>
            </group>

            {/* --- WINGS (Slim & Long) --- */}
            <mesh ref={leftWingRef} position={[-0.55, -0.2, 0]} rotation={[0, 0, -0.2]}>
                <Capsule args={[0.1, 0.8, 4, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={1} />
            </mesh>
            <mesh ref={rightWingRef} position={[0.55, -0.2, 0]} rotation={[0, 0, 0.2]}>
                <Capsule args={[0.1, 0.8, 4, 16]} />
                <meshStandardMaterial color={bodyColor} roughness={1} />
            </mesh>

            {/* --- FEET (Clearly Visible) --- */}
            <group position={[0, -0.9, 0.1]}>
                <mesh position={[-0.25, 0, 0]} rotation={[-0.1, -0.3, 0]}>
                    <boxGeometry args={[0.25, 0.08, 0.5]} /> {/* Waddle feet */}
                    <meshStandardMaterial color={beakColor} />
                </mesh>
                <mesh position={[0.25, 0, 0]} rotation={[-0.1, 0.3, 0]}>
                    <boxGeometry args={[0.25, 0.08, 0.5]} />
                    <meshStandardMaterial color={beakColor} />
                </mesh>
            </group>

        </group>
    );
};

// --- SCENE SETUP ---
export default function PenguinBuddy({ isGoodPosture = true, userName = "Friend" }: { isGoodPosture: boolean, userName?: string }) {
    const [message, setMessage] = useState("");
    const [showBubble, setShowBubble] = useState(false);

    useEffect(() => {
        const greeting = getSmartGreeting(userName);
        setMessage(greeting);
        setShowBubble(true);
        const timer = setTimeout(() => setShowBubble(false), 8000);
        return () => clearTimeout(timer);
    }, [userName]);

    useEffect(() => {
        if (!isGoodPosture) {
            setMessage("Oops... let's stand tall!");
            setShowBubble(true);
        } else if (showBubble && message === "Oops... let's stand tall!") {
            setMessage("Looking elegant! ✨");
            setTimeout(() => setShowBubble(false), 2000);
        }
    }, [isGoodPosture]);

    return (
        <div className="w-full h-full relative min-h-[300px] cursor-pointer group overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-blue-800 to-sky-300">
            <Canvas camera={{ position: [0, 0.8, 5.5] }} shadows>

                {/* SUNRISE LIGHTING */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 5, 5]} intensity={1.5} color="#e0c3fc" castShadow />
                <pointLight position={[-10, 5, -5]} color="#1e3a8a" intensity={0.5} />

                {/* BACKGROUND */}
                <HimalayanMountains isGoodPosture={isGoodPosture} />
                <Cloud opacity={0.5} speed={0.1} segments={30} position={[0, -1, -8]} color="#e0f2fe" />
                <Sparkles count={100} scale={10} size={3} speed={0.2} opacity={0.5} color="#fff" />

                {/* Float higher to show full body */}
                <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1} position={[0, -0.2, 0]}>
                    <Penguin isGoodPosture={isGoodPosture} />
                </Float>

                <fog attach="fog" args={['#1e1b4b', 6, 28]} />
            </Canvas>

            {/* Bubble UI */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 max-w-[85%] transition-all duration-500 transform ${showBubble ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-white/20 backdrop-blur-md border border-white/40 px-6 py-3 rounded-full shadow-lg relative">
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/20 border-b border-r border-white/40 rotate-45 transform backdrop-blur-md"></div>
                    <p className="text-sm font-bold text-white text-center tracking-wide text-shadow-sm">{message}</p>
                </div>
            </div>

            {/* Version Indicator Debug */}
            <div className="absolute bottom-2 right-4 text-[10px] text-white/20 font-mono pointer-events-none">
                v12.0 - Slim & Cute
            </div>
        </div>
    );
}
