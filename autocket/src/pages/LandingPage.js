import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import './LandingPage.css';
import { fetchRates } from '../utils/currency';

// 3D model component with auto-rotate until user interacts
function CarModel({ stopRotation }) {
  const gltf = useGLTF('/car.glb');
  const ref = useRef();
  useFrame((state, delta) => {
    if (!stopRotation && ref.current) {
      ref.current.rotation.y += delta * 0.6; // smooth rotation
    }
  });
  return <primitive ref={ref} object={gltf.scene} scale={1.18} position={[0, -0.55, 0]} />;
}

export default function LandingPage({ currency, setCurrency, rates }) {
  const [stopRotation, setStopRotation] = useState(false);
  const controlsRef = useRef();

  // Mouse/touch interaction disables auto-rotation
  useEffect(() => {
    const handlePointerDown = () => setStopRotation(true);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className="landing-full-bg">
      <div className="landing-full-content">
        <h1 className="landing-full-title">FIND YOUR<br />DREAM CAR</h1>
        <p className="landing-full-desc">Explore our wide range of cars for sale</p>
        <div className="landing-full-3d transparent-bg">
          <Canvas camera={{ position: [0, 1.1, 3] }} style={{ width: '100%', height: 470, background: 'transparent' }} shadows>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 7]} intensity={0.9} />
            <Suspense fallback={null}>
              <CarModel stopRotation={stopRotation} />
            </Suspense>
            <Environment preset="city" />
            <OrbitControls ref={controlsRef} enablePan={false} enableZoom={false} enableRotate={true} />
          </Canvas>
        </div>
        <form className="landing-full-search-form" onSubmit={e => e.preventDefault()}>
          <select disabled><option>Brand</option></select>
          <select disabled><option>Model</option></select>
          <input type="number" placeholder="Max Price" disabled />
          <button type="submit" disabled>SEARCH</button>
        </form>
      </div>
    </div>
  );
}

// GLTF loader için gerekli
useGLTF.preload('/car.glb');
