import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow = ({ count = 1000 }) => {
    const mesh = useRef<THREE.Points>(null);

    // Generate random positions
    const particles = useMemo(() => {
        const temp = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            temp[i * 3] = (Math.random() - 0.5) * 20;     // x
            temp[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
            temp[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
        }
        return temp;
    }, [count]);

    useFrame((_, delta) => {
        if (!mesh.current) return;
        // Simple falling effect
        mesh.current.rotation.y += delta * 0.05;
        // We could manually update positions buffer for true "falling", 
        // but rotation gives a nice swirling snow storm effect which is cheaper.
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="white"
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    );
};

const Robot = ({ score }: { score: number }) => {
    const group = useRef<THREE.Group>(null);
    const head = useRef<THREE.Mesh>(null);
    const isGood = score > 80;

    useFrame((state) => {
        if (!group.current || !head.current) return;
        const t = state.clock.getElapsedTime();

        if (isGood) {
            // FLOATING: Sine wave
            group.current.position.y = Math.sin(t * 2) * 0.2;
            group.current.position.x = 0;
            group.current.rotation.z = 0;

            // Head Bob
            head.current.position.y = 1.2 + Math.sin(t * 4) * 0.05;
        } else {
            // SLUMP & SHAKE
            group.current.position.y = -0.5; // Slump down
            // Random shake
            group.current.position.x = (Math.random() - 0.5) * 0.1;
            group.current.rotation.z = (Math.random() - 0.5) * 0.1;

            // Head drooping
            head.current.position.y = 1.0;
        }
    });

    const eyeColor = isGood ? "#00ff00" : "#ff0000";

    return (
        <group ref={group}>
            {/* TORSO */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1.5, 0.6]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* HEAD */}
            <mesh ref={head} position={[0, 1.2, 0]}>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />

                {/* EYES */}
                <mesh position={[-0.2, 0.1, 0.41]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} />
                </mesh>
                <mesh position={[0.2, 0.1, 0.41]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} />
                </mesh>
            </mesh>

            {/* ARMS */}
            <mesh position={[-0.6, 0.2, 0]}>
                <boxGeometry args={[0.2, 1, 0.2]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.6, 0.2, 0]}>
                <boxGeometry args={[0.2, 1, 0.2]} />
                <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
};

export default function RobotBuddy({ score }: { score: number }) {
    return (
        <group>
            {/* LIGHTING */}
            <ambientLight intensity={0.3} />
            <spotLight position={[5, 10, 5]} intensity={1.0} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00ffff" />

            {/* CHARACTERS & FX */}
            <Robot score={score} />
            <Snow count={1000} />
        </group>
    );
}
