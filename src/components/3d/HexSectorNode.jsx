import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

const formatNum = (val) => {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('en-IN')
}

const ParticleBurst = ({ active }) => {
  const meshRef = useRef();
  const count = 30;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const [particles, setParticles] = useState(() => 
    new Array(count).fill().map(() => ({
      pos: new THREE.Vector3(0,0,0),
      vel: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2).normalize().multiplyScalar(0.1),
      life: 1.5,
      active: false
    }))
  );

  useEffect(() => {
    if (active) {
      setParticles(prev => prev.map(p => ({
        pos: new THREE.Vector3(0,0,0),
        vel: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2).normalize().multiplyScalar(0.1),
        life: 1.5,
        active: true
      })));
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    let needsUpdate = false;
    
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      if (p.active) {
        p.pos.add(p.vel);
        p.life -= delta;
        if (p.life <= 0) p.active = false;
        
        const scale = p.active ? 1 : 0;
        dummy.position.copy(p.pos);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.04]} />
      <meshBasicMaterial color="#FF2222" transparent opacity={0.8} />
    </instancedMesh>
  );
};

const HexSectorNode = React.memo(({ sector, position, isViolating, onClick }) => {
  if (!sector) return null;

  const {
    tension: rawTension = 0,
    voltage = 0,
    waterLevel: rawWaterLevel = 0,
    priceChangePct: rawPriceChangePct = 0,
    currentPrice = 0,
    signal: rawSignal = 'NEUTRAL',
    name = '',
    nifty = '',
    id = ''
  } = sector || {};

  const groupRef = useRef();
  const pulseRingRef = useRef();
  const scanBeamRef = useRef();
  const volRingRef = useRef();
  const rapidOutRef = useRef();

  // Geometries Memoization
  const hexGeo = useMemo(() => new THREE.CylinderGeometry(1.0, 1.1, 0.15, 6), []);
  const towerGeo = useMemo(() => new THREE.CylinderGeometry(0.12, 0.12, 1, 8), []);
  const pulseGeo = useMemo(() => new THREE.TorusGeometry(1.2, 0.03, 8, 40), []);
  const scanGeo = useMemo(() => new THREE.RingGeometry(0.8, 0.85, 32), []);
  const volGeo = useMemo(() => new THREE.TorusGeometry(1.5, 0.02, 8, 40), []);
  const rapidGeo = useMemo(() => new THREE.TorusGeometry(1.8, 0.04, 8, 40), []);

  const tension = Math.min(Math.max(rawTension, 0), 1);
  const signal = rawSignal;
  const priceChange = rawPriceChangePct;
  const waterLevel = rawWaterLevel;

  // Colors
  const baseColor = new THREE.Color('#0066FF');
  const bullColor = new THREE.Color('#00FF88');
  const bearColor = new THREE.Color('#FF2222');
  const neutralColor = new THREE.Color('#00FFFF');
  const aiColor = new THREE.Color('#8B00FF');

  const getPlatformColors = () => {
    if (isViolating) return { color: '#1A0608', em: bearColor, emInt: 3.0 };
    if (signal === 'BULLISH') return { color: '#0A1628', em: baseColor.clone().lerp(bullColor, tension), emInt: 0.3 + tension * 1.2 };
    if (signal === 'BEARISH') return { color: '#1A0608', em: baseColor.clone().lerp(bearColor, tension), emInt: 0.3 + tension * 1.2 };
    return { color: '#0A1628', em: neutralColor, emInt: 0.3 + tension * 1.2 };
  };

  const getTowerProps = () => {
    if (isViolating) return { em: bearColor, emInt: 3.0 };
    if (signal === 'BULLISH') return { em: bullColor, emInt: 2.0 };
    if (signal === 'BEARISH') return { em: bearColor, emInt: 2.0 };
    return { em: neutralColor, emInt: 1.5 };
  };

  const getRingColor = () => {
    if (isViolating) return bearColor;
    if (signal === 'BULLISH') return bullColor;
    if (signal === 'BEARISH') return bearColor;
    return neutralColor;
  };

  const platProps = getPlatformColors();
  const towProps = getTowerProps();
  const ringCol = getRingColor();
  const scanCol = isViolating ? bearColor : aiColor;

  // Dynamic values
  const towerHeightRaw = Math.min(Math.max(Math.abs(priceChange) / 3, 0.1), 3.0);
  const towerScaleY = towerHeightRaw;
  const towerPosY = (towerScaleY / 2) + 0.075; // above platform

  // Spring Animations
  const [hovered, setHovered] = useState(false);
  const springProps = useSpring({
    towerScale: [1, towerScaleY, 1],
    towerPos: [0, towerPosY, 0],
    platScale: isViolating ? [1.1, 1, 1.1] : hovered ? [1.05, 1.05, 1.05] : [1, 1, 1],
    emissiveIntOffset: hovered ? 1.0 : 0.0,
    config: { stiffness: 120, damping: isViolating ? 2 : 14 }
  });

  useFrame((state) => {
    if (pulseRingRef.current) {
      pulseRingRef.current.rotation.y += 0.005;
      const pulse = 1 + 0.05 * Math.sin(Date.now() * 0.002 * (0.5 + tension));
      pulseRingRef.current.scale.set(pulse, pulse, pulse);
    }
    if (scanBeamRef.current) {
      scanBeamRef.current.rotation.z += isViolating ? 0.15 : 0.025;
    }
    if (volRingRef.current) {
      volRingRef.current.rotation.y -= 0.003;
    }
    if (rapidOutRef.current) {
      rapidOutRef.current.rotation.y -= 0.04;
    }
  });

  const arrow = priceChange >= 0 ? '↑' : '↓';
  const labelColClass = isViolating ? 'bear' : signal === 'BULLISH' ? 'bull' : signal === 'BEARISH' ? 'bear' : 'neutral';
  const labelBorderCol = isViolating ? '#FF2222' : signal === 'BULLISH' ? '#00FF88' : signal === 'BEARISH' ? '#FF2222' : '#00FFFF';

  return (
    <group 
      position={position} 
      onClick={(e) => { e.stopPropagation(); onClick(sector); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {isViolating && (
        <spotLight 
          position={[0, 5, 0]} 
          target-position={[0, 0, 0]} 
          color={bearColor} 
          intensity={10} 
          angle={0.3} 
          castShadow 
        />
      )}
      
      {/* Platform */}
      <animated.mesh scale={springProps.platScale} receiveShadow castShadow geometry={hexGeo}>
        <animated.meshStandardMaterial 
          color={platProps.color} 
          emissive={platProps.em} 
          emissiveIntensity={springProps.emissiveIntOffset.to(o => platProps.emInt + o)} 
          metalness={0.8} 
          roughness={0.2} 
        />
      </animated.mesh>

      {/* Tower */}
      <animated.mesh scale={springProps.towerScale} position={springProps.towerPos} geometry={towerGeo}>
        <animated.meshStandardMaterial 
          color={platProps.color} 
          emissive={towProps.em} 
          emissiveIntensity={towProps.emInt} 
          metalness={0.8} 
          roughness={0.2} 
        />
      </animated.mesh>

      {/* Pulse Ring */}
      <mesh ref={pulseRingRef} position={[0, 0.1, 0]} rotation={[Math.PI/2, 0, 0]} geometry={pulseGeo}>
        <meshBasicMaterial color={ringCol} transparent opacity={0.6} />
      </mesh>

      {/* Scan Beam */}
      <mesh ref={scanBeamRef} position={[0, 0.2, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={scanGeo}>
        <meshBasicMaterial color={scanCol} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Volume Ring */}
      <mesh ref={volRingRef} position={[0, 0.3, 0]} rotation={[Math.PI/2, 0, 0]} geometry={volGeo}>
        <meshBasicMaterial color="#00FFFF" transparent opacity={waterLevel * 0.7} />
      </mesh>

      {/* rapid outer ring */}
      {isViolating && (
        <mesh ref={rapidOutRef} position={[0, 0.4, 0]} rotation={[Math.PI/2, 0, 0]} geometry={rapidGeo}>
          <meshStandardMaterial color="#FF2222" emissive="#FF2222" emissiveIntensity={3.0} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Burst Particles */}
      <ParticleBurst active={isViolating} />

      {/* HTML Label */}
      <Html position={[0, 2.8, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
        <div style={{
          background: 'rgba(6,13,26,0.85)',
          border: '1px solid var(--color-border-bright)',
          borderLeft: `3px solid ${labelBorderCol}`,
          borderRadius: '0.4rem',
          padding: '0.3rem 0.6rem',
          backdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '120px'
        }}>
          <div style={{ color: '#F1F5F9', fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', fontWeight: 700 }}>
            {sector?.id} · {sector?.nifty}
          </div>
          <div style={{ color: labelBorderCol, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
            ₹{sector ? formatNum(sector.currentPrice) : 0}
          </div>
          <div style={{ color: labelBorderCol, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', marginTop: '1px' }}>
            {arrow}{Math.abs(priceChange).toFixed(2)}%
          </div>
          <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${tension * 100}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, #0066FF, ${labelBorderCol})` 
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
});

export default HexSectorNode;
