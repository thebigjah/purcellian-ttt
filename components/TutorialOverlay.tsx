import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/colors';

interface Step {
  title: string;
  body: string;
  visual?: string; // ASCII/text diagram
}

const STEPS: Step[] = [
  {
    title: 'Welcome',
    body: "Purcellian Tic Tac Toe takes Ultimate Tic-Tac-Toe and makes it 3D. Two players, one device. Whoever claims 3 boards in a row across the macro cube wins.",
    visual: [
      '  [X][ ][ ]',
      '  [ ][O][ ]',
      '  [ ][ ][X]',
      '',
      '  27 mini-boards',
      '  inside a 3×3×3 cube',
    ].join('\n'),
  },
  {
    title: 'The Macro Board',
    body: "27 mini-boards fill a 3×3×3 cube — think of it like a Rubik's cube. Rotate the 3D view with your finger. The layer panel (Front / Mid / Back) shows every board at a glance so you can see buried boards too.",
    visual: [
      '  FRONT   MID    BACK',
      '  [·][·][·] [·][·][·] [·][·][·]',
      '  [·][·][·] [·][·][·] [·][·][·]',
      '  [·][·][·] [·][·][·] [·][·][·]',
      '',
      '  Each [ ] is one mini-board',
    ].join('\n'),
  },
  {
    title: 'Selecting a Board',
    body: "On your turn, tap a highlighted board in the layer panel or tap it on the 3D cube. The first move is yours to choose — any of the 27 boards is fair game.\n\nThe highlighted board (golden yellow) is where you must play.",
    visual: [
      '  ┌─────────────────┐',
      '  │  FRONT layer    │',
      '  │  [·][·][·]      │',
      '  │  [·][★][·]  ← required',
      '  │  [·][·][·]      │',
      '  └─────────────────┘',
      '',
      '  ★ = your board this turn',
    ].join('\n'),
  },
  {
    title: 'The Key Rule',
    body: "The cell you play inside a mini-board (0–26) determines which macro board your opponent must play in next.\n\nPlay in cell #7? Your opponent must open macro board #7. You're not just playing tic-tac-toe — you're choosing their battlefield.",
    visual: [
      '  You play cell #5',
      '  in board #12',
      '',
      '  Cell positions:',
      '  [ 0][ 1][ 2]',
      '  [ 3][ 4][ 5] ← you pick #5',
      '  [ 6][ 7][ 8]',
      '  ...layers continue...',
      '',
      '  → Opponent must play board #5',
    ].join('\n'),
  },
  {
    title: 'Inside a Mini-Board',
    body: "Each mini-board is also 3×3×3 — 27 cells spread across 3 layers (Front, Mid, Back). Tap a cell to claim it.\n\nWin 3 in a row inside the mini-board (any of 49 possible lines — rows, columns, diagonals, and space diagonals through the center) to claim that board for your color.",
    visual: [
      '  Inside a mini-board:',
      '  FRONT    MID     BACK',
      '  [X][·][·] [·][·][·] [·][·][·]',
      '  [·][X][·] [·][·][·] [·][·][·]',
      '  [·][·][X] [·][·][·] [·][·][·]',
      '',
      '  Diagonal = win!',
      '  → Board claimed by X',
    ].join('\n'),
  },
  {
    title: 'Free Choice',
    body: "If the mini-board you're sent to is already claimed or completely full, you get free choice — pick any open board.\n\nStrategically, sending your opponent to a closed board actually helps them. Keep that in mind.",
    visual: [
      '  Sent to board #3...',
      '  but board #3 is already',
      '  claimed by O.',
      '',
      '  → You get free choice.',
      '     Pick any open board.',
    ].join('\n'),
  },
  {
    title: 'Winning the Game',
    body: "Claim 3 macro boards in a row to win. There are 49 winning lines across the 3×3×3 cube — straight rows, face diagonals, and space diagonals that cut through the center.\n\nThe 4 space diagonals are the sneakiest. Watch the center board (#13) — it's on 49% of all winning lines.",
    visual: [
      '  Macro win examples:',
      '',
      '  [X][X][X]  ← row',
      '  [·][·][·]',
      '  [·][·][·]',
      '',
      '  [X][·][·]  ← space diagonal',
      '  [·][X][·]  (through center)',
      '  [·][·][X]',
      '',
      '  Center board is on',
      '  49% of all win lines.',
    ].join('\n'),
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TutorialOverlay({ visible, onClose }: Props) {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setStep(0);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleClose = () => {
    onClose();
    setStep(0);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>HOW TO PLAY</Text>
          <TouchableOpacity onPress={handleClose} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setStep(i)}>
              <View style={[styles.dot, i === step && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepTitle}>{current.title}</Text>
          <Text style={styles.stepBody}>{current.body}</Text>

          {current.visual && (
            <View style={styles.visual}>
              <Text style={styles.visualText}>{current.visual}</Text>
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.navBtn, styles.navBtnBack, step === 0 && styles.navBtnDisabled]}
            disabled={step === 0}
          >
            <Text style={[styles.navBtnText, step === 0 && styles.navBtnTextDisabled]}>{'< Back'}</Text>
          </TouchableOpacity>

          <Text style={styles.stepCounter}>{step + 1} / {STEPS.length}</Text>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.navBtn, isLast ? styles.navBtnFinish : styles.navBtnNext]}
          >
            <Text style={[styles.navBtnText, isLast && styles.navBtnTextFinish]}>
              {isLast ? "Let's Play" : 'Next >'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLabel: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  skipBtn: { padding: 8 },
  skipText: { color: COLORS.text, opacity: 0.4, fontSize: 13 },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.gold,
    width: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  stepTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepBody: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.85,
    marginBottom: 24,
  },
  visual: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visualText: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
    opacity: 0.75,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  navBtnBack: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnNext: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnFinish: {
    backgroundColor: COLORS.gold,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  navBtnTextDisabled: {
    opacity: 0.4,
  },
  navBtnTextFinish: {
    color: '#000',
    fontWeight: '900',
  },
  stepCounter: {
    color: COLORS.text,
    opacity: 0.35,
    fontSize: 12,
    letterSpacing: 1,
  },
});
