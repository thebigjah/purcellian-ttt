import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Player } from '../game/types';

interface TurnBorderProps {
  currentPlayer: Player | null;
  xColor: string;
  oColor: string;
}

export default function TurnBorder({ currentPlayer, xColor, oColor }: TurnBorderProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: currentPlayer === 'O' ? 1 : 0,
      duration: 400,
      useNativeDriver: false, // color interpolation requires JS driver
    }).start();
  }, [currentPlayer]);

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [xColor, oColor],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.border, { borderColor }]}
    />
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 4,
    zIndex: 999,
  },
});
