import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TutorialOverlay from '../components/TutorialOverlay';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/colors';
import { useSettings } from '../utils/SettingsContext';

type MainMenuNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
  navigation: MainMenuNavigationProp;
}

export default function MainMenuScreen({ navigation }: Props) {
  const { score, resetScore, playerColors, modifiers } = useSettings();
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const hasScore = score.X > 0 || score.O > 0 || score.draws > 0;

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={styles.titleSmall}>PURCELLIAN</Text>
        <Text style={styles.titleBig}>TIC TAC TOE</Text>
        <Text style={styles.subtitle}>3D Ultimate Edition</Text>
      </View>

      {hasScore && (
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCol}>
              <Text style={[styles.scoreNum, { color: playerColors.X }]}>{score.X}</Text>
              <Text style={styles.scoreLabel}>X Wins</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCol}>
              <Text style={styles.scoreNumDraw}>{score.draws}</Text>
              <Text style={styles.scoreLabel}>Draws</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCol}>
              <Text style={[styles.scoreNum, { color: playerColors.O }]}>{score.O}</Text>
              <Text style={styles.scoreLabel}>O Wins</Text>
            </View>
          </View>
          <TouchableOpacity onPress={resetScore} style={styles.resetScoreBtn}>
            <Text style={styles.resetScoreText}>Reset Score</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: COLORS.gold }]}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.btnTextDark}>PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={() => setTutorialVisible(true)}
        >
          <Text style={styles.btnTextLight}>HOW TO PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.btnTextLight}>SETTINGS</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>{modifiers.aiEnabled ? 'Playing against the computer' : 'Pass and play, 2 players'}</Text>

      <TutorialOverlay
        visible={tutorialVisible}
        onClose={() => setTutorialVisible(false)}
        onFinish={() => {
          setTutorialVisible(false);
          navigation.navigate('Game');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 64,
  },
  titleSmall: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 4,
  },
  titleBig: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 3,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 13,
    opacity: 0.45,
    letterSpacing: 2,
    marginTop: 8,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnTextDark: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
  },
  btnTextLight: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 2,
    opacity: 0.75,
  },
  footer: {
    color: COLORS.text,
    opacity: 0.3,
    fontSize: 11,
    marginTop: 48,
    letterSpacing: 1,
  },
  scoreCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 28,
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  scoreNum: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreNumDraw: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.text,
    opacity: 0.45,
  },
  scoreLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resetScoreBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  resetScoreText: {
    color: COLORS.text,
    opacity: 0.3,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
