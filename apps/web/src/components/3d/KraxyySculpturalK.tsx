import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface KraxyySculpturalKProps {
  className?: string;
  onScrollProgressChange?: (progress: number) => void;
}

export const KraxyySculpturalK: React.FC<KraxyySculpturalKProps> = ({
  className = '',
  onScrollProgressChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Dimensions
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 560;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Position camera based on viewport width
    const isMobile = window.innerWidth < 768;
    camera.position.set(0, 0, isMobile ? 8.2 : 6.8);

    // High performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // Studio Lighting System with interactive highlight response
    const ambientLight = new THREE.AmbientLight(0xF4EFE4, 1.5);
    scene.add(ambientLight);

    // Key directional light that follows mouse
    const keyLight = new THREE.DirectionalLight(0xFFFAF0, 2.4);
    keyLight.position.set(4.5, 7.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Warm Mustard edge light
    const rimLight = new THREE.DirectionalLight(0xB18B40, 1.8);
    rimLight.position.set(-6, 2.5, -2.5);
    scene.add(rimLight);

    // Soft Olive bounce light
    const fillLight = new THREE.DirectionalLight(0x525B31, 0.9);
    fillLight.position.set(0, -5, 4);
    scene.add(fillLight);

    // Root Group for the Sculptural Object
    const kGroup = new THREE.Group();
    scene.add(kGroup);

    // Physical Matte Materials
    const oliveMat = new THREE.MeshPhysicalMaterial({
      color: 0x525B31,
      roughness: 0.32,
      metalness: 0.08,
      clearcoat: 0.18,
      clearcoatRoughness: 0.22,
      reflectivity: 0.25,
    });

    const mustardMat = new THREE.MeshPhysicalMaterial({
      color: 0xB18B40,
      roughness: 0.28,
      metalness: 0.12,
      clearcoat: 0.22,
      clearcoatRoughness: 0.18,
    });

    const beigeMat = new THREE.MeshPhysicalMaterial({
      color: 0xD6CAAC,
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.12,
    });

    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0xFAF7F1,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.35,
    });

    const darkAccentMat = new THREE.MeshPhysicalMaterial({
      color: 0x1E2315,
      roughness: 0.38,
      metalness: 0.2,
    });

    // Helper for rounded beveled box
    const createRoundedBox = (w: number, h: number, d: number, r: number, mat: THREE.Material) => {
      const shape = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);

      const extrudeSettings = {
        depth: d - r * 2,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: r,
        bevelThickness: r,
      };

      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // 1. Vertical Stem of "K" (Olive - strong, grounded anchor)
    const stem = createRoundedBox(0.72, 3.5, 0.45, 0.09, oliveMat);
    stem.position.set(-1.1, 0, 0);
    kGroup.add(stem);

    // 2. Upper Diagonal Wing of "K" (Mustard - aspirational energetic angle)
    const upperWing = createRoundedBox(0.64, 2.4, 0.4, 0.08, mustardMat);
    upperWing.position.set(0.5, 0.76, 0.14);
    upperWing.rotation.z = -Math.PI / 4.1;
    upperWing.rotation.x = 0.06;
    kGroup.add(upperWing);

    // 3. Lower Diagonal Leg of "K" (Beige - stable foundation)
    const lowerLeg = createRoundedBox(0.66, 2.3, 0.38, 0.08, beigeMat);
    lowerLeg.position.set(0.58, -0.82, -0.06);
    lowerLeg.rotation.z = Math.PI / 4.3;
    lowerLeg.rotation.x = -0.05;
    kGroup.add(lowerLeg);

    // 4. Central Folding Joint Accent (Refined Dark Olive interlocking node)
    const centerNode = createRoundedBox(0.54, 0.54, 0.52, 0.1, darkAccentMat);
    centerNode.position.set(-0.36, 0, 0.08);
    kGroup.add(centerNode);

    // 5. Embedded Application Surface Card (Credential document fused with K)
    const appCard = createRoundedBox(1.7, 1.15, 0.09, 0.06, cardMat);
    appCard.position.set(0.24, -0.12, 0.35);
    appCard.rotation.set(-0.03, 0.06, 0.02);

    // Verification chip on the card
    const checkChip = createRoundedBox(0.24, 0.24, 0.05, 0.04, oliveMat);
    checkChip.position.set(-0.58, 0.32, 0.06);
    appCard.add(checkChip);

    // Data field lines on the card
    const line1 = createRoundedBox(0.75, 0.07, 0.03, 0.015, beigeMat);
    line1.position.set(0.1, 0.32, 0.05);
    appCard.add(line1);

    const line2 = createRoundedBox(1.15, 0.06, 0.03, 0.015, beigeMat);
    line2.position.set(-0.05, 0.09, 0.05);
    appCard.add(line2);

    const line3 = createRoundedBox(0.92, 0.06, 0.03, 0.015, mustardMat);
    line3.position.set(-0.16, -0.15, 0.05);
    appCard.add(line3);

    kGroup.add(appCard);

    // Initial state: K angled 15-20 degrees (~0.3 rad)
    let currentScrollProgress = 0;
    let targetRotY = -0.32; // ~18.3 degrees angled
    let targetRotX = 0.12;
    let targetRotZ = -0.04;
    let targetPosY = 0;

    let mouseX = 0;
    let mouseY = 0;

    // Mouse movement: subtle cursor tracking & light shift
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = nx * 0.14;
      mouseY = ny * 0.12;

      // Subtle dynamic key light response
      keyLight.position.x = 4.5 + nx * 2.0;
      keyLight.position.y = 7.5 + ny * 2.0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (prefersReducedMotion || !e.touches[0]) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = nx * 0.1;
      mouseY = ny * 0.08;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Scroll interaction tied directly to scroll progress
    // 0% -> angled 15-20 deg (-0.32 rad)
    // 20% -> begins rotating (-0.24 rad)
    // 40% -> reveals embedded application surface (-0.12 rad)
    // 60% -> fields become visible (0.02 rad)
    // 80% -> fields animate into place (0.10 rad)
    // 100% -> K becomes front-facing (0.0 rad)
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = Math.min(window.innerHeight * 1.1, 850);
      const progress = Math.min(Math.max(scrollY / heroHeight, 0), 1);
      currentScrollProgress = progress;
      setScrollProgress(progress);
      onScrollProgressChange?.(progress);

      if (progress < 0.2) {
        // 0% -> 20%: angled 18° -> 14°
        const p = progress / 0.2;
        targetRotY = -0.32 + p * 0.08;
        targetRotX = 0.12 - p * 0.03;
        targetRotZ = -0.04 + p * 0.01;
        targetPosY = p * 0.08;
      } else if (progress < 0.4) {
        // 20% -> 40%: rotates to reveal embedded surface
        const p = (progress - 0.2) / 0.2;
        targetRotY = -0.24 + p * 0.12;
        targetRotX = 0.09 - p * 0.04;
        targetRotZ = -0.03 + p * 0.02;
        targetPosY = 0.08 + p * 0.08;
      } else if (progress < 0.6) {
        // 40% -> 60%: fields visible
        const p = (progress - 0.4) / 0.2;
        targetRotY = -0.12 + p * 0.14;
        targetRotX = 0.05 - p * 0.03;
        targetRotZ = -0.01 + p * 0.02;
        targetPosY = 0.16 + p * 0.06;
      } else if (progress < 0.8) {
        // 60% -> 80%: fields animate into place
        const p = (progress - 0.6) / 0.2;
        targetRotY = 0.02 + p * 0.08;
        targetRotX = 0.02 - p * 0.02;
        targetRotZ = 0.01 - p * 0.01;
        targetPosY = 0.22 - p * 0.08;
      } else {
        // 80% -> 100%: settles into clean front-facing stance
        const p = (progress - 0.8) / 0.2;
        targetRotY = 0.10 - p * 0.10; // Settles to exactly 0
        targetRotX = 0;
        targetRotZ = 0;
        targetPosY = 0.14 - p * 0.14;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    resizeObserver.observe(container);

    // IntersectionObserver to sleep render loop when offscreen
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 60fps Animation Loop with smooth dampening lerp
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();
      const breath = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.85) * 0.025;

      const finalTargetY = targetRotY + mouseX;
      const finalTargetX = targetRotX + mouseY;
      const finalTargetZ = targetRotZ;

      kGroup.rotation.y += (finalTargetY - kGroup.rotation.y) * 0.07;
      kGroup.rotation.x += (finalTargetX - kGroup.rotation.x) * 0.07;
      kGroup.rotation.z += (finalTargetZ - kGroup.rotation.z) * 0.07;

      kGroup.position.y += (targetPosY + breath - kGroup.position.y) * 0.07;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      observer.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      kGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  // Compute embedded application progression states based on scroll
  const isSurfaceRevealed = scrollProgress >= 0.25;
  const areFieldsVisible = scrollProgress >= 0.45;
  const areFieldsFilled = scrollProgress >= 0.70;
  const isFinalVerified = scrollProgress >= 0.85;

  return (
    <div className={`relative w-full h-full min-h-[480px] max-h-[660px] flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Layer */}
      <div
        ref={mountRef}
        className="w-full h-full absolute inset-0 pointer-events-none"
        aria-label="Kraxyy Sculptural 3D Identity Object"
      />

      {/* Embedded Application Surface synced directly with 3D K scroll progress */}
      <div
        className={`absolute bottom-4 sm:bottom-8 right-2 sm:right-6 max-w-[280px] sm:max-w-[320px] w-full transition-all duration-500 ease-out z-10 ${
          isSurfaceRevealed
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-beige/90 p-4 shadow-elevated space-y-2.5">
          {/* Company & Role Header */}
          <div className="flex items-center justify-between pb-2 border-b border-beige/60">
            <div>
              <div className="font-bold text-xs text-charcoal">Frontend Developer</div>
              <div className="text-[11px] text-olive font-medium">Acme Technologies</div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                isFinalVerified
                  ? 'bg-olive text-cream'
                  : areFieldsFilled
                  ? 'bg-olive-50 text-olive border border-olive/20'
                  : 'bg-mustard-50 text-mustard-dark border border-mustard/30'
              }`}
            >
              {isFinalVerified ? '18 FIELDS READY' : areFieldsFilled ? '✓ FILLED' : 'DETECTED'}
            </span>
          </div>

          {/* Fields Preview */}
          <div
            className={`space-y-1.5 transition-all duration-400 ${
              areFieldsVisible ? 'opacity-100' : 'opacity-20'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-cream-50/80 border border-beige/40">
              <span className="text-charcoal-muted">Name</span>
              <span className="font-semibold text-charcoal">
                {areFieldsFilled ? 'Saquib Sarfaraz' : '••••••••'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-cream-50/80 border border-beige/40">
              <span className="text-charcoal-muted">Email</span>
              <span className="font-semibold text-charcoal">
                {areFieldsFilled ? 'saquib@example.com' : '••••••••'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-cream-50/80 border border-beige/40">
              <span className="text-charcoal-muted">Phone</span>
              <span className="font-semibold text-charcoal">
                {areFieldsFilled ? '+91 98765 43210' : '••••••••'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-cream-50/80 border border-beige/40">
              <span className="text-charcoal-muted">LinkedIn</span>
              <span className="font-semibold text-charcoal truncate max-w-[140px]">
                {areFieldsFilled ? 'linkedin.com/in/saquib' : '••••••••'}
              </span>
            </div>
          </div>

          {/* Micro confirmation indicator */}
          <div className="pt-1.5 border-t border-beige/40 flex items-center justify-between text-[10px] text-charcoal-muted">
            <span>Client-side autofill</span>
            <span className="font-semibold text-olive">
              {isFinalVerified ? '✓ 18 fields ready' : 'Scroll to populate'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
