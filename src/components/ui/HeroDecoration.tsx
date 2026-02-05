'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function HeroDecoration() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Mouse interaction state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for parallax
  const springConfig = { damping: 25, stiffness: 150 };
  const moveX = useSpring(mouseX, springConfig);
  const moveY = useSpring(mouseY, springConfig);
  
  // Parallax layers (different depths)
  const layer1X = useTransform(moveX, [-0.5, 0.5], [-20, 20]); // Background (slow)
  const layer1Y = useTransform(moveY, [-0.5, 0.5], [-20, 20]);
  
  const layer2X = useTransform(moveX, [-0.5, 0.5], [-40, 40]); // Midground (medium)
  const layer2Y = useTransform(moveY, [-0.5, 0.5], [-40, 40]);
  
  const layer3X = useTransform(moveX, [-0.5, 0.5], [-70, 70]); // Foreground (fast)
  const layer3Y = useTransform(moveY, [-0.5, 0.5], [-70, 70]);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position (-0.5 to 0.5)
      const { innerWidth, innerHeight } = window;
      mouseX.set((e.clientX / innerWidth) - 0.5);
      mouseY.set((e.clientY / innerHeight) - 0.5);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const color = isDark ? '#60A5FA' : '#2563EB'; // primary-400 : primary-600
  const secondaryColor = isDark ? '#A78BFA' : '#7C3AED'; // violet-400 : violet-600

  // Golden Spiral Path Approximation
  const spiralPath = 
    "M 450 380 " + 
    "A 10 10 0 0 0 460 390 " +
    "A 20 20 0 0 0 480 370 " +
    "A 40 40 0 0 0 440 330 " +
    "A 80 80 0 0 0 360 410 " +
    "A 160 160 0 0 0 520 570 " +
    "A 320 320 0 0 0 840 250 ";
    
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden lg:static lg:z-auto lg:overflow-visible flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute right-[-10%] top-[-10%] h-[600px] w-[600px] opacity-30 lg:right-[-50px] lg:top-[50px] lg:h-[700px] lg:w-[800px] lg:opacity-100"
      >
        <svg
          viewBox="0 0 800 600"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.2" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND LAYER: Geometric Guides (Science) */}
          <motion.g 
            style={{ x: layer1X, y: layer1Y }} 
            stroke={color} 
            strokeWidth="0.5" 
            strokeOpacity="0.15"
          >
             <motion.rect x="450" y="380" width="10" height="10" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 2 }} />
             <motion.rect x="460" y="370" width="20" height="20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 2 }} />
             <motion.rect x="440" y="330" width="40" height="40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 2 }} />
             <motion.rect x="360" y="330" width="80" height="80"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 2 }} />
             <motion.rect x="360" y="410" width="160" height="160"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 2 }} />
             <motion.rect x="520" y="250" width="320" height="320"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 2 }} />
             
             {/* Intersecting lines */}
             <motion.line 
               x1="360" y1="410" x2="840" y2="250" 
               stroke={secondaryColor} strokeWidth="0.5" strokeOpacity="0.2"
             />
          </motion.g>

          {/* MIDGROUND LAYER: The Golden Spiral (Art) */}
          <motion.g style={{ x: layer2X, y: layer2Y }}>
            <motion.path
              d={spiralPath}
              stroke="url(#spiralGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 4, ease: "easeInOut" }}
              whileHover={{ strokeWidth: 4, filter: "url(#glow) drop-shadow(0 0 8px rgba(60, 130, 246, 0.5))" }}
            />
          </motion.g>

          {/* FOREGROUND LAYER: Floating Particles (Philosophy) */}
          <motion.g style={{ x: layer3X, y: layer3Y }}>
            {/* Particle 1: Origin Pulse */}
            <motion.circle cx="450" cy="380" r="3" fill={color}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
              <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
            </motion.circle>
            
            {/* Particle 2: Flowing Electron */}
            <motion.circle 
              r="4" 
              fill={secondaryColor}
              style={{ offsetPath: `path("${spiralPath}")` }}
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Particle 3: Orbiting Satellite */}
            <motion.circle cx="520" cy="410" r="2" fill={color} opacity="0.6">
               <animateTransform attributeName="transform" type="rotate" from="0 520 410" to="360 520 410" dur="10s" repeatCount="indefinite" />
            </motion.circle>
          </motion.g>

        </svg>
      </motion.div>
    </div>
  );
}
