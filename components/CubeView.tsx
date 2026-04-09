import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GameState } from '../game/types';
import MacroCell from './MacroCell';

interface CubeViewProps {
  gameState: GameState;
  onBoardSelect: (boardIndex: number) => void;
  xColor: string;
  oColor: string;
  show3DSymbols: boolean;
  movedBoards?: number[]; // boards that just rotated — triggers flash
  rotationKey?: number;   // increments each rotation, used as flash trigger
}

function indexToPosition(i: number): [number, number, number] {
  const x = i % 3;
  const y = Math.floor(i / 3) % 3;
  const z = Math.floor(i / 9);
  return [x - 1, y - 1, z - 1];
}

function SceneContents({ gameState, onBoardSelect, xColor, oColor, show3DSymbols, movedBoards, rotationKey }: CubeViewProps) {
  const { macroCells, requiredBoard, winner, isDraw, winningLine } = gameState;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.4} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8888ff" />

      {/* Orientation axes — shows X/Y/Z as Red/Green/Blue lines from origin */}
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
        maxDistance={14}
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

      {/* Axis legend — RN overlay in bottom-left corner */}
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
  wrapper: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  axisLegend: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    gap: 2,
  },
  axisRow: {
    fontSize: 10,
  },
  axisLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
  },
  red: { color: '#ff4444', fontSize: 13, fontWeight: '900' },
  green: { color: '#44ff44', fontSize: 13, fontWeight: '900' },
  blue: { color: '#4488ff', fontSize: 13, fontWeight: '900' },
});
