export type SpacesuitId = 'z2' | 'mark3' | 'emu';

export interface SpacesuitMeta {
  id: SpacesuitId;
  name: string;
  fullName: string;
  designation: string;
  modelPath: string;
  description: string;
  massKg: number;
  operatingPressureKPa: number;
  surfaceOptimized: boolean;
  scaleFactor: number;
  heightMeters: number;
  historicEra: string;
  suitportCompatible: boolean;
}

export type GameEnvironment = 'exterior' | 'interior';

export type ObjectiveId =
  | 'approach_habitat'
  | 'enter_habitat'
  | 'prep_astronaut'
  | 'select_suit'
  | 'inspect_components'
  | 'mount_plss'
  | 'verify_oxygen'
  | 'test_pressure'
  | 'verify_radio'
  | 'test_cooling'
  | 'enter_airlock'
  | 'depressurize_airlock'
  | 'exit_surface';

export interface MissionObjective {
  id: ObjectiveId;
  stepNumber: number;
  title: string;
  shortDescription: string;
  detailedInstruction: string;
  targetStation: string;
  completed: boolean;
}

export interface PlayerInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
  interact: boolean;
}

export type StationType =
  | 'habitat_airlock_entry'
  | 'habitat_prep_bench'
  | 'suit_selection'
  | 'helmet_inspection'
  | 'gloves_boots_inspection'
  | 'plss_station'
  | 'oxygen_check'
  | 'pressure_check'
  | 'comms_check'
  | 'cooling_inspection'
  | 'airlock_chamber'
  | 'airlock_cycle_console'
  | 'habitat_exit';

export interface InteractiveTarget {
  id: string;
  title: string;
  actionText: string;
  position: [number, number, number];
  radius: number;
  environment: GameEnvironment;
  stationType: StationType;
  requiredObjective?: ObjectiveId;
}

export type CameraMode = 'third_person' | 'first_person' | 'inspection';

export interface MissionState {
  currentObjectiveIndex: number;
  objectives: MissionObjective[];
  selectedSuit: SpacesuitId;
  plssInstalled: boolean;
  oxygenChecked: boolean;
  pressureChecked: boolean;
  commsVerified: boolean;
  coolingInspected: boolean;
  helmetInspected: boolean;
  glovesBootsInspected: boolean;
  airlockEntered: boolean;
  airlockCycled: boolean;
  surfaceExited: boolean;
  missionCompleted: boolean;
  simulatedOxygenPercent: number;
  simulatedPressureKPa: number;
  simulatedCoolingLoopTemp: number;
  simulatedBatteryHours: number;
  isMuted: boolean;
  currentEnvironment: GameEnvironment;
}

export interface RoverTelemetry {
  speed: number; // m/s
  speedKmh: number; // km/h
  battery: number; // % (0-100)
  totalDistance: number; // meters
  heading: number; // degrees (0-360)
  isBraking: boolean;
  isReversing: boolean;
  driveMode: 'DRIVE' | 'REVERSE' | 'PARK' | 'BRAKE';
}

export interface GeologicalSample {
  id: string;
  name: string;
  scientificName: string;
  era: string;
  rockType: 'Anorthosite' | 'Basalt' | 'Breccia' | 'Pyroclastic Glass' | 'Volcanic Glass';
  position: [number, number, number];
  color: string;
  description: string;
  composition: { mineral: string; percentage: number }[];
  significance: string;
  massGrams: number;
  collected: boolean;
}
