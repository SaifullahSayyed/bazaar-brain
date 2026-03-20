import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import HexSectorNode from './HexSectorNode';
import MarketEdges from './MarketEdges';
import GroundPlane from './GroundPlane';

const HEX_POSITIONS = [
  { id:'S1', pos:[0, 0, 0] },       // Banking — center
  { id:'S2', pos:[3, 0, 0] },       // IT — right
  { id:'S3', pos:[1.5, 0, -2.6] },  // FMCG — upper right
  { id:'S4', pos:[-1.5, 0, -2.6] }, // Pharma — upper left
  { id:'S5', pos:[-3, 0, 0] },      // Energy — left
  { id:'S6', pos:[-1.5, 0, 2.6] },  // Auto — lower left
  { id:'S7', pos:[1.5, 0, 2.6] },   // Metals — lower right
  { id:'S8', pos:[0, 0, 5.2] }      // Realty — far bottom
];

const MarketNerveCenter = React.memo(({ sectors, auditResult, onSectorClick }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Disable autoRotate on interact, re-enable after 3s
  const handleInteract = useCallback(() => {
    setAutoRotate(false);
  }, []);

  const handleEndInteract = useCallback(() => {
    setTimeout(() => {
      setAutoRotate(true);
    }, 3000);
  }, []);

  const violatingSectorId = auditResult?.violatingSectorId || null;

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        shadows 
        gl={{ antialias: true, alpha: true, pixelRatio: Math.min(window.devicePixelRatio, 2) }}
      >
        <PerspectiveCamera makeDefault fov={55} position={[0, 8, 14]} near={0.1} far={1000} />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2.2} 
          autoRotate={autoRotate} 
          autoRotateSpeed={0.4}
          onStart={handleInteract}
          onEnd={handleEndInteract}
        />

        <ambientLight intensity={0.08} />
        <pointLight position={[0, 10, 0]} color="#0066FF" intensity={2.5} />
        <pointLight position={[8, 4, 8]} color="#00FF88" intensity={1.8} />
        <pointLight position={[-8, 4, -8]} color="#8B00FF" intensity={1.2} />
        <directionalLight position={[0, 20, 10]} intensity={0.3} castShadow />

        <group position={[0, -2, 0]}>
          {HEX_POSITIONS.map((hex, idx) => {
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
        </group>
      </Canvas>
    </div>
  );
});

export default MarketNerveCenter;
