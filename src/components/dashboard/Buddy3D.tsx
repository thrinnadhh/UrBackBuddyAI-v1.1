import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

// The 3D Object
const Blob = ({ isGoodPosture }: { isGoodPosture: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Animate the "Breathing" size
        if (meshRef.current) {
            // If Good: Slow, calm wobble. If Bad: Fast, jagged wobble.
            const speed = isGoodPosture ? 1 : 4;
            meshRef.current.rotation.x = time * 0.2 * speed;
            meshRef.current.rotation.y = time * 0.3 * speed;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Sphere args={[1, 100, 200]} scale={2.2} ref={meshRef}>
                <MeshDistortMaterial
                    color={isGoodPosture ? "#10b981" : "#ef4444"} // Green vs Red
                    attach="material"
                    distort={isGoodPosture ? 0.3 : 0.8} // Smooth vs Spiky
                    speed={isGoodPosture ? 1.5 : 5} // Calm vs Panic
                    roughness={0.2}
                    metalness={0.1}
                />
            </Sphere>
        </Float>
    );
};

// The Scene Container
export default function Buddy3D({ isGoodPosture }: { isGoodPosture: boolean }) {
    return (
        <div className="w-full h-64 relative">
            <Canvas camera={{ position: [0, 0, 5] }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color={isGoodPosture ? "cyan" : "orange"} intensity={2} />

                {/* The Buddy */}
                <Blob isGoodPosture={isGoodPosture} />
            </Canvas>

            {/* Overlay Text */}
            <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
                <span className={`text-xs font-mono uppercase tracking-widest ${isGoodPosture ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isGoodPosture ? "Buddy is Happy" : "Buddy is Stressed!"}
                </span>
            </div>
        </div>
    );
}
