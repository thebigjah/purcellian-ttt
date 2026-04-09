import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CubeView from '../components/CubeView';
import MiniBoardCubeView from '../components/MiniBoardCubeView';
import TurnBorder from '../components/TurnBorder';
import { getAIMove } from '../game/ai';
import { createInitialState, gameReducer } from '../game/gameReducer';
import { AXIS_LABELS, FACE_LABELS, FaceAxis } from '../game/rubikRotations';
import { GameState, MoveRecord } from '../game/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/colors';
import { useSettings } from '../utils/SettingsContext';
import RotateFacePanel from '../components/RotateFacePanel';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;
interface Props { navigation: GameScreenNavigationProp; }

// Layer 2 (z=+1, boards 18-26) is FRONT (closest to camera at Z+5.5)
// Layer 0 (z=-1, boards 0-8) is BACK
// Within each layer: y=2 (top) appears at top of grid
const LAYER_DISPLAY_ORDER = [2, 1, 0]; // Front → Mid → Back
const LAYER_LABELS = ['Front', 'Mid', 'Back'];
const CELL_ORDER = [6, 7, 8, 3, 4, 5, 0, 1, 2]; // y=2 first, y=0 last

interface BoardSelectorProps {
  gameState: GameState;
  onSelect: (boardIndex: number) => void;
  xColor: string;
  oColor: string;
  isLandscape: boolean;
}

function BoardSelector({ gameState, onSelect, xColor, oColor, isLandscape }: BoardSelectorProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { macroCells, requiredBoard, winner, isDraw } = gameState;

  let cellSize: number;
  if (isLandscape) {
    const availableH = height - insets.top - insets.bottom - 50;
    const maxByHeight = Math.floor((availableH - 3 * 18 - 20) / 9);
    const availableW = Math.min(width * 0.22, 110);
    const maxByWidth = Math.floor((availableW - 12) / 3);
    cellSize = Math.min(maxByHeight, maxByWidth, 28);
  } else {
    cellSize = Math.floor(((width - 32) / 3 - 8) / 3);
  }

  const containerStyle = isLandscape ? bss.containerLandscape : bss.container;
  const layerStyle = isLandscape ? bss.layerLandscape : bss.layer;

  return (
    <View style={containerStyle}>
      {LAYER_DISPLAY_ORDER.map((layer, displayIdx) => (
        <View key={layer} style={layerStyle}>
          <Text style={bss.layerLabel}>{LAYER_LABELS[displayIdx]}</Text>
          <View style={[bss.grid, { width: cellSize * 3 + 4 }]}>
            {CELL_ORDER.map((localIdx) => {
              const boardIndex = layer * 9 + localIdx;
              const macroValue = macroCells[boardIndex];
              const isRequired = requiredBoard === boardIndex;
              const isSelectable =
                !winner && !isDraw && macroValue === null &&
                (requiredBoard === null || requiredBoard === boardIndex);

              let bg =
                macroValue === 'X' ? xColor :
                macroValue === 'O' ? oColor :
                macroValue === 'DRAW' ? COLORS.boardDraw :
                isRequired ? COLORS.boardActive : 'transparent';

              return (
                <TouchableOpacity
                  key={localIdx}
                  style={[
                    bss.cell,
                    { width: cellSize, height: cellSize, backgroundColor: bg },
                    isRequired && bss.cellRequired,
                    !isSelectable && !macroValue && bss.cellDisabled,
                  ]}
                  onPress={() => isSelectable && onSelect(boardIndex)}
                  activeOpacity={isSelectable ? 0.6 : 1}
                  disabled={!isSelectable && macroValue === null}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const bss = StyleSheet.create({
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
  layer: { flex: 1, alignItems: 'center', gap: 3 },
  layerLandscape: { alignItems: 'center', gap: 2 },
  layerLabel: {
    color: COLORS.text, fontSize: 9, fontWeight: '600',
    opacity: 0.45, letterSpacing: 1, textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { borderRadius: 3, borderWidth: 1, borderColor: '#334466' },
  cellRequired: { borderColor: COLORS.boardActive, borderWidth: 2 },
  cellDisabled: { opacity: 0.3 },
});

export default function GameScreen({ navigation }: Props) {
  const { playerColors, modifiers, addWin } = useSettings();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [moveHistory, setMoveHistory] = useState<GameState[]>([]);
  const [moveLog, setMoveLog] = useState<MoveRecord[]>([]);
  const [rotatePanelVisible, setRotatePanelVisible] = useState(false);
  const [movedBoards, setMovedBoards] = useState<number[]>([]);
  const [rotationKey, setRotationKey] = useState(0);
  const resultCredited = useRef(false);
  const aiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Replay mode
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Replay state array: [initial, after move 1, ..., final]
  const replayStates = isReplayMode ? [...moveHistory, state] : [];
  const replayMaxStep = replayStates.length - 1;
  const replayDisplayState = isReplayMode ? replayStates[replayStep] : state;

  // Credit score once when game ends
  useEffect(() => {
    if ((state.winner || state.isDraw) && !resultCredited.current) {
      resultCredited.current = true;
      addWin(state.winner ?? 'DRAW');
    }
  }, [state.winner, state.isDraw]);

  // AI: trigger move when it's AI's turn
  useEffect(() => {
    if (!modifiers.aiEnabled) return;
    if (state.winner || state.isDraw) return;
    if (isReplayMode) return;
    if (state.currentPlayer !== 'O') return; // AI always plays O

    aiTimeout.current = setTimeout(() => {
      const move = getAIMove(state, modifiers.aiDifficulty);
      if (!move) return;
      setMoveHistory(prev => [...prev, state]);
      setMoveLog(prev => [...prev, { boardIndex: move.boardIndex, cellIndex: move.cellIndex, player: 'O' }]);
      dispatch({ type: 'PLACE_MARK', boardIndex: move.boardIndex, cellIndex: move.cellIndex });
      if (modifiers.hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 420);

    return () => {
      if (aiTimeout.current) clearTimeout(aiTimeout.current);
    };
  }, [state, modifiers.aiEnabled, modifiers.aiDifficulty, isReplayMode]);

  // Auto-play replay
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setReplayStep(prev => {
          if (prev >= replayMaxStep) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isAutoPlaying, replayMaxStep]);

  const handleBoardSelect = useCallback((boardIndex: number) => {
    if (state.winner || state.isDraw) return;
    if (modifiers.aiEnabled && state.currentPlayer === 'O') return; // AI's turn
    if (state.requiredBoard !== null && state.requiredBoard !== boardIndex) return;
    if (state.macroCells[boardIndex] !== null) return;
    setSelectedBoard(boardIndex);
    setOverlayVisible(true);
  }, [state, modifiers.aiEnabled]);

  const handleCellPress = useCallback((cellIndex: number) => {
    if (selectedBoard === null) return;
    setMoveHistory(prev => [...prev, state]);
    setMoveLog(prev => [...prev, { boardIndex: selectedBoard, cellIndex, player: state.currentPlayer }]);
    dispatch({ type: 'PLACE_MARK', boardIndex: selectedBoard, cellIndex });
    setOverlayVisible(false);
    setSelectedBoard(null);
    if (modifiers.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectedBoard, state, modifiers.hapticFeedback]);

  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return;
    // If AI is enabled, undo 2 moves (undo AI's response + player's move)
    const stepsBack = modifiers.aiEnabled && moveHistory.length >= 2 ? 2 : 1;
    const prev = moveHistory[moveHistory.length - stepsBack];
    setMoveHistory(h => h.slice(0, -stepsBack));
    setMoveLog(l => l.slice(0, -stepsBack));
    dispatch({ type: 'LOAD_SNAPSHOT', state: prev });
    if (state.winner || state.isDraw) {
      resultCredited.current = false;
    }
    if (modifiers.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }
  }, [moveHistory, state.winner, state.isDraw, modifiers.hapticFeedback, modifiers.aiEnabled]);

  const handleCancelMiniBoard = useCallback(() => {
    setOverlayVisible(false);
    setSelectedBoard(null);
  }, []);

  const handleRotate = useCallback((axis: FaceAxis, layer: 0 | 1 | 2, cw: boolean) => {
    if (state.winner || state.isDraw) return;

    // Compute which boards are on this face (for flash animation)
    const faceBoards: number[] = [];
    for (let i = 0; i < 27; i++) {
      const x = i % 3, y = Math.floor(i / 3) % 3, z = Math.floor(i / 9);
      if ((axis === 'x' && x === layer) || (axis === 'y' && y === layer) || (axis === 'z' && z === layer)) {
        faceBoards.push(i);
      }
    }

    const desc = `${axis.toUpperCase()} · ${FACE_LABELS[axis][layer]} · ${cw ? 'CW' : 'CCW'}`;
    setMoveHistory(prev => [...prev, state]);
    setMoveLog(prev => [...prev, {
      boardIndex: -1,
      cellIndex: -1,
      player: state.currentPlayer,
      isRotation: true,
      rotateDesc: desc,
    }]);
    dispatch({ type: 'ROTATE_FACE', axis, layer, cw });
    setRotatePanelVisible(false);

    // Trigger flash on moved boards
    setMovedBoards(faceBoards);
    setRotationKey(k => k + 1);
    setTimeout(() => setMovedBoards([]), 600);

    if (modifiers.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [state, modifiers.hapticFeedback]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    setSelectedBoard(null);
    setOverlayVisible(false);
    setMoveHistory([]);
    setMoveLog([]);
    setMovedBoards([]);
    resultCredited.current = false;
    setIsReplayMode(false);
    setIsAutoPlaying(false);
  }, []);

  const handleStartReplay = useCallback(() => {
    setReplayStep(0);
    setIsAutoPlaying(false);
    setIsReplayMode(true);
  }, []);

  const handleExitReplay = useCallback(() => {
    setIsReplayMode(false);
    setIsAutoPlaying(false);
  }, []);

  const replayCaption = (() => {
    if (!isReplayMode) return '';
    if (replayStep === 0 || !moveLog[replayStep - 1]) return 'Start of game';
    const m = moveLog[replayStep - 1];
    if (m.isRotation) return `Move ${replayStep}: ${m.player} rotated ${m.rotateDesc}`;
    return `Move ${replayStep}: ${m.player} → Board ${m.boardIndex + 1}, Cell ${m.cellIndex + 1}`;
  })();

  const currentPlayerColor = state.currentPlayer === 'X' ? playerColors.X : playerColors.O;

  const statusText = state.winner
    ? `${state.winner} Wins!`
    : state.isDraw ? 'Draw!'
    : state.requiredBoard !== null
      ? `${state.currentPlayer} — Board ${state.requiredBoard + 1}`
      : `${state.currentPlayer} — Any Board`;

  const statusColor = state.winner
    ? (state.winner === 'X' ? playerColors.X : playerColors.O)
    : state.isDraw ? COLORS.boardDraw : currentPlayerColor;

  const headerPadTop = isLandscape ? insets.top + 4 : insets.top + 12;
  // Ensure bottom of UI clears the system nav bar
  const bottomPad = insets.bottom;

  const isAIThinking = modifiers.aiEnabled && state.currentPlayer === 'O' && !state.winner && !state.isDraw;

  if (isReplayMode) {
    return (
      <View style={styles.container}>
        {/* Replay header */}
        <View style={[styles.header, { paddingTop: headerPadTop }]}>
          <TouchableOpacity onPress={handleExitReplay} style={styles.backBtn}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.status}>
            <Text style={{ color: COLORS.gold }}>REPLAY</Text>
            <Text style={{ color: COLORS.text, opacity: 0.5 }}>  {replayStep}/{replayMaxStep}</Text>
          </Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Replay caption */}
        <Text style={styles.replayCaption}>{replayCaption}</Text>

        {/* Cube view (read-only) */}
        <View style={[styles.mainArea, isLandscape && styles.mainAreaLandscape, { paddingBottom: isLandscape ? 0 : bottomPad }]}>
          <View style={styles.cubeContainer}>
            <CubeView
              gameState={replayDisplayState}
              onBoardSelect={() => {}}
              xColor={playerColors.X}
              oColor={playerColors.O}
              show3DSymbols={modifiers.show3DSymbols}
            />
          </View>
          <View style={isLandscape ? [styles.sidebarWrapper, { paddingBottom: bottomPad, paddingRight: insets.right }] : undefined}>
            <BoardSelector
              gameState={replayDisplayState}
              onSelect={() => {}}
              xColor={playerColors.X}
              oColor={playerColors.O}
              isLandscape={isLandscape}
            />
          </View>
        </View>

        {/* Replay controls */}
        <View style={[styles.replayBar, { paddingBottom: isLandscape ? 4 : bottomPad + 8 }]}>
          <TouchableOpacity
            style={styles.replayBtn}
            onPress={() => { setReplayStep(0); setIsAutoPlaying(false); }}
            disabled={replayStep === 0}
          >
            <Text style={[styles.replayBtnText, replayStep === 0 && styles.replayBtnDisabled]}>{'|<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.replayBtn}
            onPress={() => { setReplayStep(s => Math.max(0, s - 1)); setIsAutoPlaying(false); }}
            disabled={replayStep === 0}
          >
            <Text style={[styles.replayBtnText, replayStep === 0 && styles.replayBtnDisabled]}>{'<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.replayBtn, styles.replayBtnPlay]}
            onPress={() => setIsAutoPlaying(a => !a)}
          >
            <Text style={styles.replayBtnPlayText}>{isAutoPlaying ? '||' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.replayBtn}
            onPress={() => { setReplayStep(s => Math.min(replayMaxStep, s + 1)); setIsAutoPlaying(false); }}
            disabled={replayStep >= replayMaxStep}
          >
            <Text style={[styles.replayBtnText, replayStep >= replayMaxStep && styles.replayBtnDisabled]}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.replayBtn}
            onPress={() => { setReplayStep(replayMaxStep); setIsAutoPlaying(false); }}
            disabled={replayStep >= replayMaxStep}
          >
            <Text style={[styles.replayBtnText, replayStep >= replayMaxStep && styles.replayBtnDisabled]}>{'>|'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TurnBorder
        currentPlayer={state.winner ? null : state.currentPlayer}
        xColor={playerColors.X}
        oColor={playerColors.O}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPadTop }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Menu'}</Text>
        </TouchableOpacity>
        <Text style={[styles.status, { color: isAIThinking ? COLORS.gold : statusColor }]}>
          {isAIThinking ? 'AI thinking...' : statusText}
        </Text>
        <View style={styles.headerRight}>
          {moveHistory.length > 0 && !state.winner && !state.isDraw && !isAIThinking && (
            <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
              <Text style={styles.undoText}>Undo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rubik rotate hint bar — only visible when the move is available */}
      {modifiers.rubikMode && !overlayVisible && !state.winner && !state.isDraw &&
        state.requiredBoard === null && !isAIThinking && (
        <TouchableOpacity
          style={styles.rotateHintBar}
          onPress={() => setRotatePanelVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.rotateHintText}>↻  Rotate a Face  (uses your turn)</Text>
        </TouchableOpacity>
      )}

      {/* Main area: cube + selector. Landscape = row, portrait = column */}
      {!overlayVisible && (
        <View style={[styles.mainArea, isLandscape && styles.mainAreaLandscape, { paddingBottom: isLandscape ? 0 : bottomPad }]}>
          <View style={styles.cubeContainer}>
            <CubeView
              gameState={state}
              onBoardSelect={handleBoardSelect}
              xColor={playerColors.X}
              oColor={playerColors.O}
              show3DSymbols={modifiers.show3DSymbols}
              movedBoards={movedBoards}
              rotationKey={rotationKey}
            />
          </View>
          <View style={isLandscape ? [styles.sidebarWrapper, { paddingBottom: bottomPad, paddingRight: insets.right }] : undefined}>
            <BoardSelector
              gameState={state}
              onSelect={handleBoardSelect}
              xColor={playerColors.X}
              oColor={playerColors.O}
              isLandscape={isLandscape}
            />
          </View>
        </View>
      )}

      {/* 3D mini-board view */}
      <MiniBoardCubeView
        visible={overlayVisible}
        boardIndex={selectedBoard}
        boardState={selectedBoard !== null ? state.miniBoards[selectedBoard] : Array(27).fill(null)}
        macroValue={selectedBoard !== null ? state.macroCells[selectedBoard] : null}
        currentPlayer={state.currentPlayer}
        onCellPress={handleCellPress}
        onCancel={handleCancelMiniBoard}
        xColor={playerColors.X}
        oColor={playerColors.O}
        show3DSymbols={modifiers.show3DSymbols}
      />

      {/* Rubik rotate panel */}
      <RotateFacePanel
        visible={rotatePanelVisible}
        currentPlayer={state.currentPlayer}
        playerColor={state.currentPlayer === 'X' ? playerColors.X : playerColors.O}
        onRotate={handleRotate}
        onCancel={() => setRotatePanelVisible(false)}
      />

      {/* Game-over banner */}
      {(state.winner || state.isDraw) && !overlayVisible && (
        <View style={styles.gameOverBanner}>
          <Text style={[styles.gameOverTitle, { color: statusColor }]}>
            {state.winner ? `${state.winner} Wins!` : 'Draw!'}
          </Text>
          <View style={styles.gameOverButtons}>
            {moveLog.length > 0 && (
              <TouchableOpacity style={styles.replayGameBtn} onPress={handleStartReplay}>
                <Text style={styles.replayGameBtnText}>Replay</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.playAgainBtn} onPress={handleReset}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.text, opacity: 0.6, fontSize: 14 },
  status: { fontSize: 14, fontWeight: '700', textAlign: 'center', flex: 1, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  undoBtn: { padding: 8 },
  undoText: { color: COLORS.gold, opacity: 0.85, fontSize: 13 },
  resetBtn: { padding: 8 },
  resetText: { color: COLORS.text, opacity: 0.6, fontSize: 14 },
  mainArea: { flex: 1, flexDirection: 'column' },
  mainAreaLandscape: { flexDirection: 'row' },
  cubeContainer: { flex: 1 },
  sidebarWrapper: { justifyContent: 'center' },
  gameOverBanner: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    zIndex: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gameOverTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 1, marginBottom: 14 },
  gameOverButtons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  replayGameBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  replayGameBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 15, opacity: 0.8 },
  playAgainBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  playAgainText: { color: '#000', fontWeight: '800', fontSize: 16 },
  replayCaption: {
    color: COLORS.text,
    opacity: 0.45,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  replayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 44,
    alignItems: 'center',
  },
  replayBtnPlay: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.gold,
    paddingHorizontal: 20,
  },
  replayBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  replayBtnPlayText: { color: COLORS.gold, fontSize: 16, fontWeight: '900' },
  replayBtnDisabled: { opacity: 0.25 },
  rotateHintBar: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.07)',
    alignItems: 'center',
  },
  rotateHintText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
    letterSpacing: 0.3,
  },
});
