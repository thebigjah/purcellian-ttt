import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CellValue, Player } from '../game/types';
import { COLORS } from '../utils/colors';
import { OSymbol3D, XSymbol3D } from './Symbols3D';

function indexToPosition(i: number): [number, number, number] {
  const x = i % 3;
  const y = Math.floor(i / 3) % 3;
  const z = Math.floor(i / 9);
  return [x - 1, y - 1, z - 1];
}

function getRenderOrder(cellIndex: number): number {
  const z = Math.floor(cellIndex / 9);
  return 2 - z;
}

// Layer 2 (z=+1) is Front (closest to camera at Z+). Layer 0 (z=-1) is Back.
// Within a layer, y=2 is top → show it first (top row in panel).
// CELL_ORDER: local indices within a 9-cell layer, top-to-bottom, left-to-right
const CELL_ORDER = [6, 7, 8, 3, 4, 5, 0, 1, 2]; // y=2 → y=1 → y=0
const LAYER_DISPLAY_ORDER = [2, 1, 0]; // Front → Mid → Back
const LAYER_LABELS = ['Front', 'Mid', 'Back'];

interface MiniCellProps {
  cellIndex: number;
  value: CellValue;
  onPress: (index: number) => void;
  xColor: string;
  oColor: string;
  show3DSymbols: boolean;
}

function MiniCell({ cellIndex, value, onPress, xColor, oColor, show3DSymbols }: MiniCellProps) {
  const isOccupied = value !== null && value !== 'DRAW';
  const renderOrder = getRenderOrder(cellIndex);

  const color = value === 'X' ? xColor : value === 'O' ? oColor : '#2a4a6a';
  const boxOpacity = show3DSymbols && isOccupied ? 0 : (isOccupied ? 0.88 : 0.32);

  return (
    <group position={indexToPosition(cellIndex)} renderOrder={renderOrder}>
      {/* Click target box — always present */}
      <mesh
        onClick={(e) => {
          if (e.delta < 8 && !value) {
            e.stopPropagation();
            onPress(cellIndex);
          }
        }}
      >
        <boxGeometry args={[0.82, 0.82, 0.82]} />
        <meshStandardMaterial
          color={show3DSymbols && isOccupied ? '#000000' : color}
          transparent
          opacity={boxOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* 3D symbol overlay */}
      {show3DSymbols && value === 'X' && <XSymbol3D color={xColor} size={0.9} />}
      {show3DSymbols && value === 'O' && <OSymbol3D color={oColor} size={0.9} />}
    </group>
  );
}

interface MiniBoardSceneProps {
  boardState: CellValue[];
  onCellPress: (cellIndex: number) => void;
  xColor: string;
  oColor: string;
  show3DSymbols: boolean;
}

function MiniBoardScene({ boardState, onCellPress, xColor, oColor, show3DSymbols }: MiniBoardSceneProps) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 8, 5]} intensity={1.2} />
      <pointLight position={[-4, -4, -4]} intensity={0.4} color="#8888ff" />
      <axesHelper args={[1.8]} />

      {boardState.map((value, i) => (
        <MiniCell
          key={i}
          cellIndex={i}
          value={value}
          onPress={onCellPress}
          xColor={xColor}
          oColor={oColor}
          show3DSymbols={show3DSymbols}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        minDistance={2}
        maxDistance={10}
        enablePan={false}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={(Math.PI * 5) / 6}
      />
    </>
  );
}

// Layer selector — Front first, y=2 (top) at top of each grid
interface MiniLayerSelectorProps {
  boardState: CellValue[];
  onCellPress: (cellIndex: number) => void;
  isWon: boolean;
  xColor: string;
  oColor: string;
}

function MiniLayerSelector({ boardState, onCellPress, isWon, xColor, oColor }: MiniLayerSelectorProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  let cellSize: number;
  if (isLandscape) {
    const availableH = height - insets.top - insets.bottom - 50;
    const maxByHeight = Math.floor((availableH - 3 * 18 - 20) / 9);
    const availW = Math.min(width * 0.22, 110);
    const maxByWidth = Math.floor((availW - 12) / 3);
    cellSize = Math.min(maxByHeight, maxByWidth, 28);
  } else {
    cellSize = Math.floor(((width - 32) / 3 - 8) / 3);
  }

  return (
    <View style={isLandscape ? miniSelectorStyles.containerLandscape : miniSelectorStyles.container}>
      {LAYER_DISPLAY_ORDER.map((layer, displayIdx) => (
        <View key={layer} style={miniSelectorStyles.layer}>
          <RNText style={miniSelectorStyles.layerLabel}>{LAYER_LABELS[displayIdx]}</RNText>
          <View style={[miniSelectorStyles.grid, { width: cellSize * 3 + 4 }]}>
            {CELL_ORDER.map((localIdx) => {
              const cellIndex = layer * 9 + localIdx;
              const value = boardState[cellIndex];
              const canPlay = !isWon && value === null;

              let bg: string;
              if (value === 'X') bg = xColor;
              else if (value === 'O') bg = oColor;
              else if (value === 'DRAW') bg = COLORS.boardDraw;
              else bg = 'transparent';

              return (
                <TouchableOpacity
                  key={localIdx}
                  style={[
                    miniSelectorStyles.cell,
                    { width: cellSize, height: cellSize, backgroundColor: bg },
                    !canPlay && !value && miniSelectorStyles.cellDisabled,
                  ]}
                  onPress={() => canPlay && onCellPress(cellIndex)}
                  activeOpacity={canPlay ? 0.5 : 1}
                  disabled={!canPlay}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const miniSelectorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 6,
    gap: 4,
  },
  containerLandscape: {
    flexDirection: 'column',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 6,
    justifyContent: 'space-around',
  },
  layer: { flex: 1, alignItems: 'center', gap: 4 },
  layerLabel: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.45,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { borderRadius: 3, borderWidth: 1, borderColor: '#334466' },
  cellDisabled: { opacity: 0.3 },
});

// Main component

interface MiniBoardCubeViewProps {
  visible: boolean;
  boardIndex: number | null;
  boardState: CellValue[];
  macroValue: CellValue;
  currentPlayer: Player;
  onCellPress: (cellIndex: number) => void;
  onCancel: () => void;
  xColor: string;
  oColor: string;
  show3DSymbols: boolean;
}

export default function MiniBoardCubeView({
  visible,
  boardIndex,
  boardState,
  macroValue,
  currentPlayer,
  onCellPress,
  onCancel,
  xColor,
  oColor,
  show3DSymbols,
}: MiniBoardCubeViewProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  if (!visible || boardIndex === null) return null;

  const isWon = macroValue !== null;
  const playerColor = currentPlayer === 'X' ? xColor : oColor;
  const boardNum = boardIndex + 1;
  const headerPadTop = isLandscape ? insets.top + 4 : insets.top + 12;
  const bottomPad = insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPadTop }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <RNText style={styles.cancelText}>Cancel</RNText>
        </TouchableOpacity>
        <RNText style={[styles.title, { color: playerColor }]}>
          {isWon
            ? `Board ${boardNum} — ${macroValue === 'DRAW' ? 'Tied' : `${macroValue} Won`}`
            : `Board ${boardNum} — ${currentPlayer}'s Turn`}
        </RNText>
        <View style={{ width: 64 }} />
      </View>

      <RNText style={styles.hint}>
        {isWon ? 'This board is closed' : 'Pinch to zoom • Rotate • Tap a cell'}
      </RNText>

      <View style={[styles.middleArea, isLandscape && styles.middleAreaLandscape, { paddingBottom: isLandscape ? 0 : bottomPad }]}>
      <View style={styles.canvasWrapper}>
        <Canvas
          style={styles.canvas}
          gl={{ alpha: true }}
          camera={{ position: [3, 2.5, 4], fov: 50, near: 0.1, far: 100 }}
        >
          <MiniBoardScene
            boardState={boardState}
            onCellPress={isWon ? () => {} : onCellPress}
            xColor={xColor}
            oColor={oColor}
            show3DSymbols={show3DSymbols}
          />
        </Canvas>

        <View style={styles.axisLegend} pointerEvents="none">
          <RNText style={styles.axisRow}><RNText style={styles.red}>─ </RNText><RNText style={styles.axisLabel}>X Right</RNText></RNText>
          <RNText style={styles.axisRow}><RNText style={styles.green}>─ </RNText><RNText style={styles.axisLabel}>Y Up</RNText></RNText>
          <RNText style={styles.axisRow}><RNText style={styles.blue}>─ </RNText><RNText style={styles.axisLabel}>Z Front</RNText></RNText>
        </View>
      </View>

      <MiniLayerSelector
        boardState={boardState}
        onCellPress={onCellPress}
        isWon={isWon}
        xColor={xColor}
        oColor={oColor}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.background, zIndex: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  cancelBtn: { padding: 8, width: 64 },
  cancelText: { color: COLORS.text, opacity: 0.55, fontSize: 14 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', flex: 1, letterSpacing: 0.3 },
  hint: { color: COLORS.text, opacity: 0.4, fontSize: 11, textAlign: 'center', marginBottom: 2 },
  middleArea: { flex: 1, flexDirection: 'column' },
  middleAreaLandscape: { flexDirection: 'row' },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1 },
  axisLegend: { position: 'absolute', bottom: 8, left: 12, gap: 2 },
  axisRow: { fontSize: 10 },
  axisLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  red: { color: '#ff4444', fontSize: 13, fontWeight: '900' },
  green: { color: '#44ff44', fontSize: 13, fontWeight: '900' },
  blue: { color: '#4488ff', fontSize: 13, fontWeight: '900' },
});
