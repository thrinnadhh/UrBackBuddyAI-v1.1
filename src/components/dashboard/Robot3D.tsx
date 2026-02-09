import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';

const RobotModel = ({ isGood }: { isGood: boolean }) => {
    const group = useRef<THREE.Group>(null);
    const head = useRef<THREE.Mesh>(null);

    // Animation Loop
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (group.current && head.current) {
            // Hovering Motion (Sine Wave)
            group.current.position.y = Math.sin(time) * 0.2;

            // Posture Reaction
            if (isGood) {
                // Happy: Smooth bobbing
                head.current.rotation.y = Math.sin(time * 0.5) * 0.2;
            } else {
                // Bad Posture: Shaking/Glitching
                group.current.position.x = (Math.random() - 0.5) * 0.1;
                head.current.rotation.y = (Math.random() - 0.5) * 0.2;
            }
        }
    });

    const eyeColor = isGood ? "#4ade80" : "#ef4444"; // Green vs Red

    return (
        <group ref={group} position={[0, -0.5, 0]}>
            {/* --- ROBOT HEAD --- */}
            <mesh ref={head} position={[0, 1.6, 0]}>
                {/* Main Head Shape (Rounded Cube/Sphere hybrid) */}
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.2} />

                {/* Eyes (Glowing Spheres) */}
                <mesh position={[-0.3, 0.1, 0.75]}>
                    <sphereGeometry args={[0.15, 32, 32]} />
                    <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} />
                </mesh>
                <mesh position={[0.3, 0.1, 0.75]}>
                    <sphereGeometry args={[0.15, 32, 32]} />
                    <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} />
                </mesh>

                {/* Antenna */}
                <mesh position={[0, 0.9, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0, 1.15, 0]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={isGood ? 1 : 5} />
                </mesh>
            </mesh>

            {/* --- NECK --- */}
            <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {/* --- BODY --- */}
            <mesh position={[0, 0, 0]}>
                {/* Rounded Body */}
                <sphereGeometry args={[0.9, 32, 32]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.4} />

                {/* Chest Screen */}
                <mesh position={[0, 0, 0.85]}>
                    <planeGeometry args={[0.8, 0.5]} />
                    <meshBasicMaterial color="black" />
                </mesh>
            </mesh>

            {/* --- ARMS (Floating) --- */}
            <mesh position={[-1.2, 0.2, 0]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            <mesh position={[1.2, 0.2, 0]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
        </group>
    );
};

export const RobotBuddy = ({ score, isGood }: { score: number, isGood: boolean }) => {
    return (
        <div className="w-full h-full relative">
            <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color={isGood ? "cyan" : "orange"} />

                {/* The Robot */}
                <RobotModel isGood={isGood} />

                {/* Environment (Simple Floor) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                </mesh>
            </Canvas>
        </div>
    );
};
