import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';

// A) STAR FIELD
const StarField = () => {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
       // Random position within a sphere roughly radius 200, depth -300 to -20
       const r = 200 * Math.cbrt(Math.random());
       const theta = Math.random() * 2 * Math.PI;
       const phi = Math.acos(2 * Math.random() - 1);
       const x = r * Math.sin(phi) * Math.cos(theta);
       const y = r * Math.sin(phi) * Math.sin(theta);
       const z = -20 - (Math.random() * 280);
       positions[i * 3] = x;
       positions[i * 3 + 1] = y;
       positions[i * 3 + 2] = z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00005;
    }
  });

  return (
    <points ref={pointsRef} geometry={particles}>
      <pointsMaterial size={0.8} color="#ffffff" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

// B) HOLOGRAPHIC MARKET GRID FLOOR
const MarketGrid = () => {
  const gridRef = useRef();
  
  useFrame(() => {
    if (gridRef.current) {
      // Simulate moving forward by translating Z and snapping back (grid cell size = 200/50 = 4)
      gridRef.current.position.z += 0.05;
      if (gridRef.current.position.z > 4) {
        gridRef.current.position.z -= 4;
      }
    }
  });

  return (
    <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <planeGeometry args={[200, 200, 50, 50]} />
      <meshBasicMaterial wireframe color="#0066FF" transparent opacity={0.12} />
    </mesh>
  );
};

// C) FLOATING DATA PARTICLES
const FloatingParticles = () => {
  const meshRef = useRef();
  const count = 120;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particleData = useMemo(() => {
    return new Array(count).fill().map(() => ({
      x: (Math.random() - 0.5) * 40,
      y: -8 + Math.random() * 20,
      z: (Math.random() - 0.5) * 40,
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      rotSpeedX: (Math.random() - 0.5) * 0.05,
      rotSpeedY: (Math.random() - 0.5) * 0.05,
      speed: 0.01 + Math.random() * 0.02
    }));
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      const pd = particleData[i];
      pd.y += 0.03; // Drift up
      if (pd.y > 12) pd.y = -8;
      
      pd.rotX += pd.rotSpeedX;
      pd.rotY += pd.rotSpeedY;
      
      dummy.position.set(pd.x, pd.y, pd.z);
      dummy.rotation.set(pd.rotX, pd.rotY, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <icosahedronGeometry args={[0.06, 0]} />
      <meshBasicMaterial color="#00FF88" />
    </instancedMesh>
  );
};

// D) SECTOR LIGHT PILLARS
const SectorPillars = ({ sectors }) => {
  const baseColor = new THREE.Color('#0066FF');
  const bullColor = new THREE.Color('#00FF88');
  const bearColor = new THREE.Color('#FF2222');
  const neutralColor = new THREE.Color('#00FFFF');

  const pillars = Array(8).fill().map((_, i) => {
    const obj = sectors && sectors[i] ? sectors[i] : null;
    const tension = obj ? obj.tension : 0;
    const signal = obj ? obj.signal : 'NEUTRAL';
    
    const angle = (i / 8) * Math.PI * 2;
    const radius = 7;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    let targetColor = new THREE.Color();
    if (signal === 'BULLISH') targetColor.lerpColors(baseColor, bullColor, tension);
    else if (signal === 'BEARISH') targetColor.lerpColors(baseColor, bearColor, tension);
    else targetColor.copy(neutralColor);

    const emissiveInt = 0.5 + (tension * 2);
    const op = 0.3 + (tension * 0.4);

    return (
      <mesh key={`pillar-${i}`} position={[x, 0, z]}>
        <cylinderGeometry args={[0.08, 0.08, 20, 8]} />
        <meshStandardMaterial 
          color={targetColor} 
          emissive={targetColor} 
          emissiveIntensity={emissiveInt} 
          transparent 
          opacity={op} 
        />
      </mesh>
    );
  });

  return <group>{pillars}</group>;
};

// E) AI COMMANDER CORE RINGS & EMERGENCY PARTICLES
const CoreRings = ({ systemStatus }) => {
  const groupRef = useRef();
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();
  const isEmergency = systemStatus === 'SIGNAL_DETECTED';
  
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (isEmergency) {
      // Spawn 200 particles
      const p = new Array(200).fill().map(() => ({
        pos: new THREE.Vector3(0,0,0),
        vel: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2).normalize().multiplyScalar(0.08),
        opacity: 1,
        life: 2.0 // 2 seconds
      }));
      setParticles(p);
    }
  }, [isEmergency]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const mult = isEmergency ? 3 : 1;
    
    if (ring1.current) ring1.current.rotation.x += 0.008 * mult;
    if (ring2.current) ring2.current.rotation.y += 0.006 * mult;
    if (ring3.current) ring3.current.rotation.z += 0.004 * mult;
    
    const scale = 1 + 0.04 * Math.sin(Date.now() * 0.001);
    if (groupRef.current) groupRef.current.scale.set(scale, scale, scale);
    
    if (isEmergency) {
      state.camera.position.x = Math.sin(time*50)*0.03;
      state.camera.position.y = Math.cos(time*47)*0.02;
      
      // Update particles
      setParticles(prev => {
        let alive = false;
        const next = prev.map(pt => {
          pt.pos.add(pt.vel);
          pt.life -= delta;
          pt.opacity = Math.max(0, pt.life / 2.0);
          if(pt.life > 0) alive = true;
          return pt;
        });
        return alive ? next : [];
      });
    } else {
      state.camera.position.lerp(new THREE.Vector3(0,0,0), 0.1);
    }
  });

  const baseColor1 = '#00FFFF';
  const baseColor2 = '#0066FF';
  const baseColor3 = '#8B00FF';
  const warnColor = '#FF2222';
  
  const color1 = isEmergency ? warnColor : baseColor1;
  const color2 = isEmergency ? warnColor : baseColor2;
  const color3 = isEmergency ? warnColor : baseColor3;
  const emInt = isEmergency ? 3.0 : 0.8;

  return (
    <group position={[0, 3, 0]} ref={groupRef}>
      <mesh ref={ring1}>
        <torusGeometry args={[2.0, 0.03, 16, 100]} />
        <meshStandardMaterial color={color1} emissive={color1} emissiveIntensity={emInt} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.8, 0.03, 16, 100]} />
        <meshStandardMaterial color={color2} emissive={color2} emissiveIntensity={emInt} />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[3.6, 0.03, 16, 100]} />
        <meshStandardMaterial color={color3} emissive={color3} emissiveIntensity={emInt} />
      </mesh>

      <Html position={[0, 4.5, 0]} center>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: isEmergency ? "#FF2222" : "#8B00FF",
          textShadow: `0 0 10px ${isEmergency ? "rgba(255,34,34,0.8)" : "rgba(139,0,255,0.8)"}`,
          whiteSpace: "nowrap"
        }}>
          {isEmergency ? "AI COMMANDER ACTIVE" : "AI COMMANDER ONLINE"}
        </div>
      </Html>
      
      {particles.map((p, idx) => (
        <mesh key={`p-${idx}`} position={[p.pos.x, p.pos.y, p.pos.z]}>
          <sphereGeometry args={[0.04]} />
          <meshBasicMaterial color="#FF2222" transparent opacity={p.opacity} />
        </mesh>
      ))}
    </group>
  );
};

// F) AURORA SHADER
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

const fragmentShader = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec3 bull = vec3(0.0, 1.0, 0.53);
  vec3 blue = vec3(0.0, 0.4, 1.0);
  vec3 ai   = vec3(0.54, 0.0, 1.0);
  float w1 = sin(vUv.x*4.0+uTime*0.3)*0.5+0.5;
  float w2 = cos(vUv.x*3.0-uTime*0.2)*0.5+0.5;
  vec3 col = mix(mix(bull,blue,w1),ai,w2*vUv.y);
  gl_FragColor = vec4(col, 0.12*sin(vUv.y*3.14159));
}
`;

const Aurora = () => {
  const matRef = useRef();
  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += 0.016;
    }
  });

  return (
    <mesh position={[0, 20, -10]}>
      <planeGeometry args={[80, 40]} />
      <shaderMaterial 
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default function SceneBackground({ sectors, systemStatus }) {
  return (
    <>
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(2,4,8,0.65) 60%, #020408 100%)'
    }} />
    
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <fog attach="fog" args={['#020408', 20, 100]} />
        <ambientLight intensity={0.5} />
        
        <StarField />
        <MarketGrid />
        <FloatingParticles />
        <SectorPillars sectors={sectors} />
        <CoreRings systemStatus={systemStatus} />
        <Aurora />
        
        <EffectComposer>
          <Bloom intensity={1.2} luminanceThreshold={0.3} luminanceSmoothing={0.9} />
          <ChromaticAberration offset={[0.0005, 0.0005]} />
        </EffectComposer>
      </Canvas>
    </div>
    </>
  );
}
