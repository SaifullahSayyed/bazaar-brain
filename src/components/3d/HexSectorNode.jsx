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

  const bar1Ref = useRef();
  const bar2Ref = useRef();
  const bar3Ref = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pulseRingRef.current) {
      pulseRingRef.current.rotation.y += 0.005;
      const pulse = 1 + 0.05 * Math.sin(t * 2.0 * (0.5 + tension));
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
    
    // Animate volumetric bars
    const h1 = 0.2 + (tension * 0.8) + Math.sin(t * 3.0) * 0.1;
    const h2 = 0.2 + (tension * 0.6) + Math.cos(t * 2.5) * 0.1;
    const h3 = 0.2 + (tension * 1.2) + Math.sin(t * 4.0) * 0.15;
    
    if (bar1Ref.current) {
      bar1Ref.current.scale.y = h1;
      bar1Ref.current.position.y = (h1 / 2) + 0.075;
    }
    if (bar2Ref.current) {
      bar2Ref.current.scale.y = h2;
      bar2Ref.current.position.y = (h2 / 2) + 0.075;
    }
    if (bar3Ref.current) {
      bar3Ref.current.scale.y = h3;
      bar3Ref.current.position.y = (h3 / 2) + 0.075;
    }

    // Holographic rings
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 1.5;
    if (ring2Ref.current) ring2Ref.current.rotation.x = t * 1.2;
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
          metalness={0.9} 
          roughness={0.1} 
        />
      </animated.mesh>

      {/* Volumetric Bars Cluster */}
      <group position={[0, 0, 0]}>
        <mesh ref={bar1Ref} position={[0.3, 0, 0.3]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color={ringCol} emissive={ringCol} emissiveIntensity={2} transparent opacity={0.8} />
        </mesh>
        <mesh ref={bar2Ref} position={[-0.3, 0, 0.3]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color={ringCol} emissive={ringCol} emissiveIntensity={1.5} transparent opacity={0.7} />
        </mesh>
        <mesh ref={bar3Ref} position={[0, 0, -0.4]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color={ringCol} emissive={ringCol} emissiveIntensity={2.5} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Holographic Spinning Rings */}
      <mesh ref={ring1Ref} position={[0, 0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.8, 0.01, 16, 100]} />
        <meshBasicMaterial color={ringCol} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0.5, 0]} rotation={[0, Math.PI/2, 0]}>
        <torusGeometry args={[0.85, 0.01, 16, 100]} />
        <meshBasicMaterial color={ringCol} transparent opacity={0.2} />
      </mesh>

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

      {/* HTML Label — premium floating card */}
      <Html 
        position={[0, 1.8, 0]} 
        center 
        distanceFactor={15} 
        occlude={false} 
        zIndexRange={[10, 20]}
        style={{
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <div style={{
          background: `linear-gradient(145deg, rgba(6,13,26,0.96) 0%, rgba(${
            isViolating ? '60,4,8' : signal === 'BULLISH' ? '4,30,18' : signal === 'BEARISH' ? '40,4,4' : '4,16,40'
          },0.92) 100%)`,
          border: `1px solid ${labelBorderCol}`,
          borderRadius: '0.5rem',
          padding: '0',
          backdropFilter: 'blur(12px)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '110px',
          overflow: 'hidden',
          boxShadow: `0 0 20px rgba(${
            isViolating ? '255,34,34' : signal === 'BULLISH' ? '0,255,136' : signal === 'BEARISH' ? '255,34,34' : '0,255,255'
          }, 0.2), inset 0 0 20px rgba(${
            isViolating ? '255,34,34' : signal === 'BULLISH' ? '0,255,136' : signal === 'BEARISH' ? '255,34,34' : '0,255,255'
          }, 0.04)`,
        }}>
          {/* Top accent bar */}
          <div style={{
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${labelBorderCol}, transparent)`,
            boxShadow: `0 0 8px ${labelBorderCol}`,
          }} />

          <div style={{ padding: '0.3rem 0.5rem 0.4rem' }}>
            {/* Row 1: ID + NIFTY name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.15rem' }}>
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.04em',
              }}>
                {sector?.id}
              </span>
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#F1F5F9',
                letterSpacing: '0.04em',
              }}>
                {sector?.nifty}
              </span>
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: `linear-gradient(90deg, ${labelBorderCol}55, transparent)`,
              marginBottom: '0.3rem',
            }} />

            {/* Row 2: Price */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1.05rem',
              fontWeight: 700,
              color: labelBorderCol,
              letterSpacing: '0.02em',
              textShadow: `0 0 10px ${labelBorderCol}80`,
              marginBottom: '0.15rem',
            }}>
              ₹{sector ? formatNum(sector.currentPrice) : '0'}
            </div>

            {/* Row 3: Change % with arrow */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.72rem',
              fontWeight: 600,
              color: labelBorderCol,
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <span style={{ fontSize: '0.85rem' }}>{arrow}</span>
              {Math.abs(priceChange).toFixed(2)}%
            </div>

            {/* Tension bar */}
            <div style={{ marginBottom: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>TENSION</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: labelBorderCol }}>{(tension * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${tension * 100}%`,
                  height: '100%',
                  borderRadius: '2px',
                  background: `linear-gradient(90deg, #0066FF, ${labelBorderCol})`,
                  boxShadow: `0 0 6px ${labelBorderCol}`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* Signal badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              background: `rgba(${
                isViolating ? '255,34,34' : signal === 'BULLISH' ? '0,255,136' : signal === 'BEARISH' ? '255,34,34' : '0,255,255'
              }, 0.12)`,
              border: `1px solid ${labelBorderCol}55`,
              borderRadius: '0.25rem',
              padding: '0.08rem 0.35rem',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.58rem',
              color: labelBorderCol,
              fontWeight: 'bold',
              letterSpacing: '0.08em',
            }}>
              {isViolating ? '⚡ ALERT' : signal === 'BULLISH' ? '▲ BULLISH' : signal === 'BEARISH' ? '▼ BEARISH' : '◆ NEUTRAL'}
            </div>
          </div>
        </div>
      </Html>

    </group>
  );
});

export default HexSectorNode;
