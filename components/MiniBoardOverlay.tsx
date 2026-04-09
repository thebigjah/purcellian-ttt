import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CellValue, Player } from '../game/types';
import { COLORS } from '../utils/colors';

const { width: screenWidth } = Dimensions.get('window');

interface MiniBoardOverlayProps {
  visible: boolean;
  boardIndex: number | null;
  boardState: CellValue[];
  macroValue: CellValue;
  currentPlayer: Player;
  onCellPress: (cellIndex: number) => void;
  xColor: string;
  oColor: string;
}

export default function MiniBoardOverlay({
  visible,
  boardIndex,
  boardState,
  macroValue,
  currentPlayer,
  onCellPress,
  xColor,
  oColor,
}: MiniBoardOverlayProps) {
  if (!visible || boardIndex === null) return null;

  const isWon = macroValue !== null;
  const playerColor = currentPlayer === 'X' ? xColor : oColor;

  // Determine board number in human-readable form (1-27)
  const boardNum = boardIndex + 1;

  return (
    // Absolutely-positioned View instead of Modal — avoids Android GLSurfaceView z-order bug
    <View style={styles.backdrop}>
      <View style={[styles.card, { borderColor: playerColor }]}>
        <Text style={[styles.header, { color: playerColor }]}>
          {isWon
            ? `Board ${boardNum} — ${macroValue === 'DRAW' ? 'Draw' : `${macroValue} Won`}`
            : `Board ${boardNum} — ${currentPlayer}'s Turn`}
        </Text>

        <View style={styles.grid}>
          {boardState.map((cell, i) => {
            const cellColor = cell === 'X' ? xColor : cell === 'O' ? oColor : null;
            const canPress = !isWon && cell === null;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.cell,
                  i % 3 !== 2 && styles.cellBorderRight,
                  i < 6 && styles.cellBorderBottom,
                ]}
                onPress={() => canPress && onCellPress(i)}
                activeOpacity={canPress ? 0.6 : 1}
              >
                {cell ? (
                  <Text style={[styles.cellText, { color: cellColor! }]}>{cell}</Text>
                ) : (
                  <View style={styles.emptyCell} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {!isWon && (
          <Text style={styles.hint}>Tap a cell to place your mark</Text>
        )}
      </View>
    </View>
  );
}

const boardSize = screenWidth * 0.85;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  card: {
    width: boardSize,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  grid: {
    width: boardSize - 40,
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '33.33%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellBorderRight: {
    borderRightWidth: 2,
    borderRightColor: COLORS.border,
  },
  cellBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  cellText: {
    fontSize: 48,
    fontWeight: '900',
  },
  emptyCell: {
    flex: 1,
  },
  hint: {
    color: COLORS.text,
    opacity: 0.5,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
});
