import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type * as THREE from 'three';
import { GameState } from '../game/types';
import MacroCell from './MacroCell';

interface CubeViewProps {
  gameState: GameState;
  onBoardSelect: (boardIndex: number) => void;
  xColor: string;
  oColor: string;
  show3DSymbols: boolean;
  movedBoards?: number[];
  rotationKey?: number;
}

function indexToPosition(i: number): [number, number, number] {
  const x = i % 3;
  const y = Math.floor(i / 3) % 3;
  const z = Math.floor(i / 9);
  return [x - 1, y - 1, z - 1];
}

const BASE_CAMERA: [number, number, number] = [4.5, 3.5, 5.5];
// Radius of a sphere that holds the whole 3x3x3 cube with a little margin.
const CUBE_RADIUS = 2.9;

// The camera's field of view is vertical, so on a narrow portrait screen the sides of the
// cube fall off the edges. Back the camera off until the cube fits the narrower dimension.
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const halfV = (cam.fov * Math.PI) / 360;
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    const need = CUBE_RADIUS / Math.sin(Math.min(halfV, halfH));
    const base = Math.hypot(...BASE_CAMERA);
    cam.position.set(...BASE_CAMERA).setLength(Math.max(base, need));
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function SceneContents({ gameState, onBoardSelect, xColor, oColor, show3DSymbols, movedBoards, rotationKey }: CubeViewProps) {
  const { macroCells, requiredBoard, winner, isDraw, winningLine } = gameState;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.4} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8888ff" />
      <axesHelper args={[2.2]} />

      {Array.from({ length: 27 }, (_, i) => {
        const isRequired = requiredBoard === i;
        const isSelectable =
          !winner &&
          !isDraw &&
          macroCells[i] === null &&
          (requiredBoard === null || requiredBoard === i);
        const isWinning = winningLine ? winningLine.includes(i) : false;
        const wasMoved = movedBoards ? movedBoards.includes(i) : false;

        return (
          <MacroCell
            key={i}
            boardIndex={i}
            position={indexToPosition(i)}
            miniBoard={gameState.miniBoards[i]}
            macroValue={macroCells[i]}
            isRequired={isRequired}
            isSelectable={isSelectable}
            isWinning={isWinning}
            flashTrigger={wasMoved ? (rotationKey ?? 0) : 0}
            onSelect={onBoardSelect}
            xColor={xColor}
            oColor={oColor}
            show3DSymbols={show3DSymbols}
          />
        );
      })}

      <OrbitControls
        enableZoom={true}
        minDistance={2.5}
        maxDistance={20}
        enablePan={false}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={(Math.PI * 5) / 6}
      />
    </>
  );
}

export default function CubeView({ gameState, onBoardSelect, xColor, oColor, show3DSymbols, movedBoards, rotationKey }: CubeViewProps) {
  return (
    <View style={styles.wrapper}>
      <Canvas
        style={styles.canvas}
        gl={{ alpha: true }}
        camera={{ position: [4.5, 3.5, 5.5], fov: 45, near: 0.1, far: 100 }}
      >
        <FitCamera />
        <SceneContents
          gameState={gameState}
          onBoardSelect={onBoardSelect}
          xColor={xColor}
          oColor={oColor}
          show3DSymbols={show3DSymbols}
          movedBoards={movedBoards}
          rotationKey={rotationKey}
        />
      </Canvas>

      <View style={styles.axisLegend} pointerEvents="none">
        <Text style={styles.axisRow}>
          <Text style={styles.red}>─ </Text>
          <Text style={styles.axisLabel}>X Right</Text>
        </Text>
        <Text style={styles.axisRow}>
          <Text style={styles.green}>─ </Text>
          <Text style={styles.axisLabel}>Y Up</Text>
        </Text>
        <Text style={styles.axisRow}>
          <Text style={styles.blue}>─ </Text>
          <Text style={styles.axisLabel}>Z Front</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  canvas: { flex: 1 },
  axisLegend: { position: 'absolute', bottom: 8, left: 12, gap: 2 },
  axisRow: { fontSize: 10 },
  axisLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  red: { color: '#ff4444', fontSize: 13, fontWeight: '900' },
  green: { color: '#44ff44', fontSize: 13, fontWeight: '900' },
  blue: { color: '#4488ff', fontSize: 13, fontWeight: '900' },
});
