import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cone, Plane } from '@react-three/drei';
import * as THREE from 'three';

const Penguin = ({ score }: { score: number }) => {
    const group = useRef<THREE.Group>(null);
    const isHappy = score > 80;

    useFrame((state) => {
        if (!group.current) return;
        const t = state.clock.getElapsedTime();

        if (isHappy) {
            // JUMP: Sine wave on Y
            group.current.position.y = Math.abs(Math.sin(t * 5)) * 0.5;
            group.current.position.x = 0;
            group.current.rotation.z = 0;
        } else {
            // SHIVER: Random vibration on X
            group.current.position.y = 0;
            group.current.position.x = (Math.random() - 0.5) * 0.1;
            // Slight tilt
            group.current.rotation.z = Math.sin(t * 10) * 0.1;
        }
    });

    return (
        <group ref={group}>
            {/* Body */}
            <Sphere args={[0.5, 32, 32]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="#333" />
            </Sphere>
            {/* Belly */}
            <Sphere args={[0.4, 32, 32]} position={[0, 0.45, 0.2]}>
                <meshStandardMaterial color="white" />
            </Sphere>
            {/* Beak */}
            <Cone args={[0.1, 0.2]} position={[0, 0.8, 0.4]} rotation={[1.5, 0, 0]}>
                <meshStandardMaterial color="orange" />
            </Cone>
            {/* Eyes */}
            <Sphere args={[0.05]} position={[-0.15, 0.85, 0.35]}>
                <meshStandardMaterial color="black" />
            </Sphere>
            <Sphere args={[0.05]} position={[0.15, 0.85, 0.35]}>
                <meshStandardMaterial color="black" />
            </Sphere>
        </group>
    );
};

const Scene = ({ score }: { score: number }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* Blue Fog for "Cold" Look */}
            <fog attach="fog" args={['#e0f2fe', 2, 12]} />

            <Penguin score={score} />

            {/* Floor */}
            <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#f0f9ff" />
            </Plane>
        </>
    );
};

export default function PenguinBuddy({ score }: { score: number }) {
    return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden bg-sky-50">
            <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
                <Scene score={score} />
            </Canvas>
        </div>
    );
}
