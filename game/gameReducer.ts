import { CellValue, GameAction, GameState, Player } from './types';
import { applyFaceRotation } from './rubikRotations';
import { MINI_WIN_LINES, WIN_LINES } from './winLines';

export function createInitialState(): GameState {
  return {
    miniBoards: Array.from({ length: 27 }, () => Array(27).fill(null)),
    macroCells: Array(27).fill(null),
    currentPlayer: 'X',
    requiredBoard: null,
    winner: null,
    winningLine: null,
    isDraw: false,
  };
}

function checkWinner(cells: CellValue[], lines: number[][]): Player | null {
  for (const [a, b, c] of lines) {
    const val = cells[a];
    if (val && val !== 'DRAW' && val === cells[b] && val === cells[c]) {
      return val as Player;
    }
  }
  return null;
}

function findWinningLine(cells: CellValue[], lines: number[][]): number[] | null {
  for (const line of lines) {
    const [a, b, c] = line;
    const val = cells[a];
    if (val && val !== 'DRAW' && val === cells[b] && val === cells[c]) {
      return line;
    }
  }
  return null;
}

function isBoardFull(cells: CellValue[]): boolean {
  return cells.every(c => c !== null);
}

function isPlayableBoard(state: GameState, boardIndex: number): boolean {
  return state.macroCells[boardIndex] === null && !isBoardFull(state.miniBoards[boardIndex]);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET_GAME':
      return createInitialState();

    case 'PLACE_MARK': {
      const { boardIndex, cellIndex } = action;

      // Guards
      if (state.winner || state.isDraw) return state;
      if (state.requiredBoard !== null && state.requiredBoard !== boardIndex) return state;
      if (!isPlayableBoard(state, boardIndex)) return state;
      if (state.miniBoards[boardIndex][cellIndex] !== null) return state;

      // Place mark
      const newMiniBoards = state.miniBoards.map((board, i) =>
        i === boardIndex
          ? board.map((cell, j) => (j === cellIndex ? state.currentPlayer : cell))
          : board
      );

      // Check mini-board result
      // Mini-boards are 3x3x3 (27 cells) — use the same 49 win lines as the macro board
      const miniBoardWinner = checkWinner(newMiniBoards[boardIndex], WIN_LINES);
      const miniBoardFull = isBoardFull(newMiniBoards[boardIndex]);
      const miniBoardResult: CellValue = miniBoardWinner ?? (miniBoardFull ? 'DRAW' : null);

      // Update macro cells
      const newMacroCells = state.macroCells.map((c, i) =>
        i === boardIndex ? (miniBoardResult ?? c) : c
      );

      // Check macro winner + which line
      const macroWinner = checkWinner(newMacroCells, WIN_LINES);
      const macroWinningLine = macroWinner ? findWinningLine(newMacroCells, WIN_LINES) : null;

      // Check macro draw (all 27 boards resolved)
      const macroDraw = !macroWinner && newMacroCells.every(c => c !== null);

      // Compute next required board
      const nextBoard = cellIndex;
      let nextRequired: number | null;
      if (macroWinner || macroDraw) {
        nextRequired = null;
      } else if (
        newMacroCells[nextBoard] !== null ||
        isBoardFull(newMiniBoards[nextBoard])
      ) {
        nextRequired = null;
      } else {
        nextRequired = nextBoard;
      }

      return {
        miniBoards: newMiniBoards,
        macroCells: newMacroCells,
        currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
        requiredBoard: nextRequired,
        winner: macroWinner,
        winningLine: macroWinningLine,
        isDraw: macroDraw,
      };
    }

    case 'LOAD_SNAPSHOT':
      return action.state;

    case 'ROTATE_FACE': {
      if (state.winner || state.isDraw) return state;

      const { macroCells, miniBoards } = applyFaceRotation(
        state.macroCells,
        state.miniBoards,
        action.axis,
        action.layer,
        action.cw,
      );

      // Check if rotation accidentally completes a winning line
      const macroWinner = checkWinner(macroCells, WIN_LINES);
      const macroWinningLine = macroWinner ? findWinningLine(macroCells, WIN_LINES) : null;
      const macroDraw = !macroWinner && macroCells.every(c => c !== null);

      return {
        ...state,
        macroCells,
        miniBoards,
        currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
        requiredBoard: null, // free choice after any rotation
        winner: macroWinner,
        winningLine: macroWinningLine,
        isDraw: macroDraw,
      };
    }

    default:
      return state;
  }
}
