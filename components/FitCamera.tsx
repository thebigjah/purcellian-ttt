import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type * as THREE from 'three';

interface Props {
  base: [number, number, number];
  // Radius of a sphere that holds everything that must stay on screen.
  radius: number;
}

// The camera's field of view is vertical, so on a narrow portrait screen the sides of a
// cube fall off the edges. Back the camera off along its starting direction until the
// sphere fits the narrower dimension; wide screens keep the starting distance.
export default function FitCamera({ base, radius }: Props) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const halfV = (cam.fov * Math.PI) / 360;
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    const need = radius / Math.sin(Math.min(halfV, halfH));
    cam.position.set(...base).setLength(Math.max(Math.hypot(...base), need));
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, base, radius]);
  return null;
}
