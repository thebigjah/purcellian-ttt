import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AXIS_LABELS, FACE_LABELS, FaceAxis } from '../game/rubikRotations';
import { COLORS } from '../utils/colors';

const AXES: FaceAxis[] = ['z', 'y', 'x'];

interface Props {
  visible: boolean;
  currentPlayer: 'X' | 'O';
  playerColor: string;
  onRotate: (axis: FaceAxis, layer: 0 | 1 | 2, cw: boolean) => void;
  onCancel: () => void;
}

export default function RotateFacePanel({
  visible,
  currentPlayer,
  playerColor,
  onRotate,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const [dir, setDir] = useState<'cw' | 'ccw'>('cw');

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      {/* Tap-outside dismiss */}
      <TouchableOpacity style={styles.backdrop} onPress={onCancel} activeOpacity={1} />

      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rotate a Face</Text>
            <Text style={[styles.subtitle, { color: playerColor }]}>
              {currentPlayer}'s turn — counts as a move
            </Text>
          </View>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Direction toggle */}
        <View style={styles.dirRow}>
          <Text style={styles.dirLabel}>Direction:</Text>
          <View style={styles.dirToggle}>
            <TouchableOpacity
              style={[styles.dirBtn, dir === 'cw' && styles.dirBtnActive]}
              onPress={() => setDir('cw')}
            >
              <Text style={[styles.dirBtnText, dir === 'cw' && styles.dirBtnTextActive]}>
                ↻ Clockwise
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dirBtn, dir === 'ccw' && styles.dirBtnActive]}
              onPress={() => setDir('ccw')}
            >
              <Text style={[styles.dirBtnText, dir === 'ccw' && styles.dirBtnTextActive]}>
                ↺ Counter
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.hint}>
          CW = looking from {dir === 'cw' ? 'Front/Top/Right' : 'Back/Bottom/Left'}
        </Text>

        {/* Face grid: each axis gets a row of 3 layer buttons */}
        <View style={styles.grid}>
          {AXES.map((axis) => (
            <View key={axis} style={styles.axisRow}>
              <Text style={styles.axisLabel}>{AXIS_LABELS[axis]}</Text>
              <View style={styles.layerBtns}>
                {([0, 1, 2] as const).map((layer) => (
                  <TouchableOpacity
                    key={layer}
                    style={styles.layerBtn}
                    onPress={() => onRotate(axis, layer, dir === 'cw')}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.layerBtnText}>
                      {FACE_LABELS[axis][layer]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.9,
  },
  cancelBtn: { padding: 8 },
  cancelText: { color: COLORS.text, opacity: 0.45, fontSize: 14 },
  dirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  dirLabel: {
    color: COLORS.text,
    opacity: 0.5,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 72,
  },
  dirToggle: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  dirBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dirBtnActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  dirBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.45,
  },
  dirBtnTextActive: {
    color: COLORS.gold,
    opacity: 1,
  },
  hint: {
    color: COLORS.text,
    opacity: 0.3,
    fontSize: 10,
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  grid: {
    gap: 10,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  axisLabel: {
    color: COLORS.text,
    opacity: 0.45,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    width: 60,
    textTransform: 'uppercase',
  },
  layerBtns: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  layerBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  layerBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
