import React, { useMemo, useRef, useEffect, useState } from 'react';
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
  
  // Radial glow
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  gradient.addColorStop(0, 'rgba(0, 102, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Hexagonal grid
  ctx.strokeStyle = 'rgba(15, 32, 64, 0.6)'; // equivalent to #0F2040 @ 0.6 opacity
  ctx.lineWidth = 2;
  
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

  // Concentric hexes
  for(let r=50; r<600; r+=50) {
    drawHex(512, 512, r);
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
      const rad = 9 + (i % 3) * 0.66;
      
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
      <meshStandardMaterial color="#0A1628" emissive="#0066FF" emissiveIntensity={0.2} metalness={0.9} roughness={0.1} />
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
      <planeGeometry args={[28, 28]} />
      <meshBasicMaterial color="#00FF88" transparent opacity={active ? 0.04 : 0} side={THREE.DoubleSide} depthWrite={false} />
    </animated.mesh>
  );
});

const GroundPlane = React.memo(() => {
  const groundTex = useMemo(() => generateGroundTexture(), []);

  return (
    <group>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial map={groundTex} transparent opacity={0.85} color="#ffffff" />
      </mesh>
      
      <CitySilhouette />
      <HolographicSweep />
    </group>
  );
});

export default GroundPlane;
