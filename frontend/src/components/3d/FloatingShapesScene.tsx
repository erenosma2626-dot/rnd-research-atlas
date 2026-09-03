import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ResearchNodeProps {
  position: [number, number, number];
  geometryType: 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torus' | 'tetrahedron';
  size: number;
  rotationSpeed: [number, number, number];
  floatSpeed: number;
  floatAmplitude: number;
  phase: number;
  isDark: boolean;
  onPositionUpdate?: (index: number, pos: THREE.Vector3) => void;
  index: number;
}

const ResearchNode: React.FC<ResearchNodeProps> = ({
  position,
  geometryType,
  size,
  rotationSpeed,
  floatSpeed,
  floatAmplitude,
  phase,
  isDark,
  onPositionUpdate,
  index,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialY = position[1];
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + phase;

    // Gentle tumbling rotation
    groupRef.current.rotation.x += rotationSpeed[0];
    groupRef.current.rotation.y += rotationSpeed[1];
    groupRef.current.rotation.z += rotationSpeed[2];

    // Sinusoidal floating
    const newY = initialY + Math.sin(t * floatSpeed) * floatAmplitude;
    groupRef.current.position.y = newY;
    currentPos.current.set(position[0], newY, position[2]);

    if (onPositionUpdate) {
      onPositionUpdate(index, currentPos.current);
    }
  });

  const geometry = useMemo(() => {
    switch (geometryType) {
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(size, 0);
      case 'octahedron':
        return new THREE.OctahedronGeometry(size, 0);
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(size, 0);
      case 'torus':
        return new THREE.TorusGeometry(size * 0.8, size * 0.2, 8, 16);
      case 'tetrahedron':
      default:
        return new THREE.TetrahedronGeometry(size, 0);
    }
  }, [geometryType, size]);

  const wireColor = isDark ? '#E5E7EB' : '#1F2937';
  const coreColor = isDark ? '#6366F1' : '#4F46E5';

  return (
    <group ref={groupRef} position={position}>
      {/* Outer Wireframe Cage */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          wireframe
          color={wireColor}
          transparent
          opacity={isDark ? 0.45 : 0.3}
        />
      </mesh>

      {/* Inner Translucent Scientific Core (Gives body and depth) */}
      <mesh geometry={geometry} scale={[0.65, 0.65, 0.65]}>
        <meshStandardMaterial
          color={coreColor}
          transparent
          opacity={isDark ? 0.18 : 0.12}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Vertex Anchor Point */}
      <mesh>
        <sphereGeometry args={[size * 0.12, 8, 8]} />
        <meshBasicMaterial
          color={isDark ? '#34D399' : '#059669'}
          transparent
          opacity={isDark ? 0.7 : 0.5}
        />
      </mesh>
    </group>
  );
};

// Subtle ambient vector embedding dust
const EmbeddingDust: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const points = useMemo(() => {
    const coords = [];
    for (let i = 0; i < 160; i++) {
      coords.push(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8
      );
    }
    return new Float32Array(coords);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={isDark ? '#9CA3AF' : '#4B5563'}
        transparent
        opacity={isDark ? 0.35 : 0.25}
      />
    </points>
  );
};

// Smooth mouse parallax camera rig
const CameraRig: React.FC = () => {
  useFrame(({ camera, mouse }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 1.5, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 1.2, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

interface FloatingShapesSceneProps {
  isDark?: boolean;
}

export const FloatingShapesScene: React.FC<FloatingShapesSceneProps> = ({ isDark = true }) => {
  // 14 rich, carefully distributed topological nodes
  const nodes = useMemo(() => {
    const types: ResearchNodeProps['geometryType'][] = [
      'icosahedron',
      'octahedron',
      'dodecahedron',
      'torus',
      'tetrahedron',
    ];

    const items: Array<Omit<ResearchNodeProps, 'isDark' | 'onPositionUpdate' | 'index'>> = [];
    const count = 16;

    for (let i = 0; i < count; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);

      const posX = (col - 1.5) * 2.8 + (Math.random() - 0.5) * 0.8;
      const posY = (row - 1.5) * 2.4 + (Math.random() - 0.5) * 0.8;
      const posZ = (Math.random() - 0.5) * 3;

      items.push({
        position: [posX, posY, posZ],
        geometryType: types[i % types.length],
        size: 0.5 + Math.random() * 0.4,
        rotationSpeed: [
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.007,
        ],
        floatSpeed: 0.5 + Math.random() * 0.6,
        floatAmplitude: 0.16 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
      });
    }

    return items;
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden select-none pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={isDark ? 0.7 : 0.9} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#6366f1" />
        <CameraRig />
        <EmbeddingDust isDark={isDark} />
        {nodes.map((node, idx) => (
          <ResearchNode
            key={idx}
            index={idx}
            {...node}
            isDark={isDark}
          />
        ))}
      </Canvas>
    </div>
  );
};
