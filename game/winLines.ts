// Macro board index: flatIndex = x + y*3 + z*9
//
// z=0 (front):    z=1 (middle):    z=2 (back):
//  0  1  2         9  10  11       18  19  20
//  3  4  5        12  13  14       21  22  23
//  6  7  8        15  16  17       24  25  26

// 49 winning lines for 3x3x3 macro cube
export const WIN_LINES: number[][] = [
  // X-axis rows (vary x, fix y and z) — 9 lines
  [0, 1, 2],   [3, 4, 5],   [6, 7, 8],
  [9, 10, 11], [12, 13, 14],[15, 16, 17],
  [18, 19, 20],[21, 22, 23],[24, 25, 26],

  // Y-axis columns (vary y, fix x and z) — 9 lines
  [0, 3, 6],   [1, 4, 7],   [2, 5, 8],
  [9, 12, 15], [10, 13, 16],[11, 14, 17],
  [18, 21, 24],[19, 22, 25],[20, 23, 26],

  // Z-axis depths (vary z, fix x and y) — 9 lines
  [0, 9, 18],  [1, 10, 19], [2, 11, 20],
  [3, 12, 21], [4, 13, 22], [5, 14, 23],
  [6, 15, 24], [7, 16, 25], [8, 17, 26],

  // XY-face diagonals (2 per z-plane) — 6 lines
  [0, 4, 8],   [2, 4, 6],
  [9, 13, 17], [11, 13, 15],
  [18, 22, 26],[20, 22, 24],

  // XZ-face diagonals (2 per y-plane) — 6 lines
  [0, 10, 20], [2, 10, 18],
  [3, 13, 23], [5, 13, 21],
  [6, 16, 26], [8, 16, 24],

  // YZ-face diagonals (2 per x-plane) — 6 lines
  [0, 12, 24], [6, 12, 18],
  [1, 13, 25], [7, 13, 19],
  [2, 14, 26], [8, 14, 20],

  // Space diagonals through center (index 13) — 4 lines
  [0, 13, 26],
  [2, 13, 24],
  [6, 13, 20],
  [8, 13, 18],
];

// 8 winning lines for 2D 3x3 mini-boards (cells 0-8)
//  0 1 2
//  3 4 5
//  6 7 8
export const MINI_WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];
