import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VANTA: {
      WAVES: (config: Record<string, unknown>) => {
        destroy: () => void;
        setOptions: (options: Record<string, unknown>) => void;
      };
    };
  }
}

interface VantaBackgroundProps {
  theme: 'dark' | 'light';
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ theme }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<ReturnType<typeof window.VANTA.WAVES> | null>(null);

  const getThemeColors = (currentTheme: 'dark' | 'light') => {
    if (currentTheme === 'dark') {
      return {
        color: 0x1e3a5f,
        shininess: 35,
        waveHeight: 20,
        waveSpeed: 1.0,
      };
    }
    return {
      color: 0x3b82f6,
      shininess: 50,
      waveHeight: 15,
      waveSpeed: 0.8,
    };
  };

  useEffect(() => {
    if (!vantaRef.current || !window.VANTA) return;

    const colors = getThemeColors(theme);

    if (!vantaEffect.current) {
      vantaEffect.current = window.VANTA.WAVES({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: colors.color,
        shininess: colors.shininess,
        waveHeight: colors.waveHeight,
        waveSpeed: colors.waveSpeed,
        zoom: 0.85,
      });
    } else {
      vantaEffect.current.setOptions(colors);
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (vantaEffect.current) {
      const colors = getThemeColors(theme);
      vantaEffect.current.setOptions(colors);
    }
  }, [theme]);

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default VantaBackground;
