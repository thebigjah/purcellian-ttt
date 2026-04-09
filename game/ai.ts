import { CellValue, GameState, Player } from './types';
import { WIN_LINES } from './winLines';

function checkWinner(cells: CellValue[]): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    const v = cells[a];
    if (v && v !== 'DRAW' && v === cells[b] && v === cells[c]) return v as Player;
  }
  return null;
}

function isFull(cells: CellValue[]): boolean {
  return cells.every(c => c !== null);
}

function getValidBoards(state: GameState): number[] {
  if (state.requiredBoard !== null) {
    const b = state.requiredBoard;
    if (state.macroCells[b] === null && !isFull(state.miniBoards[b])) return [b];
    // Required board is closed → free choice
  }
  return state.macroCells
    .map((v, i) => (v === null && !isFull(state.miniBoards[i]) ? i : -1))
    .filter(i => i >= 0);
}

function getValidCells(miniBoard: CellValue[]): number[] {
  return miniBoard.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);
}

// Returns a score for a given board's cells — how many threats does `player` have?
function countThreats(cells: CellValue[], player: Player): number {
  let threats = 0;
  for (const [a, b, c] of WIN_LINES) {
    const vals = [cells[a], cells[b], cells[c]];
    const mine = vals.filter(v => v === player).length;
    const empty = vals.filter(v => v === null).length;
    if (mine === 2 && empty === 1) threats++;
  }
  return threats;
}

// Check if player can win mini-board in one move, return that cell index or -1
function findWinningCell(cells: CellValue[], player: Player): number {
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null) continue;
    const test = [...cells];
    test[i] = player;
    if (checkWinner(test) === player) return i;
  }
  return -1;
}

function scoreMove(
  state: GameState,
  boardIndex: number,
  cellIndex: number,
  player: Player,
): number {
  const opp = player === 'X' ? 'O' : 'X';
  let score = 0;

  const mini = [...state.miniBoards[boardIndex]];
  mini[cellIndex] = player;

  // Win this mini-board → big reward
  if (checkWinner(mini) === player) {
    score += 200;
    // Bonus: how many macro win lines does this board participate in?
    const lineCount = WIN_LINES.filter(l => l.includes(boardIndex)).length;
    score += lineCount * 15;

    // If winning this board creates a macro 2-in-a-row threat
    const mockMacro = [...state.macroCells];
    mockMacro[boardIndex] = player;
    score += countThreats(mockMacro, player) * 40;
  }

  // Block opponent from winning this mini-board
  const oppWinCell = findWinningCell(state.miniBoards[boardIndex], opp);
  if (oppWinCell === cellIndex) score += 120;

  // Create 2-in-a-row threats in mini-board
  score += countThreats(mini, player) * 8;

  // Next board destination
  const nextBoard = cellIndex;
  if (state.macroCells[nextBoard] !== null) {
    // Sending opponent to a closed board = free choice for them
    // That's not great — opponent can pick strategically
    score -= 20;
  } else {
    const nextMini = state.miniBoards[nextBoard];
    // Penalize sending opponent somewhere they can immediately win a board
    const oppWinThere = findWinningCell(nextMini, opp);
    if (oppWinThere !== -1) score -= 60;
    // Reward sending opponent somewhere with lots of our pieces (they have to play there)
    const myCells = nextMini.filter(v => v === player).length;
    score += myCells * 3;
  }

  // Prefer center (13) and corners (0,2,6,8,18,20,24,26) of mini-board
  const corners = [0, 2, 6, 8, 18, 20, 24, 26];
  if (cellIndex === 13) score += 6;
  else if (corners.includes(cellIndex)) score += 3;

  return score;
}

function hardScore(
  state: GameState,
  boardIndex: number,
  cellIndex: number,
  player: Player,
): number {
  const opp = player === 'X' ? 'O' : 'X';
  let score = scoreMove(state, boardIndex, cellIndex, player);

  const mini = [...state.miniBoards[boardIndex]];
  mini[cellIndex] = player;

  if (checkWinner(mini) === player) {
    const mockMacro = [...state.macroCells];
    mockMacro[boardIndex] = player;

    // Hard: also check if opponent could win macro on their next turn
    const oppMacroWin = WIN_LINES.some(line => {
      const vals = line.map(i => mockMacro[i]);
      return (
        vals.filter(v => v === opp).length === 2 &&
        vals.some(v => v === null)
      );
    });
    if (oppMacroWin) score -= 30; // not as safe as it looks

    // Check if we create a macro 3-in-a-row win
    if (checkWinner(mockMacro) === player) score += 1000;
  }

  // Hard: blocking opponent's macro 2-in-a-row by winning a specific board
  const mockMacroBlock = [...state.macroCells];
  const mini2 = [...state.miniBoards[boardIndex]];
  mini2[cellIndex] = player;
  if (checkWinner(mini2) === player) {
    mockMacroBlock[boardIndex] = player;
  }
  for (const line of WIN_LINES) {
    const vals = line.map(i => state.macroCells[i]);
    if (
      vals.filter(v => v === opp).length === 2 &&
      line.includes(boardIndex) &&
      state.macroCells[boardIndex] === null
    ) {
      score += 80; // blocking a macro threat
    }
  }

  return score;
}

export function getAIMove(
  state: GameState,
  difficulty: 'easy' | 'medium' | 'hard',
): { boardIndex: number; cellIndex: number } | null {
  if (state.winner || state.isDraw) return null;

  const boards = getValidBoards(state);
  if (boards.length === 0) return null;

  const moves: { boardIndex: number; cellIndex: number }[] = [];
  for (const b of boards) {
    for (const c of getValidCells(state.miniBoards[b])) {
      moves.push({ boardIndex: b, cellIndex: c });
    }
  }
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const player = state.currentPlayer;
  const scoreFn = difficulty === 'hard' ? hardScore : scoreMove;

  const scored = moves.map(m => ({
    ...m,
    score: scoreFn(state, m.boardIndex, m.cellIndex, player),
  }));

  const max = Math.max(...scored.map(m => m.score));
  const best = scored.filter(m => m.score === max);
  return best[Math.floor(Math.random() * best.length)];
}
