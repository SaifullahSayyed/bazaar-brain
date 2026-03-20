import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const EDGES = [
  ['S1','S2'], ['S1','S3'], ['S1','S4'],
  ['S1','S5'], ['S1','S6'], ['S1','S7'],
  ['S2','S3'], ['S3','S4'], ['S4','S5'],
  ['S5','S6'], ['S6','S7'], ['S7','S8'],
  ['S1','S8']
];

const EdgeConnection = React.memo(({ edge, sectors, positions, isCritical }) => {
  const [idA, idB] = edge;
  
  const posA = positions.find(p => p.id === idA)?.pos || [0,0,0];
  const posB = positions.find(p => p.id === idB)?.pos || [0,0,0];
  
  const sectorA = sectors?.find(s => s.id === idA);
  const sectorB = sectors?.find(s => s.id === idB);

  const tA = Math.min(Math.max((sectorA?.tension || 0), 0), 1);
  const tB = Math.min(Math.max((sectorB?.tension || 0), 0), 1);
  const avgTension = (tA + tB) / 2;
  
  const sA = sectorA?.signal || 'NEUTRAL';
  const sB = sectorB?.signal || 'NEUTRAL';

  // Curve for packet
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...posA),
      // Add slight arc upward in middle
      new THREE.Vector3(
        (posA[0] + posB[0])/2,
        0.5 + avgTension * 1.5,
        (posA[2] + posB[2])/2
      ),
      new THREE.Vector3(...posB)
    ]);
  }, [posA, posB, avgTension]);

  // Points for Line
  const linePoints = useMemo(() => curve.getPoints(20), [curve]);

  // Color logic
  let edgeColor = '#00FFFF';
  let packetEmissive = 2.0;
  if (isCritical) {
    edgeColor = '#FF2222';
    packetEmissive = 3.0;
  } else if (sA === 'BULLISH' && sB === 'BULLISH') {
    edgeColor = '#00FF88';
    packetEmissive = 2.5;
  } else if (sA === 'BEARISH' && sB === 'BEARISH') {
    edgeColor = '#FF2222';
    packetEmissive = 2.5;
  }

  const lineWidth = isCritical ? (1 + avgTension * 3) * 2 : 1 + avgTension * 3;
  const lineOpacity = 0.25 + avgTension * 0.5;

  // Packet animation
  const packetRef = useRef();
  const speedRef = useRef(0);
  
  useFrame(() => {
    if (!packetRef.current) return;
    
    // speed: 0.003 + avgTension * 0.005
    let currentSpeed = 0.003 + avgTension * 0.005;
    if (isCritical) currentSpeed *= 3;
    
    speedRef.current += currentSpeed;
    if (speedRef.current > 1) speedRef.current -= 1; // loop back
    
    const pt = curve.getPointAt(speedRef.current);
    packetRef.current.position.copy(pt);
  });

  return (
    <group>
      <Line 
        points={linePoints}
        color={edgeColor}
        lineWidth={lineWidth}
        transparent
        opacity={lineOpacity}
        dashed={isCritical}
        dashSize={0.5}
        dashScale={2}
      />
      
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial 
          color={edgeColor} 
          emissive={edgeColor} 
          emissiveIntensity={packetEmissive} 
        />
      </mesh>
    </group>
  );
});

export default React.memo(function MarketEdges({ sectors, positions, auditResult }) {
  const violatingSectorId = auditResult?.violatingSectorId;

  return (
    <group>
      {EDGES.map((edge, idx) => {
        const isCritical = violatingSectorId && (edge[0] === violatingSectorId || edge[1] === violatingSectorId);
        return (
          <EdgeConnection 
            key={`${edge[0]}-${edge[1]}`} 
            edge={edge} 
            sectors={sectors} 
            positions={positions} 
            isCritical={isCritical}
          />
        );
      })}
    </group>
  );
});
