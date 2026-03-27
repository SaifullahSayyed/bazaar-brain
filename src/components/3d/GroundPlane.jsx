import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';


const generateGroundTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Base dark
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Strong radial glow — blue in center, cyan at midpoint, fading out
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  gradient.addColorStop(0,   'rgba(0, 200, 255, 0.35)');
  gradient.addColorStop(0.3, 'rgba(0, 102, 255, 0.28)');
  gradient.addColorStop(0.7, 'rgba(0, 60, 180, 0.12)');
  gradient.addColorStop(1,   'rgba(0, 0, 60, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Inner bright hotspot
  const hotspot = ctx.createRadialGradient(512, 512, 0, 512, 512, 120);
  hotspot.addColorStop(0, 'rgba(0, 255, 255, 0.18)');
  hotspot.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = hotspot;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Hexagonal grid — brighter lines
  ctx.strokeStyle = 'rgba(0, 100, 200, 0.55)';
  ctx.lineWidth = 2.5;
  
  const drawHex = (x, y, radius) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  };

  // Concentric hexes — more rings, brighter inner ones
  for(let r = 30; r < 600; r += 38) {
    ctx.strokeStyle = `rgba(0, ${Math.floor(80 + 120 * (1 - r/600))}, 220, ${(0.6 - r/1200).toFixed(2)})`;
    drawHex(512, 512, r);
  }
  
  // Radial spoke lines
  ctx.strokeStyle = 'rgba(0, 140, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(512, 512);
    ctx.lineTo(512 + Math.cos(angle) * 512, 512 + Math.sin(angle) * 512);
    ctx.stroke();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

const CitySilhouette = React.memo(() => {
  const count = 24;
  const meshRef = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Radius between 9 and 11
      const rad = 24 + (i % 3) * 1.2;
      
      const x = Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;
      
      // index * 0.7 mod to get pseudo random heights 0.3 - 1.2
      let h = ((i * 0.7) % 0.9) + 0.3;
      
      dummy.position.set(x, h/2 - 0.1, z);
      dummy.scale.set(0.6 + (i%2)*0.4, h, 0.6 + (i%3)*0.2);
      dummy.rotation.y = angle + Math.PI/2;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0A1628" emissive="#0066FF" emissiveIntensity={0.6} metalness={0.95} roughness={0.05} />
    </instancedMesh>
  );
});

const HolographicSweep = React.memo(() => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), 3000);
    }, 12000); // Every 12 seconds
    return () => clearInterval(interval);
  }, []);

  const props = useSpring({
    y: active ? 15 : -8,
    config: { duration: 3000 },
    immediate: !active
  });

  return (
    <animated.mesh position-y={props.y} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial color="#00FF88" transparent opacity={active ? 0.04 : 0} side={THREE.DoubleSide} depthWrite={false} />
    </animated.mesh>
  );
});

// Animated pulse ring expanding from center
const GroundPulseRings = React.memo(() => {
  const rings = [useRef(), useRef(), useRef()];
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    rings.forEach((r, i) => {
      if (!r.current) return;
      const phase = (t * 0.4 + i * 0.33) % 1;
      const s = 2 + phase * 40;
      r.current.scale.set(s, 1, s);
      r.current.material.opacity = (1 - phase) * 0.25;
    });
  });
  return (
    <group position={[0, 0.02, 0]}>
      {rings.map((r, i) => (
        <mesh key={i} ref={r} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.06, 64]} />
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
});

const GroundPlane = React.memo(() => {
  const groundTex = useMemo(() => generateGroundTexture(), []);

  return (
    <group>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[32, 64]} />
        <meshStandardMaterial map={groundTex} transparent opacity={0.92} color="#ffffff" />
      </mesh>
      
      <CitySilhouette />
      <HolographicSweep />
      <GroundPulseRings />
    </group>
  );
});

export default GroundPlane;
