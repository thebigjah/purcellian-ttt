import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_MODIFIERS, GameModifiers, Player } from '../game/types';
import { COLORS } from './colors';

export interface PlayerColors {
  X: string;
  O: string;
}

export interface Score {
  X: number;
  O: number;
  draws: number;
}

interface SettingsContextValue {
  modifiers: GameModifiers;
  updateModifiers: (patch: Partial<GameModifiers>) => void;
  playerColors: PlayerColors;
  updatePlayerColors: (patch: Partial<PlayerColors>) => void;
  score: Score;
  addWin: (result: Player | 'DRAW') => void;
  resetScore: () => void;
}

const DEFAULT_SCORE: Score = { X: 0, O: 0, draws: 0 };

const SettingsContext = createContext<SettingsContextValue>({
  modifiers: DEFAULT_MODIFIERS,
  updateModifiers: () => {},
  playerColors: { X: COLORS.X, O: COLORS.O },
  updatePlayerColors: () => {},
  score: DEFAULT_SCORE,
  addWin: () => {},
  resetScore: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [modifiers, setModifiers] = useState<GameModifiers>(DEFAULT_MODIFIERS);
  const [playerColors, setPlayerColors] = useState<PlayerColors>({ X: COLORS.X, O: COLORS.O });
  const [score, setScore] = useState<Score>(DEFAULT_SCORE);

  const addWin = (result: Player | 'DRAW') => {
    setScore(prev => ({
      X: result === 'X' ? prev.X + 1 : prev.X,
      O: result === 'O' ? prev.O + 1 : prev.O,
      draws: result === 'DRAW' ? prev.draws + 1 : prev.draws,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        modifiers,
        updateModifiers: (patch) => setModifiers(prev => ({ ...prev, ...patch })),
        playerColors,
        updatePlayerColors: (patch) => setPlayerColors(prev => ({ ...prev, ...patch })),
        score,
        addWin,
        resetScore: () => setScore(DEFAULT_SCORE),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
