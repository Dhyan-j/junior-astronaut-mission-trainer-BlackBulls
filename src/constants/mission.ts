import type { CameraPreset, CameraTargetId } from '../types/mission';

export const CAMERA_PRESETS: Record<CameraTargetId, CameraPreset> = {
  overview: {
    id: 'overview',
    name: 'Base Overview',
    position: [24, 15, 26],
    target: [0, 1.8, 0],
    description: 'Orbital wide-angle view of the entire lunar outpost',
  },
  habitat: {
    id: 'habitat',
    name: 'HDU Habitat',
    position: [-1, 4.5, 6],
    target: [-4, 2.2, -2],
    description: 'Close inspection of Habitat Demonstration Unit 1 & 2',
  },
  astronaut: {
    id: 'astronaut',
    name: 'Z-2 Astronaut',
    position: [4.6, 2.1, 5.8],
    target: [2.5, 1.1, 3.8],
    description: 'EVA trainee in next-gen Z-2 surface spacesuit',
  },
  rover: {
    id: 'rover',
    name: 'SEV Rover',
    position: [16, 4.0, 5.0],
    target: [9.5, 2.0, -1.5],
    description: 'Pressurized Multi-Mission Space Exploration Vehicle',
  },
  solar: {
    id: 'solar',
    name: 'Solar Arrays',
    position: [-9, 6.5, 25],
    target: [-18, 3.2, 20],
    description: 'Simulated photovoltaic power generation grid',
  },
  biodome: {
    id: 'biodome',
    name: 'Bio-Dome Lab',
    position: [-14, 5.5, -7],
    target: [-20, 2.8, -16],
    description: 'Low-poly pressurized science and life-support module',
  },
};

export const HDU_ALIGNMENT_INFO = {
  isAligned: false,
  part1Scale: [0.3116, 0.3116, 0.3116] as [number, number, number],
  part2Scale: [0.5381, 0.5381, 0.5381] as [number, number, number],
  part1Bounds: '380.2 x 165.9 x 217.4 (scaled units)',
  part2Bounds: '656.4 x 458.5 x 226.4 (scaled units)',
  notes:
    'Visual alignment check reveals that the two raw GLB files have conflicting node scale matrices (Part 1 = 0.3116 vs Part 2 = 0.5381) and independent coordinate origins from the 3D authoring export. When placed together at origin with original geometry preserved, Part 1 appears roughly 58% relative scale compared to Part 2, resulting in an open seam at the vestibule interface rather than an airtight sealed structure.',
};

export const ASTRONAUT_ANIMATION_INFO = {
  hasSkeletalAnimation: false,
  animationCount: 0,
  skinCount: 0,
  details:
    'Z2 Spacesuit.glb contains zero animations and zero skeletal skins (static unrigged geometry). No skeletal bones are present.',
};

export const ROVER_PERFORMANCE_INFO = {
  triangleCount: 413198,
  vertexCount: 605140,
  dimensions: '4.04m (W) x 5.91m (L) x 3.97m (H)',
  scaleFactor: 1.0,
  notes:
    'The Space Exploration Vehicle (MMSEV) is already modeled at 1:1 meter scale. Shadow acne is mitigated via -0.0004 bias, with 2048 shadow map filtering across the 413k triangle chassis.',
};

