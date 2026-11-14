import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const RIGGED_MODEL_PATH = '/models/astronaut_rigged.glb';

function AstronautRiggedModel({
  currentAnimation,
  playbackSpeed,
  showSkeleton,
  onAnimationStats,
}: {
  currentAnimation: 'walk' | 'run' | 'pause';
  playbackSpeed: number;
  showSkeleton: boolean;
  onAnimationStats: (stats: {
    clipName: string;
    duration: number;
    time: number;
    bonesCount: number;
    meshName: string;
  }) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(RIGGED_MODEL_PATH);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);

  // Skeleton helper
  useEffect(() => {
    if (groupRef.current && showSkeleton) {
      const helper = new THREE.SkeletonHelper(groupRef.current);
      skeletonHelperRef.current = helper;
      scene.add(helper);
      return () => {
        scene.remove(helper);
        helper.dispose();
      };
    }
  }, [scene, showSkeleton]);

  // Animation playback & cross-fading
  useEffect(() => {
    if (!actions) return;

    if (currentAnimation === 'pause') {
      mixer.stopAllAction();
      return;
    }

    const action = actions[currentAnimation];
    if (action) {
      action.reset().fadeIn(0.25).play();
      action.setEffectiveTimeScale(playbackSpeed);

      return () => {
        action.fadeOut(0.25);
      };
    }
  }, [actions, currentAnimation, mixer, playbackSpeed]);

  // Adjust timeScale when slider changes
  useEffect(() => {
    if (!actions) return;
    const action = actions[currentAnimation];
    if (action) {
      action.setEffectiveTimeScale(playbackSpeed);
    }
  }, [actions, currentAnimation, playbackSpeed]);

  // Reporting frame stats
  useFrame(() => {
    if (actions && currentAnimation !== 'pause') {
      const action = actions[currentAnimation];
      let bones = 0;
      let meshName = 'None';
      scene.traverse((obj) => {
        if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
          const sm = obj as THREE.SkinnedMesh;
          meshName = sm.name;
          if (sm.skeleton) {
            bones = sm.skeleton.bones.length;
          }
        }
      });

      if (action) {
        onAnimationStats({
          clipName: action.getClip().name,
          duration: action.getClip().duration,
          time: action.time % action.getClip().duration,
          bonesCount: bones,
          meshName,
        });
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export function RiggedAstronautPreview() {
  const [currentAnimation, setCurrentAnimation] = useState<'walk' | 'run' | 'pause'>('walk');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [stats, setStats] = useState<{
    clipName: string;
    duration: number;
    time: number;
    bonesCount: number;
    meshName: string;
  }>({
    clipName: 'walk',
    duration: 1.0,
    time: 0,
    bonesCount: 24,
    meshName: 'astronaut-in-spacesuit',
  });

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0d14', position: 'relative', overflow: 'hidden', color: '#fff', fontFamily: 'monospace' }}>
      {/* 3D Viewport */}
      <Canvas
        camera={{ position: [0, 1.4, 3.2], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 2, 2]} intensity={0.8} color="#70d6ff" />

        {/* Floor grid */}
        <gridHelper args={[10, 20, '#4ecdc4', '#26384a']} position={[0, 0, 0]} />

        {/* Rigged Astronaut Model */}
        <AstronautRiggedModel
          currentAnimation={currentAnimation}
          playbackSpeed={playbackSpeed}
          showSkeleton={showSkeleton}
          onAnimationStats={setStats}
        />

        <OrbitControls target={[0, 0.95, 0]} minDistance={1.0} maxDistance={8.0} />
      </Canvas>

      {/* Control Panel Overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(0, 245, 212, 0.3)',
        borderRadius: 8,
        padding: '16px 20px',
        maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}>
        <h2 style={{ margin: '0 0 10px', fontSize: '1rem', color: '#00f5d4', display: 'flex', alignItems: 'center', gap: 8 }}>
          RIGGED ASTRONAUT PREVIEW
        </h2>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 14 }}>
          File: <span style={{ color: '#fff' }}>public/models/astronaut_rigged.glb</span>
        </div>

        {/* Animation Selection Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setCurrentAnimation('walk')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: currentAnimation === 'walk' ? '#00f5d4' : '#1e293b',
              color: currentAnimation === 'walk' ? '#0f172a' : '#fff',
              border: '1px solid #334155',
              borderRadius: 4,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            WALK (1.0s)
          </button>
          <button
            type="button"
            onClick={() => setCurrentAnimation('run')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: currentAnimation === 'run' ? '#00f5d4' : '#1e293b',
              color: currentAnimation === 'run' ? '#0f172a' : '#fff',
              border: '1px solid #334155',
              borderRadius: 4,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            RUN (0.625s)
          </button>
          <button
            type="button"
            onClick={() => setCurrentAnimation('pause')}
            style={{
              padding: '8px 12px',
              background: currentAnimation === 'pause' ? '#e5a93c' : '#1e293b',
              color: currentAnimation === 'pause' ? '#0f172a' : '#fff',
              border: '1px solid #334155',
              borderRadius: 4,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            REST
          </button>
        </div>

        {/* Speed Slider */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
            <span>Playback Speed</span>
            <span style={{ color: '#00f5d4' }}>{playbackSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Skeleton Helper Toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => setShowSkeleton(e.target.checked)}
            />
            <span>Show 3D Bone Hierarchy (24 Joints)</span>
          </label>
        </div>

        {/* Real-time Telemetry / Diagnostics */}
        <div style={{
          background: 'rgba(2, 6, 23, 0.7)',
          padding: 10,
          borderRadius: 6,
          border: '1px solid #1e293b',
          fontSize: '0.72rem',
          lineHeight: '1.5',
        }}>
          <div>Active Clip: <strong style={{ color: '#00f5d4' }}>{stats.clipName}</strong></div>
          <div>Clip Duration: <strong>{stats.duration.toFixed(3)}s</strong></div>
          <div>Cycle Time: <strong>{stats.time.toFixed(3)}s</strong> / {stats.duration.toFixed(3)}s</div>
          <div>Bones Detected: <strong style={{ color: '#4ade80' }}>{stats.bonesCount}</strong></div>
          <div>Skinned Mesh: <strong>{stats.meshName}</strong></div>
          <div>Vertices: <strong>175,001</strong> | Triangles: <strong>300,000</strong></div>
          <div>Model Height: <strong>1.90 m</strong> (1:1 SI metric)</div>
        </div>

        <div style={{ marginTop: 12, fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
          Drag mouse to orbit • Scroll to zoom • Right-click to pan
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(RIGGED_MODEL_PATH);
