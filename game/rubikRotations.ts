import { CellValue } from './types';

export type FaceAxis = 'x' | 'y' | 'z';

interface C { x: number; y: number; z: number; }

function idx(x: number, y: number, z: number): number {
  return x + y * 3 + z * 9;
}

function coords(i: number): C {
  return { x: i % 3, y: Math.floor(i / 3) % 3, z: Math.floor(i / 9) };
}

/**
 * 90° CW rotation looking from the positive direction of each axis.
 *
 * Z-axis CW (from +z / front): (x,y) → (2-y, x)
 *   Cycle: (0,0)→(2,0)→(2,2)→(0,2)→(0,0) ✓
 *
 * Y-axis CW (from +y / top):   (x,z) → (2-z, x)
 *   Cycle: (0,0)→(2,0)→(2,2)→(0,2)→(0,0) ✓
 *
 * X-axis CW (from +x / right): (y,z) → (z, 2-y)
 *   Cycle: (0,0)→(0,2)→(2,2)→(2,0)→(0,0) ✓
 */
function applyRotCW(c: C, axis: FaceAxis): C {
  const { x, y, z } = c;
  switch (axis) {
    case 'z': return { x: 2 - y, y: x, z };
    case 'y': return { x: 2 - z, y, z: x };
    case 'x': return { x, y: z, z: 2 - y };
  }
}

function applyRotCCW(c: C, axis: FaceAxis): C {
  // CCW is 3× CW
  return applyRotCW(applyRotCW(applyRotCW(c, axis), axis), axis);
}

/** Rotate all 27 cells of a mini-board by the given axis/direction. */
function rotateCells(cells: CellValue[], axis: FaceAxis, cw: boolean): CellValue[] {
  const result = new Array(27).fill(null) as CellValue[];
  for (let i = 0; i < 27; i++) {
    const c = coords(i);
    const nc = cw ? applyRotCW(c, axis) : applyRotCCW(c, axis);
    result[idx(nc.x, nc.y, nc.z)] = cells[i];
  }
  return result;
}

/**
 * Apply a face/slice rotation to the macro board.
 * - axis: which axis the slice is perpendicular to
 * - layer: 0 = back/bottom/left, 1 = middle, 2 = front/top/right
 * - cw: clockwise when looking from the positive direction of the axis
 *
 * Each board on the face moves to its new position, and the cells inside
 * that board are also rotated (the board physically turned in 3D space).
 */
export function applyFaceRotation(
  macroCells: CellValue[],
  miniBoards: CellValue[][],
  axis: FaceAxis,
  layer: 0 | 1 | 2,
  cw: boolean,
): { macroCells: CellValue[]; miniBoards: CellValue[][] } {
  const newMacro = [...macroCells];
  const newMini = [...miniBoards];

  for (let i = 0; i < 27; i++) {
    const c = coords(i);
    const onFace =
      (axis === 'x' && c.x === layer) ||
      (axis === 'y' && c.y === layer) ||
      (axis === 'z' && c.z === layer);
    if (!onFace) continue;

    const nc = cw ? applyRotCW(c, axis) : applyRotCCW(c, axis);
    const ni = idx(nc.x, nc.y, nc.z);
    newMacro[ni] = macroCells[i];
    newMini[ni] = rotateCells(miniBoards[i], axis, cw);
  }

  return { macroCells: newMacro, miniBoards: newMini };
}

export const FACE_LABELS: Record<FaceAxis, [string, string, string]> = {
  x: ['Left', 'Mid', 'Right'],
  y: ['Bottom', 'Mid', 'Top'],
  z: ['Back', 'Mid', 'Front'],
};

export const AXIS_LABELS: Record<FaceAxis, string> = {
  x: 'X-Axis',
  y: 'Y-Axis',
  z: 'Z-Axis',
};
