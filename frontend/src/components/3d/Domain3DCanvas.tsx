import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Line, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

export type DomainType = 'math' | 'ml' | 'ai' | 'data';

// =========================================================================
// 1. Matematik Section'ı — 4 Operatör Birlikte (Tek Kompozisyon)
// =========================================================================
function OperatorBar({
  position,
  rotation = [0, 0, 0],
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.5, 0.13, 0.13]} />
      <meshStandardMaterial color={color} transparent opacity={0.12} />
      <Edges color={color} />
    </mesh>
  );
}

function PlusMini({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <OperatorBar position={[0, 0, 0]} color={color} />
      <OperatorBar position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={color} />
    </group>
  );
}

function TimesMini({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <OperatorBar position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]} color={color} />
      <OperatorBar position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]} color={color} />
    </group>
  );
}

function MinusMini({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <OperatorBar position={[0, 0, 0]} color={color} />
    </group>
  );
}

function DivideMini({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <OperatorBar position={[0, 0, 0]} color={color} />
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

export function MathOperatorsCluster({ isDark = true }: { isDark?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const color = isDark ? '#ffffff' : '#0a0a0a';
  const radius = 0.9;

  return (
    <group ref={groupRef}>
      <PlusMini position={[0, radius, 0]} color={color} />
      <TimesMini position={[radius, 0, 0]} color={color} />
      <MinusMini position={[0, -radius, 0]} color={color} />
      <DivideMini position={[-radius, 0, 0]} color={color} />
      {/* Merkez bağlantı halkası - dört sembolü görsel olarak bir küme yapar */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 8, 40]} />
        <meshStandardMaterial color={color} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 2. Makine Öğrenmesi — Detaylı Karar Ağacı (Tek Model)
// =========================================================================
export function DecisionTreeShape({ isDark = true }: { isDark?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  // 4 seviye: kök(1) -> 2 -> 4 -> 8 yaprak = toplam 15 düğüm
  const nodes = useMemo(() => {
    const list: Array<{
      x: number;
      y: number;
      z: number;
      level: number;
      isLeaf: boolean;
    }> = [];
    const levelY = [0.9, 0.35, -0.2, -0.75];
    const levelCounts = [1, 2, 4, 8];
    levelCounts.forEach((count, level) => {
      for (let i = 0; i < count; i++) {
        const spread = 0.35 * (level + 1);
        const x = count === 1 ? 0 : (i - (count - 1) / 2) * (spread / count) * 2.2;
        list.push({
          x,
          y: levelY[level],
          z: (Math.random() - 0.5) * 0.15,
          level,
          isLeaf: level === levelCounts.length - 1,
        });
      }
    });
    return list;
  }, []);

  const edges = useMemo(() => {
    const result: Array<{
      parent: { x: number; y: number; z: number };
      child: { x: number; y: number; z: number };
    }> = [];
    let start = 0;
    const levelCounts = [1, 2, 4, 8];
    for (let l = 0; l < levelCounts.length - 1; l++) {
      const parents = nodes.slice(start, start + levelCounts[l]);
      const childStart = start + levelCounts[l];
      const children = nodes.slice(childStart, childStart + levelCounts[l + 1]);
      parents.forEach((parent, pi) => {
        const childrenPerParent = children.length / parents.length;
        for (let c = 0; c < childrenPerParent; c++) {
          const child = children[pi * childrenPerParent + c];
          if (child) result.push({ parent, child });
        }
      });
      start = childStart;
    }
    return result;
  }, [nodes]);

  const color = isDark ? '#ffffff' : '#0a0a0a';

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[n.isLeaf ? 0.05 : 0.09 - n.level * 0.012, 14, 14]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={n.isLeaf ? 0.5 : 0.85 - n.level * 0.1}
          />
        </mesh>
      ))}
      {edges.map(({ parent, child }, i) => (
        <QuadraticBezierLine
          key={i}
          start={[parent.x, parent.y, parent.z]}
          end={[child.x, child.y, child.z]}
          mid={[
            (parent.x + child.x) / 2,
            (parent.y + child.y) / 2 - 0.08,
            (parent.z + child.z) / 2,
          ]}
          color={color}
          transparent
          opacity={0.25}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

// =========================================================================
// 3. Yapay Zeka — Detaylı Düğüm Kümesi (Tek Model)
// =========================================================================
export function AINodeCluster({ isDark = true }: { isDark?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  const NODE_COUNT = 48;

  const nodePositions = useMemo(() => {
    const positions: Array<{ x: number; y: number; z: number; size: number }> = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      // Merkeze yakın küçük bir jitter ekleyip tam küresel değil, organik görünüm
      const r = 0.55 + Math.sin(i * 12.9) * 0.08;
      positions.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: 0.03 + Math.abs(Math.sin(i * 7.3)) * 0.03,
      });
    }
    return positions;
  }, []);

  const connections = useMemo(() => {
    const lines: Array<{
      a: { x: number; y: number; z: number };
      b: { x: number; y: number; z: number };
    }> = [];
    nodePositions.forEach((a, i) => {
      const nearest = nodePositions
        .map((b, j) => ({ j, dist: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) }))
        .filter((d) => d.j !== i)
        .sort((p, q) => p.dist - q.dist)
        .slice(0, 3); // en yakın 3 komşuya bağlan
      nearest.forEach(({ j }) => {
        if (j > i) {
          // her bağlantıyı bir kere çiz
          lines.push({ a, b: nodePositions[j] });
        }
      });
    });
    return lines;
  }, [nodePositions]);

  const color = isDark ? '#ffffff' : '#0a0a0a';

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[pos.size, 10, 10]} />
          <meshStandardMaterial color={color} transparent opacity={0.75} />
        </mesh>
      ))}
      {connections.map(({ a, b }, i) => (
        <QuadraticBezierLine
          key={i}
          start={[a.x, a.y, a.z]}
          end={[b.x, b.y, b.z]}
          mid={[(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2 + 0.05]}
          color={color}
          transparent
          opacity={0.12}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

// =========================================================================
// 4. Veri Bilimi — Detaylı Scatter Plot (Tek Model)
// =========================================================================
export function ScatterPlotShape({ isDark = true }: { isDark?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
      groupRef.current.rotation.x += delta * 0.04;
    }
  });

  const points = useMemo(() => {
    const list: Array<{ x: number; y: number; z: number }> = [];
    // Küme 1 - merkezi (-0.35, -0.2, 0) civarı
    for (let i = 0; i < 35; i++) {
      list.push({
        x: -0.35 + (Math.random() - 0.5) * 0.55,
        y: -0.2 + (Math.random() - 0.5) * 0.55,
        z: (Math.random() - 0.5) * 0.8,
      });
    }
    // Küme 2 - merkezi (0.4, 0.25, 0) civarı
    for (let i = 0; i < 35; i++) {
      list.push({
        x: 0.4 + (Math.random() - 0.5) * 0.5,
        y: 0.25 + (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.8,
      });
    }
    // Az sayıda "aykırı değer" (outlier) - dağınık
    for (let i = 0; i < 8; i++) {
      list.push({
        x: (Math.random() - 0.5) * 1.6,
        y: (Math.random() - 0.5) * 1.6,
        z: (Math.random() - 0.5) * 1.2,
      });
    }
    return list;
  }, []);

  const color = isDark ? '#ffffff' : '#0a0a0a';

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.35 + ((p.z + 0.8) / 1.6) * 0.45}
          />
        </mesh>
      ))}
      {/* Eksenler */}
      <Line
        points={[
          [-0.9, 0, 0],
          [0.9, 0, 0],
        ]}
        color={color}
        transparent
        opacity={0.15}
        lineWidth={1}
      />
      <Line
        points={[
          [0, -0.9, 0],
          [0, 0.9, 0],
        ]}
        color={color}
        transparent
        opacity={0.15}
        lineWidth={1}
      />
      <Line
        points={[
          [0, 0, -0.9],
          [0, 0, 0.9],
        ]}
        color={color}
        transparent
        opacity={0.15}
        lineWidth={1}
      />
    </group>
  );
}

// =========================================================================
// Ana Domain3DCanvas Bileşeni — Her Section için Tek, Sabit Model
// =========================================================================
interface Domain3DCanvasProps {
  domain: DomainType;
  isDark?: boolean;
  size?: number;
}

export const Domain3DCanvas: React.FC<Domain3DCanvasProps> = ({
  domain,
  isDark = true,
  size = 320,
}) => {
  return (
    <div
      className="relative flex items-center justify-center select-none pointer-events-none"
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        {domain === 'math' && <MathOperatorsCluster isDark={isDark} />}
        {domain === 'ml' && <DecisionTreeShape isDark={isDark} />}
        {domain === 'ai' && <AINodeCluster isDark={isDark} />}
        {domain === 'data' && <ScatterPlotShape isDark={isDark} />}
      </Canvas>
    </div>
  );
};
