import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import HexSectorNode from './HexSectorNode';
import MarketEdges from './MarketEdges';
import GroundPlane from './GroundPlane';

const HEX_POSITIONS = [
  { id:'S1', pos:[0, 0, 0] },       // Banking — center
  { id:'S2', pos:[9, 0, 0] },       // IT — right
  { id:'S3', pos:[4.5, 0, -7.8] },  // FMCG — upper right
  { id:'S4', pos:[-4.5, 0, -7.8] }, // Pharma — upper left
  { id:'S5', pos:[-9, 0, 0] },      // Energy — left
  { id:'S6', pos:[-4.5, 0, 7.8] },  // Auto — lower left
  { id:'S7', pos:[4.5, 0, 7.8] },   // Metals — lower right
  { id:'S8', pos:[0, 0, 15.6] }     // Realty — far bottom
];

// ── Pulsing energy orb at the scene center ─────────────────────────────────
const EnergyOrb = () => {
  const coreRef = useRef();
  const outerRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + 0.12 * Math.sin(t * 2.2);
    if (coreRef.current)  coreRef.current.scale.setScalar(pulse);
    if (outerRef.current) outerRef.current.scale.setScalar(1 + 0.06 * Math.sin(t * 1.6 + 1));
    if (ring1Ref.current) { ring1Ref.current.rotation.x = t * 0.8; ring1Ref.current.rotation.z = t * 0.5; }
    if (ring2Ref.current) { ring2Ref.current.rotation.y = -t * 0.6; ring2Ref.current.rotation.z = t * 0.3; }
  });

  return (
    <group position={[0, 2.5, 0]}>
      {/* Soft outer atmosphere */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#0044CC" emissive="#0044CC" emissiveIntensity={0.6} transparent opacity={0.18} />
      </mesh>
      {/* Core glow sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={4.0} transparent opacity={0.95} />
      </mesh>
      {/* Orbit ring 1 — cyan */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.55, 0.018, 12, 80]} />
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={3.0} />
      </mesh>
      {/* Orbit ring 2 — purple */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.75, 0.014, 12, 80]} />
        <meshStandardMaterial color="#8B00FF" emissive="#8B00FF" emissiveIntensity={3.0} />
      </mesh>
      {/* Point light from orb */}
      <pointLight color="#00FFFF" intensity={6} distance={10} decay={2} />
    </group>
  );
};

// ── Animated outer ring of particles around the hex cluster ───────────────
const OrbitParticles = () => {
  const groupRef = useRef();
  const COUNT = 48;
  const particles = React.useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      angle: (i / COUNT) * Math.PI * 2,
      radius: 7.5 + Math.sin(i * 0.8) * 0.6,
      yOffset: Math.sin(i * 1.3) * 0.5,
      speed: 0.0008 + (i % 5) * 0.0003,
      size: 0.04 + (i % 3) * 0.025,
    })), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i];
      const a = p.angle + t * p.speed * 60; // full scene rotation
      mesh.position.set(
        Math.cos(a) * p.radius,
        p.yOffset + 0.3 * Math.sin(t * 0.6 + i),
        Math.sin(a) * p.radius
      );
      mesh.scale.setScalar(1 + 0.3 * Math.sin(t * 2 + i));
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[p.size, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#00FFFF' : i % 3 === 1 ? '#0066FF' : '#8B00FF'}
            emissive={i % 3 === 0 ? '#00FFFF' : i % 3 === 1 ? '#0066FF' : '#8B00FF'}
            emissiveIntensity={2.5}
            transparent opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
};

const MarketNerveCenter = React.memo(({ sectors, auditResult, onSectorClick }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  
  const handleInteract = useCallback(() => setAutoRotate(false), []);
  const handleEndInteract = useCallback(() => {
    setTimeout(() => setAutoRotate(true), 3000);
  }, []);

  const violatingSectorId = auditResult?.violatingSectorId || null;

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        shadows 
        gl={{ antialias: true, alpha: true, pixelRatio: Math.min(window.devicePixelRatio, 2) }}
      >
        <PerspectiveCamera makeDefault fov={52} position={[0, 9, 13]} near={0.1} far={1000} />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2.2} 
          autoRotate={autoRotate} 
          autoRotateSpeed={0.6}
          onStart={handleInteract}
          onEnd={handleEndInteract}
        />

        {/* Lighting — rich multi-colour setup */}
        <ambientLight intensity={0.06} />
        <pointLight position={[0, 12, 0]}   color="#0055FF" intensity={4.0} distance={30} decay={2} />
        <pointLight position={[10, 6, 10]}  color="#00FF88" intensity={3.0} distance={25} decay={2} />
        <pointLight position={[-10, 6, -10]} color="#8B00FF" intensity={2.5} distance={25} decay={2} />
        <pointLight position={[0, 2, -12]}  color="#00FFFF" intensity={2.0} distance={20} decay={2} />
        <directionalLight position={[0, 20, 10]} intensity={0.4} castShadow />

        <group position={[0, -2, 0]}>
          {HEX_POSITIONS.map((hex) => {
            const sectorData = sectors?.find(s => s.id === hex.id) || null;
            return (
              <HexSectorNode 
                key={hex.id} 
                position={hex.pos} 
                sector={sectorData} 
                isViolating={violatingSectorId === hex.id} 
                onClick={onSectorClick} 
              />
            );
          })}
          
          <MarketEdges sectors={sectors} positions={HEX_POSITIONS} auditResult={auditResult} />
          <GroundPlane />
          <EnergyOrb />
          <OrbitParticles />
        </group>

        {/* Post-processing */}
        <EffectComposer>
          <Bloom intensity={2.2} luminanceThreshold={0.15} luminanceSmoothing={0.8} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
});

export default MarketNerveCenter;


