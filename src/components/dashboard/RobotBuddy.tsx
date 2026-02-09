import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Float, Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// --- THE ROBOT HEAD ---
const RobotHead = ({ isGoodPosture }: { isGoodPosture: boolean }) => {
    const headRef = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);
    const [blinking, setBlinking] = useState(false);
    const [clicked, setClicked] = useState(false);

    // 1. BLINKING LOGIC (Random intervals)
    useEffect(() => {
        const blinkLoop = setInterval(() => {
            setBlinking(true);
            setTimeout(() => setBlinking(false), 150); // Close eyes for 150ms
        }, Math.random() * 3000 + 2000); // Blink every 2-5 seconds
        return () => clearInterval(blinkLoop);
    }, []);

    // 2. GLOBAL MOUSE TRACKING
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            // Normalize to -1 to 1 based on window size
            mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            // FIX: Invert Y so Top (-1/Look Up) & Bottom (+1/Look Down)
            mouse.current.y = (event.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame(() => {
        if (!headRef.current) return;

        // Target rotation based on global mouse position
        // If sad (bad posture), look down. If happy, look at mouse.
        // We multiply by 0.8 to give it a good range of motion (approx 45 degrees)
        const targetX = isGoodPosture ? mouse.current.y * 0.8 : 0.5;
        const targetY = isGoodPosture ? mouse.current.x * 0.8 : 0;

        // Smooth Interpolation (Lerp)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, 0.1);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, 0.1);

        // 3. CLICK REACTION (Spin)
        if (clicked) {
            headRef.current.rotation.y += 0.5; // Fast spin
            if (headRef.current.rotation.y > Math.PI * 4) setClicked(false); // Stop after 2 spins
        }
    });

    // Colors
    const faceColor = "#1f2937"; // Dark screen
    const eyeColor = isGoodPosture ? "#00f0ff" : "#ff4444"; // Cyan vs Red

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <group
                ref={headRef}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                onClick={() => setClicked(true)}
            >

                {/* MAIN HEAD (Rounded White Cube - Like EVE from Wall-E) */}
                <RoundedBox args={[1.2, 1, 1]} radius={0.4} smoothness={4}>
                    <meshStandardMaterial color={hovered ? "#ffffff" : "#f3f4f6"} roughness={0.2} metalness={0.8} />
                </RoundedBox>

                {/* FACE SCREEN (Black Glass) */}
                <RoundedBox args={[0.9, 0.6, 0.1]} radius={0.1} position={[0, 0, 0.46]}>
                    <meshStandardMaterial color={faceColor} roughness={0.2} metalness={0.9} />
                </RoundedBox>

                {/* EYES (Glowing Planes) */}
                <group position={[0, 0, 0.52]}>
                    {/* Left Eye */}
                    <mesh position={[-0.25, 0, 0]} scale={[1, blinking ? 0.1 : 1, 1]}>
                        <planeGeometry args={[0.22, 0.25]} />
                        {/* If bad posture, rotate eyes to look angry/sad */}
                        <meshBasicMaterial color={eyeColor} />
                    </mesh>

                    {/* Right Eye */}
                    <mesh position={[0.25, 0, 0]} scale={[1, blinking ? 0.1 : 1, 1]}>
                        <planeGeometry args={[0.22, 0.25]} />
                        <meshBasicMaterial color={eyeColor} />
                    </mesh>
                </group>

                {/* ANTENNA (Cute bobbing stick) */}
                <group position={[0, 0.6, 0]}>
                    <Cylinder args={[0.02, 0.02, 0.3]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="#9ca3af" />
                    </Cylinder>
                    <Sphere args={[0.08, 16, 16]} position={[0, 0.15, 0]}>
                        <meshBasicMaterial color={eyeColor} />
                        <pointLight intensity={2} distance={1} color={eyeColor} />
                    </Sphere>
                </group>

                {/* EAR PIECES (Headphones) */}
                <Cylinder args={[0.2, 0.2, 0.1]} rotation={[0, 0, Math.PI / 2]} position={[-0.65, 0, 0]}>
                    <meshStandardMaterial color="#d1d5db" />
                </Cylinder>
                <Cylinder args={[0.2, 0.2, 0.1]} rotation={[0, 0, Math.PI / 2]} position={[0.65, 0, 0]}>
                    <meshStandardMaterial color="#d1d5db" />
                </Cylinder>

            </group>
        </Float>
    );
};

// --- THE MAIN SCENE ---
export default function RobotBuddy({ isGoodPosture = true }: { isGoodPosture: boolean }) {
    return (
        <div className="w-full h-full relative min-h-[300px] cursor-pointer group">
            <Canvas camera={{ position: [0, 0, 4] }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -5, 5]} color={isGoodPosture ? "blue" : "red"} intensity={1} />

                {/* Floating Particles (Data Dust) */}
                <Sparkles count={50} scale={4} size={2} speed={0.4} opacity={0.5} color={isGoodPosture ? "#bae6fd" : "#fca5a5"} />

                <RobotHead isGoodPosture={isGoodPosture} />

                {/* Soft Floor Shadow */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
                    <planeGeometry args={[10, 10]} />
                    <meshBasicMaterial color="#000000" opacity={0.2} transparent />
                </mesh>
            </Canvas>

            {/* Dynamic Speech Bubble */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-all duration-300 ${isGoodPosture ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <p className="text-xs font-bold text-white whitespace-nowrap animate-pulse">
                    ⚠️ "Straighten up, friend!"
                </p>
            </div>
        </div>
    );
}
