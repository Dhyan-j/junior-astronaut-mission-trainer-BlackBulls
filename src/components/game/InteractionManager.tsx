import { useMemo, useEffect, useRef } from 'react';
import { InteractiveStationMarker } from './InteractiveStationMarker';
import type { GameEnvironment, InteractiveTarget, MissionObjective } from '../../types/game';

interface InteractionManagerProps {
  playerPosition: [number, number, number];
  currentEnvironment: GameEnvironment;
  objectives: MissionObjective[];
  currentObjectiveIndex: number;
  onActiveTargetChange: (target: InteractiveTarget | null) => void;
  onObjectiveCompleted?: (stepIndex: number) => void;
}

export function InteractionManager({
  playerPosition,
  currentEnvironment,
  objectives,
  currentObjectiveIndex,
  onActiveTargetChange,
  onObjectiveCompleted,
}: InteractionManagerProps) {
  const activeObjective = objectives[currentObjectiveIndex];

  const allTargets = useMemo((): InteractiveTarget[] => [
    // -------------------------------------------------------------
    // EXTERIOR TARGETS (LARGE DOMED HABITAT ENTRANCE)
    // -------------------------------------------------------------
    {
      id: 'exterior_airlock_entry',
      title: 'Large Domed Habitat Main Entrance',
      actionText: currentObjectiveIndex === 0
        ? 'APPROACH DOME AIRLOCK THRESHOLD RAMP'
        : 'PRESS [E] OR [ENTER] TO CYCLE AIRLOCK & ENTER HABITAT',
      position: [-13.5, 0.04, -12.25],
      radius: 3.5,
      environment: 'exterior',
      stationType: 'habitat_airlock_entry',
      requiredObjective: currentObjectiveIndex === 0 ? 'approach_habitat' : 'enter_habitat',
    },

    // -------------------------------------------------------------
    // INTERIOR TARGETS (AUTHENTIC WORK BAY GEOMETRY)
    // -------------------------------------------------------------
    {
      id: 'interior_prep_bench',
      title: 'Work Bay Equipment Console',
      actionText: 'PRESS [E] TO INITIALIZE SUIT PREPARATION',
      position: [-1.45, 0.06, -1.8],
      radius: 2.2,
      environment: 'interior',
      stationType: 'habitat_prep_bench',
      requiredObjective: 'prep_astronaut',
    },
    {
      id: 'interior_suit_station',
      title: 'EVA Spacesuit Station',
      actionText: 'PRESS [E] TO SELECT & EQUIP SPACESUIT',
      position: [-1.2, 0.06, 0.2],
      radius: 2.6,
      environment: 'interior',
      stationType: 'suit_selection',
      requiredObjective: 'select_suit',
    },
    {
      id: 'interior_inspection_bench',
      title: 'Component Inspection Glovebox',
      actionText: 'PRESS [E] TO SCAN HELMET & GLOVES',
      position: [0.1, 0.06, -1.8],
      radius: 2.2,
      environment: 'interior',
      stationType: 'helmet_inspection',
      requiredObjective: 'inspect_components',
    },
    {
      id: 'interior_plss_gantry',
      title: 'PLSS Life Support Gantry',
      actionText: 'PRESS [E] TO ENGAGE HOIST & MOUNT PLSS',
      position: [-2.6, 0.06, -1.8],
      radius: 2.5,
      environment: 'interior',
      stationType: 'plss_station',
      requiredObjective: 'mount_plss',
    },
    {
      id: 'interior_oxygen_station',
      title: 'High-Pressure O2 Supply Manifold',
      actionText: 'PRESS [E] TO OPEN O2 VALVE & VERIFY 5.8 MPa',
      position: [-2.6, 0.06, 1.8],
      radius: 2.2,
      environment: 'interior',
      stationType: 'oxygen_check',
      requiredObjective: 'verify_oxygen',
    },
    {
      id: 'interior_pressure_station',
      title: 'Suit Pressure Diagnostic Console',
      actionText: 'PRESS [E] TO ACTIVATE SUIT PRESSURE TEST (29.6 kPa)',
      position: [-1.45, 0.06, 1.8],
      radius: 2.2,
      environment: 'interior',
      stationType: 'pressure_check',
      requiredObjective: 'test_pressure',
    },
    {
      id: 'interior_radio_station',
      title: 'Mission Comms Radio Terminal',
      actionText: 'PRESS [E] TO TEST PTT COMM CHECK WITH HOUSTON',
      position: [1.2, 0.6, 1.8],
      radius: 2.2,
      environment: 'interior',
      stationType: 'comms_check',
      requiredObjective: 'verify_radio',
    },
    {
      id: 'interior_cooling_station',
      title: 'LCVG Chiller Loop Station',
      actionText: 'PRESS [E] TO ENGAGE COOLING CHILLER LOOP',
      position: [-0.3, 0.06, 1.8],
      radius: 2.2,
      environment: 'interior',
      stationType: 'cooling_inspection',
      requiredObjective: 'test_cooling',
    },
    {
      id: 'interior_airlock_chamber',
      title: 'Airlock Chamber Hatch',
      actionText: 'PRESS [E] TO ENTER AIRLOCK & SECURE INNER HATCH',
      position: [0, 0.06, 3.2],
      radius: 2.2,
      environment: 'interior',
      stationType: 'airlock_chamber',
      requiredObjective: 'enter_airlock',
    },
    {
      id: 'interior_airlock_console',
      title: 'Airlock Depressurization Console',
      actionText: 'PRESS [E] TO CYCLE AIRLOCK DEPRESSURIZATION',
      position: [1.15, 0.06, 3.2],
      radius: 2.2,
      environment: 'interior',
      stationType: 'airlock_cycle_console',
      requiredObjective: 'depressurize_airlock',
    },
    {
      id: 'interior_airlock_exit',
      title: 'Airlock Outer Blast Door',
      actionText: 'PRESS [E] OR [ENTER] TO EGRESS ONTO LUNAR SURFACE',
      position: [0, 0.06, 3.6],
      radius: 2.4,
      environment: 'interior',
      stationType: 'habitat_exit',
      requiredObjective: 'exit_surface',
    },
  ], [currentObjectiveIndex]);

  // Track closest target without triggering re-render cascades
  const lastTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const [px, , pz] = playerPosition;

    // Filter targets by environment matching player
    const relevantTargets = allTargets.filter(
      (t) => t.environment === currentEnvironment
    );

    // Find if player is within radius of active required objective target
    let activeMatch: InteractiveTarget | null = null;

    if (activeObjective) {
      const targetForObjective = relevantTargets.find(
        (t) => t.requiredObjective === activeObjective.id
      );

      if (targetForObjective) {
        const [tx, , tz] = targetForObjective.position;
        const dist = Math.hypot(px - tx, pz - tz);
        if (dist <= targetForObjective.radius) {
          activeMatch = targetForObjective;
        }
      }
    }

    // Step 1 auto-completion: when player reaches the dome entrance threshold
    if (
      currentObjectiveIndex === 0 &&
      currentEnvironment === 'exterior' &&
      activeObjective?.id === 'approach_habitat'
    ) {
      const distToThreshold = Math.hypot(px - -13.5, pz - -12.25);
      if (distToThreshold <= 3.2) {
        onObjectiveCompleted?.(0);
      }
    }

    // If no active required match, check closest target in range
    let closestTarget: InteractiveTarget | null = activeMatch;
    if (!closestTarget) {
      let minDist = Infinity;
      for (const target of relevantTargets) {
        const [tx, , tz] = target.position;
        const dist = Math.hypot(px - tx, pz - tz);
        if (dist <= target.radius && dist < minDist) {
          minDist = dist;
          closestTarget = target;
        }
      }
    }

    const targetKey = closestTarget
      ? `${closestTarget.id}_${currentObjectiveIndex}`
      : null;

    if (targetKey !== lastTargetIdRef.current) {
      lastTargetIdRef.current = targetKey;
      onActiveTargetChange(closestTarget);
    }
  }, [
    playerPosition,
    currentEnvironment,
    currentObjectiveIndex,
    activeObjective,
    allTargets,
    onActiveTargetChange,
    onObjectiveCompleted,
  ]);

  // Identify active target for 3D waypoint rendering
  const activeStation = useMemo(() => {
    if (!activeObjective) return null;
    return allTargets.find(
      (t) =>
        t.requiredObjective === activeObjective.id &&
        t.environment === currentEnvironment
    );
  }, [activeObjective, allTargets, currentEnvironment]);

  return (
    <group name="interaction-markers-root">
      {/* Active Objective 3D Waypoint Marker */}
      {activeStation && (
        <InteractiveStationMarker
          key={`station-${activeStation.id}`}
          position={activeStation.position}
          radius={activeStation.radius}
          isCurrentObjective={true}
          isPlayerInRange={
            Math.hypot(
              playerPosition[0] - activeStation.position[0],
              playerPosition[2] - activeStation.position[2]
            ) <= activeStation.radius
          }
          label={activeStation.title}
        />
      )}
    </group>
  );
}
