import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
// ✅ Import directly from the installed package
import FOG from 'vanta/dist/vanta.fog.min';

const VantaBackground = () => {
  const [vantaEffect, setVantaEffect] = useState(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      try {
        setVantaEffect(
          FOG({
            el: vantaRef.current,
            THREE: THREE, // Pass the 3D engine
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            
            // --- EMERALD THEME COLORS ---
            highlightColor: 0x34d399,
            midtoneColor: 0x059669,
            lowlightColor: 0x064e3b,
            baseColor: 0x0f1115,
            
            blurFactor: 0.6,
            speed: 1.2,
            zoom: 0.8
          })
        );
      } catch (error) {
        console.error("[Vanta Error]", error);
      }
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div 
      ref={vantaRef} 
      className="fixed inset-0 -z-10 w-full h-full" 
      style={{ pointerEvents: 'none' }} 
    />
  );
};

export default VantaBackground;