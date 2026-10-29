import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/colors';
import { useSettings } from '../utils/SettingsContext';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsNavigationProp;
}

const COLOR_PRESETS = [
  { label: 'Orange', value: '#e85d04' },
  { label: 'Red', value: '#e63946' },
  { label: 'Gold', value: '#d4af37' },
  { label: 'Green', value: '#2dc653' },
  { label: 'Pink', value: '#e040fb' },
  { label: 'White', value: '#f5f0e0' },
];

const COLOR_PRESETS_O = [
  { label: 'Blue', value: '#0077b6' },
  { label: 'Purple', value: '#7b2d8b' },
  { label: 'Teal', value: '#00b4d8' },
  { label: 'Indigo', value: '#4361ee' },
  { label: 'Cyan', value: '#06d6a0' },
  { label: 'Gray', value: '#adb5bd' },
];

function ColorPicker({
  label,
  selected,
  presets,
  onSelect,
}: {
  label: string;
  selected: string;
  presets: { label: string; value: string }[];
  onSelect: (color: string) => void;
}) {
  return (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.colorRow}>
        {presets.map(({ label: name, value }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.colorSwatch,
              { backgroundColor: value },
              selected === value && styles.swatchSelected,
            ]}
            onPress={() => onSelect(value)}
          >
            {selected === value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { playerColors, updatePlayerColors, modifiers, updateModifiers } = useSettings();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Colors</Text>
        <ColorPicker
          label="X Color"
          selected={playerColors.X}
          presets={COLOR_PRESETS}
          onSelect={(c) => updatePlayerColors({ X: c })}
        />
        <ColorPicker
          label="O Color"
          selected={playerColors.O}
          presets={COLOR_PRESETS_O}
          onSelect={(c) => updatePlayerColors({ O: c })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Modifiers</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>3D X & O Symbols</Text>
            <Text style={styles.toggleSub}>Show 3D shapes instead of colored boxes</Text>
          </View>
          <Switch
            value={modifiers.show3DSymbols}
            onValueChange={(v) => updateModifiers({ show3DSymbols: v })}
            trackColor={{ false: '#334466', true: COLORS.gold }}
            thumbColor={modifiers.show3DSymbols ? '#fff' : '#888'}
          />
        </View>

        <View style={[styles.toggleRow, { marginTop: 10 }]}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Haptic Feedback</Text>
            <Text style={styles.toggleSub}>Vibrate on moves and undo</Text>
          </View>
          <Switch
            value={modifiers.hapticFeedback}
            onValueChange={(v) => updateModifiers({ hapticFeedback: v })}
            trackColor={{ false: '#334466', true: COLORS.gold }}
            thumbColor={modifiers.hapticFeedback ? '#fff' : '#888'}
          />
        </View>

        <View style={[styles.comingSoon, { marginTop: 12 }]}>
          <Text style={styles.comingSoonText}>More Coming Soon</Text>
          <Text style={styles.comingSoonSub}>Timed turns, blind mode, power-ups</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Opponent</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>AI Opponent</Text>
            <Text style={styles.toggleSub}>AI plays as O — you play as X</Text>
          </View>
          <Switch
            value={modifiers.aiEnabled}
            onValueChange={(v) => updateModifiers({ aiEnabled: v })}
            trackColor={{ false: '#334466', true: COLORS.gold }}
            thumbColor={modifiers.aiEnabled ? '#fff' : '#888'}
          />
        </View>

        {modifiers.aiEnabled && (
          <View style={[styles.difficultyRow, { marginTop: 12 }]}>
            {(['easy', 'medium', 'hard'] as const).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.diffBtn,
                  modifiers.aiDifficulty === level && styles.diffBtnActive,
                ]}
                onPress={() => updateModifiers({ aiDifficulty: level })}
              >
                <Text style={[
                  styles.diffBtnText,
                  modifiers.aiDifficulty === level && styles.diffBtnTextActive,
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Secret Mode</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Rubik Mode</Text>
            <Text style={styles.toggleSub}>
              On free-choice turns, rotate a face of the macro cube instead of playing — counts as your move
            </Text>
          </View>
          <Switch
            value={modifiers.rubikMode}
            onValueChange={(v) => updateModifiers({ rubikMode: v })}
            trackColor={{ false: '#334466', true: '#9b59b6' }}
            thumbColor={modifiers.rubikMode ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Purcellian Tic Tac Toe v1.0</Text>
        <Text style={styles.aboutText}>3D Ultimate Edition</Text>
        <Text style={[styles.aboutText, { opacity: 0.4, marginTop: 4 }]}>
          By Purcell Ventures LLC
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  back: { color: COLORS.text, opacity: 0.6, fontSize: 14, padding: 8 },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
    textShadowOffset: { width: 1, height: 1 },
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  toggleSub: { color: COLORS.text, fontSize: 12, opacity: 0.5, marginTop: 2 },
  comingSoon: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  comingSoonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.5,
  },
  comingSoonSub: {
    color: COLORS.text,
    fontSize: 12,
    opacity: 0.35,
    marginTop: 6,
    textAlign: 'center',
  },
  aboutText: {
    color: COLORS.text,
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 2,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  diffBtnActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.cardBg,
  },
  diffBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.5,
  },
  diffBtnTextActive: {
    color: COLORS.gold,
    opacity: 1,
  },
});
