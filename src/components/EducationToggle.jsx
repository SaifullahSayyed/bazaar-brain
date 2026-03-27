import React from 'react';
import { useMarketStore } from '../context/MarketStore';
import '../styles/EducationToggle.css';

export default function EducationToggle() {
  const educationMode = useMarketStore(state => state.educationMode);
  const toggleEducationMode = useMarketStore(state => state.toggleEducationMode);

  return (
    <div className="edu-toggle-container">
      <span className="edu-label">🎓 EDUCATION MODE</span>
      <button 
        className={`edu-switch ${educationMode ? 'active' : ''}`}
        onClick={toggleEducationMode}
        title={educationMode ? 'Disable help tooltips' : 'Enable help tooltips and risk explanations'}
      >
        <div className="edu-slider" />
      </button>
    </div>
  );
}
