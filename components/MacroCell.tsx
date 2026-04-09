import { useFrame } from '@react-three/fiber/native';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CellValue } from '../game/types';
import { COLORS } from '../utils/colors';
import { OSymbol3D, XSymbol3D } from './Symbols3D';

const BOX_GEO = new THREE.BoxGeometry(0.85, 0.85, 0.85);
const EDGES_GEO = new THREE.EdgesGeometry(BOX_GEO);

interface MacroCellProps {
  boardIndex: number;
  position: [number, number, number];
  miniBoard: CellValue[];
  macroValue: CellValue;
  isRequired: boolean;
  isSelectable: boolean;
  isWinning: boolean;
  flashTrigger: number; // increments when this board just rotated
  onSelect: (index: number) => void;
  xColor: string;
  oColor: string;
  show3DSymbols: boolean;
}

function getRenderOrder(boardIndex: number): number {
  const z = Math.floor(boardIndex / 9);
  return 2 - z;
}

function miniIndexToPosition(i: number): [number, number, number] {
  const x = i % 3;
  const y = Math.floor(i / 3) % 3;
  const z = Math.floor(i / 9);
  return [x - 1, y - 1, z - 1];
}

export default function MacroCell({
  boardIndex,
  position,
  miniBoard,
  macroValue,
  isRequired,
  isSelectable,
  isWinning,
  flashTrigger,
  onSelect,
  xColor,
  oColor,
  show3DSymbols,
}: MacroCellProps) {
  const isWon = macroValue !== null;
  const renderOrder = getRenderOrder(boardIndex);
  const groupRef = useRef<THREE.Group>(null);
  const pulseTime = useRef(0);
  const flashIntensity = useRef(0);

  // Trigger flash burst when flashTrigger increments
  useEffect(() => {
    if (flashTrigger > 0) {
      flashIntensity.current = 1.0;
    }
  }, [flashTrigger]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Decay the flash burst
    if (flashIntensity.current > 0) {
      flashIntensity.current = Math.max(0, flashIntensity.current - delta * 3.5);
    }

    const flashBoost = flashIntensity.current * 0.22;

    if (isWinning) {
      pulseTime.current += delta;
      const pulse = 1 + 0.10 * Math.sin(pulseTime.current * 7);
      const base = isRequired ? 1.04 : 1;
      groupRef.current.scale.setScalar((base + flashBoost) * pulse);
    } else {
      const base = isRequired ? 1.04 : 1;
      groupRef.current.scale.setScalar(base + flashBoost);
    }
  });

  let shellColor: string;
  if (macroValue === 'X') shellColor = xColor;
  else if (macroValue === 'O') shellColor = oColor;
  else if (macroValue === 'DRAW') shellColor = COLORS.boardDraw;
  else shellColor = '#2a4a6a';

  const shellOpacity = isWinning ? 0.92 : isWon ? 0.72 : isRequired ? 0.40 : 0.22;
  const edgeOpacity = isWinning ? 1.0 : isRequired ? 0.90 : 0.55;
  const edgeColor = isWinning ? '#ffffff' : isRequired ? COLORS.boardActive : '#5588bb';
  // Scale is handled by useFrame; initial scale for non-animated state
  const scale: [number, number, number] = isRequired ? [1.04, 1.04, 1.04] : [1, 1, 1];

  const miniScale = 0.26;
  const miniBoxSize = 0.72;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh
        geometry={BOX_GEO}
        renderOrder={renderOrder}
        onClick={(e) => {
          if (e.delta < 8 && isSelectable) {
            e.stopPropagation();
            onSelect(boardIndex);
          }
        }}
      >
        <meshStandardMaterial
          color={isRequired ? COLORS.boardActive : shellColor}
          emissive={isRequired ? '#886600' : '#000000'}
          emissiveIntensity={isRequired ? 0.35 : 0}
          transparent
          opacity={shellOpacity}
          depthWrite={false}
        />
      </mesh>

      <lineSegments geometry={EDGES_GEO} renderOrder={renderOrder + 0.5}>
        <lineBasicMaterial color={edgeColor} transparent opacity={edgeOpacity} />
      </lineSegments>

      {/* Mini-board dots / symbols */}
      {!isWon && miniBoard.map((cellValue, i) => {
        if (!cellValue || cellValue === 'DRAW') return null;
        const [mx, my, mz] = miniIndexToPosition(i);
        const pos: [number, number, number] = [mx * miniScale, my * miniScale, mz * miniScale];
        const color = cellValue === 'X' ? xColor : oColor;

        if (show3DSymbols) {
          return (
            <group key={i} position={pos} renderOrder={renderOrder + 1}>
              {/* Semi-transparent box so the symbol has a clear anchor in 3D space */}
              <mesh renderOrder={renderOrder + 1}>
                <boxGeometry args={[miniBoxSize * miniScale, miniBoxSize * miniScale, miniBoxSize * miniScale]} />
                <meshStandardMaterial color={color} transparent opacity={0.30} depthWrite={false} />
              </mesh>
              {cellValue === 'X'
                ? <XSymbol3D color={color} size={miniScale * 1.1} />
                : <OSymbol3D color={color} size={miniScale * 1.1} />}
            </group>
          );
        }

        return (
          <mesh key={i} position={pos} renderOrder={renderOrder + 1}>
            <boxGeometry args={[miniBoxSize * miniScale, miniBoxSize * miniScale, miniBoxSize * miniScale]} />
            <meshStandardMaterial color={color} transparent opacity={0.95} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}
