export interface InteriorRoomZone {
  id: string;
  name: string;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export const INTERIOR_ROOM_ZONES: InteriorRoomZone[] = [
  {
    id: 'airlock',
    name: 'Airlock Chamber',
    bounds: {
      minX: -2.0,
      maxX: 2.0,
      minZ: 18.5,
      maxZ: 23.5,
    },
    // Mounted in NE ceiling corner of airlock chamber
    cameraPosition: [1.2, 2.65, 19.8],
    cameraTarget: [0.0, 1.15, 21.0],
  },
  {
    id: 'corridor_south',
    name: 'South Access Corridor',
    bounds: {
      minX: -2.0,
      maxX: 2.0,
      minZ: 7.0,
      maxZ: 18.5,
    },
    // Looking down south corridor towards airlock
    cameraPosition: [1.2, 2.65, 8.5],
    cameraTarget: [0.0, 1.15, 13.5],
  },
  {
    id: 'cargo_bay',
    name: 'East Cargo Bay',
    bounds: {
      minX: 2.0,
      maxX: 14.5,
      minZ: 9.5,
      maxZ: 22.5,
    },
    // High corner CCTV overview of cargo bay
    cameraPosition: [13.2, 4.8, 11.0],
    cameraTarget: [9.5, 1.2, 16.5],
  },
  {
    id: 'corridor_junction',
    name: 'Central Junction & Medbay Passage',
    bounds: {
      minX: -4.0,
      maxX: 4.0,
      minZ: 3.0,
      maxZ: 7.0,
    },
    cameraPosition: [1.3, 2.65, 3.5],
    cameraTarget: [0.0, 1.15, 5.0],
  },
  {
    id: 'medbay',
    name: 'Medbay & Science Lab',
    bounds: {
      minX: -10.5,
      maxX: -4.0,
      minZ: 2.0,
      maxZ: 8.0,
    },
    cameraPosition: [-4.5, 2.8, 2.5],
    cameraTarget: [-7.5, 1.15, 5.0],
  },
  {
    id: 'corridor_mid',
    name: 'Mid Corridor',
    bounds: {
      minX: -2.0,
      maxX: 2.0,
      minZ: -1.0,
      maxZ: 3.0,
    },
    cameraPosition: [1.2, 2.65, 2.5],
    cameraTarget: [0.0, 1.15, 1.0],
  },
  {
    id: 'crew_quarters',
    name: 'Crew Quarters & Suit Prep Area',
    bounds: {
      minX: -14.2,
      maxX: -2.0,
      minZ: -7.2,
      maxZ: 1.0,
    },
    // High corner CCTV in Crew Quarters looking at suit pedestals, mess table, lockers
    cameraPosition: [-6.5, 2.85, 0.2],
    cameraTarget: [-10.0, 1.15, -3.5],
  },
  {
    id: 'engineering',
    name: 'Engineering & Life Support',
    bounds: {
      minX: 2.0,
      maxX: 14.2,
      minZ: -7.2,
      maxZ: 1.0,
    },
    // High ceiling CCTV overlooking reactor core, consoles, coolant tanks
    cameraPosition: [6.8, 4.4, 0.2],
    cameraTarget: [10.5, 1.3, -3.0],
  },
  {
    id: 'corridor_north',
    name: 'Bridge Access Corridor',
    bounds: {
      minX: -2.0,
      maxX: 2.0,
      minZ: -9.5,
      maxZ: -1.0,
    },
    cameraPosition: [1.2, 2.65, -1.5],
    cameraTarget: [0.0, 1.15, -5.5],
  },
  {
    id: 'bridge',
    name: 'Command Bridge',
    bounds: {
      minX: -5.5,
      maxX: 5.5,
      minZ: -18.5,
      maxZ: -9.5,
    },
    // High rear corner camera looking forward across captain chair and helm console
    cameraPosition: [3.8, 3.1, -10.5],
    cameraTarget: [0.0, 1.15, -14.5],
  },
];

export function getRoomZoneForPosition(x: number, z: number): InteriorRoomZone {
  for (const zone of INTERIOR_ROOM_ZONES) {
    if (
      x >= zone.bounds.minX &&
      x <= zone.bounds.maxX &&
      z >= zone.bounds.minZ &&
      z <= zone.bounds.maxZ
    ) {
      return zone;
    }
  }
  // Default to airlock zone if outside defined bounds
  return INTERIOR_ROOM_ZONES[0];
}

