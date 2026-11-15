import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
    // LUNAR BASE INTERIOR TARGETS (28.14m x 41.04m AUTHENTIC BASE)
    // -------------------------------------------------------------
    // Step 3: South Corridor / Airlock Exit Staging Console
    {
      id: 'interior_prep_bench',
      title: 'Airlock Operations & Staging Console',
      actionText: 'PRESS [E] TO INITIALIZE SUIT PREPARATION',
      position: [-1.4, 1.14, 17.5],
      radius: 1.5,
      environment: 'interior',
      stationType: 'habitat_prep_bench',
      requiredObjective: 'prep_astronaut',
    },

    // Step 4: Crew Quarters - Suit Selection Station
    {
      id: 'interior_suit_station',
      title: 'EVA Spacesuit Station',
      actionText: 'PRESS [E] TO SELECT & EQUIP SPACESUIT',
      position: [-12.2, 1.14, -2.5],
      radius: 1.5,
      environment: 'interior',
      stationType: 'suit_selection',
      requiredObjective: 'select_suit',
    },

    // Step 5: Crew Quarters - Component Inspection Glovebox
    {
      id: 'interior_inspection_bench',
      title: 'Component Inspection Glovebox',
      actionText: 'PRESS [E] TO SCAN HELMET & GLOVES',
      position: [-5.0, 1.14, -5.0],
      radius: 1.5,
      environment: 'interior',
      stationType: 'helmet_inspection',
      requiredObjective: 'inspect_components',
    },

    // Step 6: Engineering Bay - PLSS Life Support Gantry
    {
      id: 'interior_plss_gantry',
      title: 'PLSS Life Support Gantry',
      actionText: 'PRESS [E] TO ENGAGE HOIST & MOUNT PLSS',
      position: [7.8, 1.14, -5.2],
      radius: 1.5,
      environment: 'interior',
      stationType: 'plss_station',
      requiredObjective: 'mount_plss',
    },

    // Step 7: Engineering Bay - High-Pressure O2 Supply Manifold
    {
      id: 'interior_oxygen_station',
      title: 'High-Pressure O2 Supply Manifold',
      actionText: 'PRESS [E] TO OPEN O2 VALVE & VERIFY 5.8 MPa',
      position: [12.8, 1.14, -4.5],
      radius: 1.5,
      environment: 'interior',
      stationType: 'oxygen_check',
      requiredObjective: 'verify_oxygen',
    },

    // Step 8: Command Bridge - Suit Pressure Diagnostic Console
    {
      id: 'interior_pressure_station',
      title: 'Suit Pressure Diagnostic Console',
      actionText: 'PRESS [E] TO ACTIVATE SUIT PRESSURE TEST (29.6 kPa)',
      position: [-3.8, 1.14, -14.5],
      radius: 1.5,
      environment: 'interior',
      stationType: 'pressure_check',
      requiredObjective: 'test_pressure',
    },

    // Step 9: Command Bridge - Mission Comms & Radio Terminal
    {
      id: 'interior_radio_station',
      title: 'Mission Comms Radio Terminal',
      actionText: 'PRESS [E] TO TEST PTT COMM CHECK WITH HOUSTON',
      position: [3.8, 1.14, -14.5],
      radius: 1.5,
      environment: 'interior',
      stationType: 'comms_check',
      requiredObjective: 'verify_radio',
    },

    // Step 10: Engineering Bay - LCVG Cooling Chiller Loop
    {
      id: 'interior_cooling_station',
      title: 'LCVG Chiller Loop Station',
      actionText: 'PRESS [E] TO ENGAGE COOLING CHILLER LOOP',
      position: [6.8, 1.14, -2.5],
      radius: 1.8,
      environment: 'interior',
      stationType: 'cooling_inspection',
      requiredObjective: 'test_cooling',
    },

    // Step 11: South Airlock Module (Inner Pressure Hatch)
    {
      id: 'interior_airlock_chamber',
      title: 'Airlock Chamber Hatch',
      actionText: 'PRESS [E] TO ENTER AIRLOCK & SECURE INNER HATCH',
      position: [0.0, 1.14, 19.4],
      radius: 1.8,
      environment: 'interior',
      stationType: 'airlock_chamber',
      requiredObjective: 'enter_airlock',
    },

    // Step 12: South Airlock Module (Depressurization Console)
    {
      id: 'interior_airlock_console',
      title: 'Airlock Depressurization Console',
      actionText: 'PRESS [E] TO CYCLE AIRLOCK DEPRESSURIZATION',
      position: [1.2, 1.14, 21.0],
      radius: 1.5,
      environment: 'interior',
      stationType: 'airlock_cycle_console',
      requiredObjective: 'depressurize_airlock',
    },

    // Step 13: South Airlock Outer Blast Door (to Lunar Surface)
    {
      id: 'interior_airlock_exit',
      title: 'Airlock Outer Blast Door',
      actionText: 'PRESS [E] OR [ENTER] TO EGRESS ONTO LUNAR SURFACE',
      position: [0.0, 1.14, 22.4],
      radius: 1.5,
      environment: 'interior',
      stationType: 'habitat_exit',
      requiredObjective: 'exit_surface',
    },
  ], [currentObjectiveIndex]);

  // Track closest target without triggering re-render cascades
  const lastTargetIdRef = useRef<string | null>(null);

  useFrame(() => {
    // Read instantaneous 3D player position directly to eliminate React state batching lag
    const px = (typeof window !== 'undefined' && (window as unknown as { __PLAYER_POS__?: { x: number; y: number; z: number } }).__PLAYER_POS__)
      ? (window as unknown as { __PLAYER_POS__: { x: number; y: number; z: number } }).__PLAYER_POS__.x
      : playerPosition[0];
    const pz = (typeof window !== 'undefined' && (window as unknown as { __PLAYER_POS__?: { x: number; y: number; z: number } }).__PLAYER_POS__)
      ? (window as unknown as { __PLAYER_POS__: { x: number; y: number; z: number } }).__PLAYER_POS__.z
      : playerPosition[2];

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

    // Only the active mission objective station should trigger, preventing out-of-order skips
    let closestTarget: InteractiveTarget | null = activeMatch;
    if (!closestTarget && !activeObjective) {
      let minDist = Infinity;
      for (const target of relevantTargets) {
        // Skip stations for objectives that are already completed
        const targetObj = objectives.find((o) => o.id === target.requiredObjective);
        if (targetObj?.completed) continue;

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

    if (typeof window !== 'undefined') {
      (window as unknown as { __INTERACTION_DEBUG__?: unknown }).__INTERACTION_DEBUG__ = {
        playerPosition: [px, 0.06, pz],
        currentEnvironment,
        currentObjectiveIndex,
        activeObjectiveId: activeObjective?.id,
        relevantTargetsCount: relevantTargets.length,
        activeMatchId: activeMatch?.id,
        closestTargetId: closestTarget?.id,
        lastTargetId: lastTargetIdRef.current,
      };
    }
  });

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
