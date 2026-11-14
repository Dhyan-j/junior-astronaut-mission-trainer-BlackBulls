import type { CameraPreset, CameraTargetId } from '../types/mission';
import type { MissionObjective, SpacesuitId, SpacesuitMeta } from '../types/game';

export const SPACESUITS: Record<SpacesuitId, SpacesuitMeta> = {
  z2: {
    id: 'z2',
    name: 'Z-2 Prototype',
    fullName: 'NASA Z-2 Advanced Planetary Surface Spacesuit',
    designation: 'Z-2 Prototype (2014)',
    modelPath: '/models/Z2 Spacesuit.glb',
    description:
      'Engineered for maximum crew mobility on the Martian and Lunar surfaces. Features a rear-entry composite hard upper torso (HUT), high-mobility shoulder and hip bearings, and suitport dock compatibility.',
    massKg: 65,
    operatingPressureKPa: 29.6, // 4.3 psi nominal
    surfaceOptimized: true,
    scaleFactor: 1.0,
    heightMeters: 1.95,
    historicEra: 'Next-Gen Exploration (Artemis / Mars)',
    suitportCompatible: true,
  },
  mark3: {
    id: 'mark3',
    name: 'Mark III',
    fullName: 'NASA Mark III Advanced Technology Spacesuit',
    designation: 'Mark III Hard Torso (2000)',
    modelPath: '/models/Mark III Spacesuit.glb',
    description:
      'Rigid composite hybrid surface suit proven during NASA Desert RATS analog missions. Incorporates rolling convolute joints, high operating pressure (57 kPa) reducing prebreathe duration, and rear entry hatch.',
    massKg: 59,
    operatingPressureKPa: 56.5, // 8.2 psi high-pressure
    surfaceOptimized: true,
    scaleFactor: 0.98,
    heightMeters: 1.92,
    historicEra: 'Planetary Surface Mobility Prototype',
    suitportCompatible: true,
  },
  emu: {
    id: 'emu',
    name: 'Shuttle / ISS EMU',
    fullName: 'NASA Extravehicular Mobility Unit (EMU)',
    designation: 'Shuttle/ISS Flight Hardware (1981-Present)',
    modelPath: '/models/Extravehicular Mobility Unit.glb',
    description:
      'The iconic two-piece semi-rigid spacesuit that performed over 200 spacewalks on the Space Shuttle and International Space Station. Optimized for zero-gravity microgravity orbital operations.',
    massKg: 145, // Full system with life support backpack
    operatingPressureKPa: 29.6, // 4.3 psi
    surfaceOptimized: false,
    scaleFactor: 1.0,
    heightMeters: 1.98,
    historicEra: 'Shuttle & Space Station Era',
    suitportCompatible: false,
  },
};

export const MISSION_01_OBJECTIVES: MissionObjective[] = [
  {
    id: 'approach_habitat',
    stepNumber: 1,
    title: 'Approach Large Domed Habitat',
    shortDescription: 'Walk from the lunar surface to the Large Domed Habitat entrance airlock.',
    detailedInstruction:
      'Locate the Large Domed Habitat and approach the threshold ramp at the main entrance airlock doorway.',
    targetStation: 'Habitat Main Entrance Airlock',
    completed: false,
  },
  {
    id: 'enter_habitat',
    stepNumber: 2,
    title: 'Enter Pressurized Base',
    shortDescription: 'Cycle the airlock hatch and enter the pressurized Interior Work Bay.',
    detailedInstruction:
      'Step up to the airlock hatch and press [E] or [ENTER] to cycle the hatch and enter the habitat.',
    targetStation: 'Airlock Entrance Hatch',
    completed: false,
  },
  {
    id: 'prep_astronaut',
    stepNumber: 3,
    title: 'Initialize Suit Preparation',
    shortDescription: 'Proceed to the Work Bay Equipment Console and initialize telemetry.',
    detailedInstruction:
      'Approach the equipment console and press [E] to connect biomedical telemetry and begin suit staging.',
    targetStation: 'Work Bay Equipment Console',
    completed: false,
  },
  {
    id: 'select_suit',
    stepNumber: 4,
    title: 'Select Spacesuit Configuration',
    shortDescription: 'Select and equip your NASA spacesuit for lunar surface EVA.',
    detailedInstruction:
      'Approach the EVA suit station and press [E] to inspect specifications and equip the surface suit.',
    targetStation: 'EVA Spacesuit Station',
    completed: false,
  },
  {
    id: 'inspect_components',
    stepNumber: 5,
    title: 'Inspect Helmet & Visor',
    shortDescription: 'Conduct detailed laser inspection of helmet seals, visor, and seals at glovebox.',
    detailedInstruction:
      'Approach the inspection glovebox and press [E] to verify neck ring seals, gold visor solar attenuation, and HUD parallax.',
    targetStation: 'Component Inspection Glovebox',
    completed: false,
  },
  {
    id: 'mount_plss',
    stepNumber: 6,
    title: 'Mount PLSS Life Support',
    shortDescription: 'Engage mechanical hoist and latch the Portable Life Support System.',
    detailedInstruction:
      'Approach the PLSS stowage gantry and press [E] to lock umbilical connectors and verify latches.',
    targetStation: 'PLSS Life Support Gantry',
    completed: false,
  },
  {
    id: 'verify_oxygen',
    stepNumber: 7,
    title: 'Verify O2 Tank Pressure',
    shortDescription: 'Open high-pressure O2 valve and verify primary loop at 5.8 MPa.',
    detailedInstruction:
      'Approach the O2 COPV manifold, press [E] to rotate the valve wheel, and verify pressure dial.',
    targetStation: 'O2 Supply Manifold',
    completed: false,
  },
  {
    id: 'test_pressure',
    stepNumber: 8,
    title: 'Conduct Suit Pressure Test',
    shortDescription: 'Seal suit pressure boundary and verify nominal differential pressure at 29.6 kPa.',
    detailedInstruction:
      'Approach the suit pressure console and press [E] to run automated pressurization test.',
    targetStation: 'Suit Pressure Console',
    completed: false,
  },
  {
    id: 'verify_radio',
    stepNumber: 9,
    title: 'Verify Comm Radio with Houston',
    shortDescription: 'Test push-to-talk primary and backup UHF radio loops with Mission Control.',
    detailedInstruction:
      'Approach the laptop comms station and press [E] to conduct radio checks and verify audio levels.',
    targetStation: 'Mission Comms Radio',
    completed: false,
  },
  {
    id: 'test_cooling',
    stepNumber: 10,
    title: 'Inspect Liquid Cooling Garment',
    shortDescription: 'Engage LCVG chiller pump and verify fluid loop flow and core temperature.',
    detailedInstruction:
      'Approach the LCVG cooling station and press [E] to initiate coolant pump and inspect loop flow.',
    targetStation: 'LCVG Chiller Station',
    completed: false,
  },
  {
    id: 'enter_airlock',
    stepNumber: 11,
    title: 'Enter Egress Airlock Chamber',
    shortDescription: 'Step into the airlock chamber and secure the inner pressure hatch.',
    detailedInstruction:
      'Approach the airlock hatch and press [E] to step inside and seal the interior door.',
    targetStation: 'Airlock Chamber Hatch',
    completed: false,
  },
  {
    id: 'depressurize_airlock',
    stepNumber: 12,
    title: 'Depressurize Airlock',
    shortDescription: 'Initiate airlock vacuum pump cycle down to 0.0 kPa.',
    detailedInstruction:
      'Approach the airlock depressurization console and press [E] to cycle down from 101.3 kPa to vacuum.',
    targetStation: 'Airlock Depressurization Console',
    completed: false,
  },
  {
    id: 'exit_surface',
    stepNumber: 13,
    title: 'Egress onto Lunar Surface',
    shortDescription: 'Open outer blast door and step out onto the lunar regolith to complete qualification.',
    detailedInstruction:
      'With airlock at vacuum, step to the outer blast door and press [E] or [ENTER] to egress.',
    targetStation: 'Outer Blast Door',
    completed: false,
  },
];

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
    name: 'Large Domed Habitat',
    position: [-13.5, 4.5, -6],
    target: [-13.5, 1.8, -12.25],
    description: 'Main entrance of the Large Domed Habitat',
  },
  astronaut: {
    id: 'astronaut',
    name: 'Playable Astronaut',
    position: [-11.0, 3.2, 0.0],
    target: [-11.0, 1.4, -5.0],
    description: 'Third-person trailing view of the astronaut trainee',
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
  hasSkeletalAnimation: true,
  animationCount: 2,
  skinCount: 1,
  details:
    'astronaut_rigged.glb integrated into playable controller with 24 humanoid bones, walking (1.0s) and running (0.625s) skeletal animation tracks, and bind pose procedural breathing.',
};

export const ROVER_PERFORMANCE_INFO = {
  triangleCount: 413198,
  vertexCount: 605140,
  dimensions: '4.04m (W) x 5.91m (L) x 3.97m (H)',
  scaleFactor: 1.0,
  notes:
    'The Space Exploration Vehicle (MMSEV) is modeled at 1:1 meter scale. Shadow acne is mitigated via -0.0004 bias, with 2048 shadow map filtering across the 413k triangle chassis.',
};
