import {
  EXTERIOR_BOX_OBSTACLES,
  INTERIOR_BOX_OBSTACLES,
  LUNAR_CYLINDER_OBSTACLES,
} from '../../utils/terrainHeight';
import type { GameEnvironment, InteractiveTarget } from '../../types/game';

interface CollisionDebugVisualizerProps {
  environment: GameEnvironment;
  targets: InteractiveTarget[];
  visible: boolean;
}

export function CollisionDebugVisualizer({
  environment,
  targets,
  visible,
}: CollisionDebugVisualizerProps) {
  if (!visible) return null;

  const boxes = environment === 'exterior' ? EXTERIOR_BOX_OBSTACLES : INTERIOR_BOX_OBSTACLES;

  return (
    <group name="collision-debug-visualizer">
      {/* Box Obstacles */}
      {boxes.map((box) => {
        const width = box.maxX - box.minX;
        const depth = box.maxZ - box.minZ;
        const centerX = (box.minX + box.maxX) / 2;
        const centerZ = (box.minZ + box.maxZ) / 2;
        const height = 2.4;

        return (
          <mesh key={box.name} position={[centerX, height / 2 + 0.05, centerZ]}>
            <boxGeometry args={[width, height, depth]} />
            <meshBasicMaterial color="#e63946" wireframe />
          </mesh>
        );
      })}

      {/* Exterior Cylinders */}
      {environment === 'exterior' &&
        LUNAR_CYLINDER_OBSTACLES.map((cyl) => (
          <mesh key={cyl.name} position={[cyl.x, 2.0, cyl.z]}>
            <cylinderGeometry args={[cyl.radius, cyl.radius, 4.0, 16]} />
            <meshBasicMaterial color="#f4a261" wireframe />
          </mesh>
        ))}

      {/* Interaction Radii */}
      {targets
        .filter((t) => t.environment === environment)
        .map((t) => (
          <mesh
            key={t.id}
            position={[t.position[0], t.position[1] + 0.08, t.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[t.radius - 0.04, t.radius, 32]} />
            <meshBasicMaterial color="#2a9d8f" />
          </mesh>
        ))}
    </group>
  );
}

