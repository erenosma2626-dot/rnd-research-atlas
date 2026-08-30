import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type DomainType = 'math' | 'ml' | 'ai' | 'data';

// 1. Matematik: Nested Dodecahedron & Coordinate Rings
const MathMesh: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x += delta * 0.3;
    groupRef.current.rotation.y += delta * 0.45;
  });

  const color = isDark ? '#FFFFFF' : '#0A0A0A';

  return (
    <group ref={groupRef}>
      {/* Outer Dodecahedron */}
      <mesh>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.4} />
      </mesh>
      {/* Inner Octahedron */}
      <mesh>
        <octahedronGeometry args={[0.9, 0]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.65} />
      </mesh>
      {/* Surrounding Ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.9, 0.03, 12, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// 2. Makine Öğrenmesi: Connected Neural Layer Nodes
const MLMesh: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.35;
    groupRef.current.rotation.z += delta * 0.2;
  });

  const color = isDark ? '#FFFFFF' : '#0A0A0A';

  return (
    <group ref={groupRef}>
      {/* Multi-layered Connected Icosahedron Lattice */}
      <mesh>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.45} />
      </mesh>
      {/* Core Node */}
      <mesh>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.8} />
      </mesh>
      {/* Surrounding Orbiting Rings */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.8, 0.03, 8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

// 3. Yapay Zeka: Geodesic Brain Cluster with Orbiting Rings
const AIMesh: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x += delta * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.5;
    }
  });

  const color = isDark ? '#FFFFFF' : '#0A0A0A';

  return (
    <group ref={groupRef}>
      {/* High-density Sphere */}
      <mesh>
        <sphereGeometry args={[1.3, 14, 14]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.35} />
      </mesh>
      {/* Inner Geodesic Core */}
      <mesh>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.65} />
      </mesh>
      {/* Dynamic Halo Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.9, 0.04, 10, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

// 4. Veri Bilimi: 3D Multi-Bar Lattice Grid & Hypercube
const DataMesh: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.35;
    groupRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.2 + 0.3;
  });

  const color = isDark ? '#FFFFFF' : '#0A0A0A';

  return (
    <group ref={groupRef}>
      {/* Central Hyper-Box */}
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.5} />
      </mesh>
      {/* Outer Cage */}
      <mesh>
        <boxGeometry args={[1.9, 1.9, 1.9]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.25} />
      </mesh>
      {/* Base Grid Plane */}
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 2.2, 4, 4]} />
        <meshBasicMaterial wireframe color={color} transparent opacity={0.35} />
      </mesh>
    </group>
  );
};

interface Domain3DCanvasProps {
  domain: DomainType;
  isDark?: boolean;
  size?: number;
}

export const Domain3DCanvas: React.FC<Domain3DCanvasProps> = ({
  domain,
  isDark = true,
  size = 360,
}) => {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1} />
        {domain === 'math' && <MathMesh isDark={isDark} />}
        {domain === 'ml' && <MLMesh isDark={isDark} />}
        {domain === 'ai' && <AIMesh isDark={isDark} />}
        {domain === 'data' && <DataMesh isDark={isDark} />}
      </Canvas>
    </div>
  );
};
