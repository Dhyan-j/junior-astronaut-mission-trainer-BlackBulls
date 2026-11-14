export type CameraTargetId =
  | 'overview'
  | 'habitat'
  | 'astronaut'
  | 'rover'
  | 'solar'
  | 'biodome';

export interface CameraPreset {
  id: CameraTargetId;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  description: string;
}

export interface SimulatedTelemetry {
  oxygenPercent: number;
  oxygenPressureKPa: number;
  powerOutputKW: number;
  batteryReservePercent: number;
  waterReservePercent: number;
  waterReserveLiters: number;
  habitatPressureKPa: number;
  cabinTempCelsius: number;
  surfaceTempCelsius: number;
  radiationUSvH: number;
  isSimulated: true;
}

export interface ModelStatus {
  id: string;
  filename: string;
  category: string;
  loaded: boolean;
  error?: string;
  details?: string;
}

