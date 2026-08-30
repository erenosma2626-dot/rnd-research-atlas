import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Single wireframe shape with independent floating and rotation physics
interface SingleShapeProps {
  position: [number, number, number];
  geometryType: 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torus' | 'tetrahedron' | 'ring' | 'sphere' | 'box';
  size: number;
  rotationSpeed: [number, number, number];
  floatSpeed: number;
  floatAmplitude: number;
  phase: number;
  isDark: boolean;
}

const SingleShape: React.FC<SingleShapeProps> = ({
  position,
  geometryType,
  size,
  rotationSpeed,
  floatSpeed,
  floatAmplitude,
  phase,
  isDark,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() + phase;

    // Independent tumbling & rotation
    meshRef.current.rotation.x += rotationSpeed[0];
    meshRef.current.rotation.y += rotationSpeed[1];
    meshRef.current.rotation.z += rotationSpeed[2];

    // Smooth sinusoidal floating
    meshRef.current.position.y = initialY + Math.sin(t * floatSpeed) * floatAmplitude;
  });

  const geometry = useMemo(() => {
    switch (geometryType) {
      case 'icosahedron':
        return <icosahedronGeometry args={[size, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[size, 0]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[size, 0]} />;
      case 'torus':
        return <torusGeometry args={[size * 0.8, size * 0.25, 8, 16]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[size, 0]} />;
      case 'ring':
        return <ringGeometry args={[size * 0.5, size, 12]} />;
      case 'sphere':
        return <sphereGeometry args={[size, 10, 10]} />;
      case 'box':
      default:
        return <boxGeometry args={[size, size, size]} />;
    }
  }, [geometryType, size]);

  const lineColor = isDark ? '#FFFFFF' : '#0A0A0A';

  return (
    <mesh ref={meshRef} position={position}>
      {geometry}
      <meshBasicMaterial
        wireframe
        color={lineColor}
        transparent
        opacity={isDark ? 0.35 : 0.28}
      />
    </mesh>
  );
};

// Interactive camera controller for gentle mouse parallax
const CameraRig: React.FC = () => {
  useFrame(({ camera, mouse }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 1.2, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 1.2, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

interface FloatingShapesSceneProps {
  isDark?: boolean;
}

export const FloatingShapesScene: React.FC<FloatingShapesSceneProps> = ({ isDark = true }) => {
  // Generate 24 distributed wireframe academic & geometric shapes
  const shapes = useMemo(() => {
    const types: SingleShapeProps['geometryType'][] = [
      'icosahedron',
      'octahedron',
      'dodecahedron',
      'torus',
      'tetrahedron',
      'ring',
      'sphere',
      'box',
    ];

    const items: Array<Omit<SingleShapeProps, 'isDark'>> = [];
    const count = 24;

    for (let i = 0; i < count; i++) {
      // Stratified grid distribution with random jitter
      const row = Math.floor(i / 6);
      const col = i % 6;

      const posX = (col - 2.5) * 2.6 + (Math.random() - 0.5) * 0.9;
      const posY = (row - 1.5) * 2.2 + (Math.random() - 0.5) * 0.8;
      const posZ = (Math.random() - 0.5) * 3.5;

      const geomType = types[i % types.length];
      const size = 0.45 + Math.random() * 0.45;

      items.push({
        position: [posX, posY, posZ],
        geometryType: geomType,
        size,
        rotationSpeed: [
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.01,
        ],
        floatSpeed: 0.6 + Math.random() * 0.8,
        floatAmplitude: 0.18 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
      });
    }

    return items;
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden select-none pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1} />
        <CameraRig />
        {shapes.map((shape, idx) => (
          <SingleShape key={idx} {...shape} isDark={isDark} />
        ))}
      </Canvas>
    </div>
  );
};
