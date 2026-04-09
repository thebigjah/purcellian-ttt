export type Player = 'X' | 'O';
export type CellValue = Player | 'DRAW' | null;

export interface GameState {
  miniBoards: CellValue[][];   // [27][27] — each mini-board's 27 cells
  macroCells: CellValue[];     // [27] — winner/draw/null for each board
  currentPlayer: Player;
  requiredBoard: number | null; // null = player can choose any open board
  winner: Player | null;
  winningLine: number[] | null; // which 3 macro boards form the winning line
  isDraw: boolean;
}

export interface GameModifiers {
  timedTurns: boolean;
  timerSeconds: number;
  blindMode: boolean;
  powerUpsEnabled: boolean;
  show3DSymbols: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  aiEnabled: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  rubikMode: boolean;
}

export const DEFAULT_MODIFIERS: GameModifiers = {
  timedTurns: false,
  timerSeconds: 30,
  blindMode: false,
  powerUpsEnabled: false,
  show3DSymbols: false,
  hapticFeedback: true,
  soundEffects: false,
  aiEnabled: false,
  aiDifficulty: 'medium',
  rubikMode: false,
};

export interface MoveRecord {
  boardIndex: number;
  cellIndex: number;
  player: Player;
  isRotation?: boolean;
  rotateDesc?: string; // e.g. "Z · Front · CW"
}

export type GameAction =
  | { type: 'PLACE_MARK'; boardIndex: number; cellIndex: number }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_SNAPSHOT'; state: GameState }
  | { type: 'ROTATE_FACE'; axis: 'x' | 'y' | 'z'; layer: 0 | 1 | 2; cw: boolean };
