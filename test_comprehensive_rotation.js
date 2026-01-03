// Comprehensive test showing before/after transformation
import { ChessGame } from './js/chess.js';

console.log('=== Comprehensive Rotation Test ===\n');

const game = new ChessGame();

// Move the white pawn from (0,1) to (0,2) to make it visible
console.log('Moving white pawn from (0,1) to (0,2)');
game.board[2][0] = { type: 'pawn', color: 'white' };
game.board[1][0] = null;

console.log('\n=== ORIGINAL BOARD (0° rotation - bottom orientation) ===');
console.log('Expected: White pawn at (0,2) should appear at grid position (1,3)');
console.log('Expected: Labels on left (0-9) and bottom (0-9)');
game.displayBoardWithOrientation('bottom');

console.log('\n=== 90° CLOCKWISE ROTATION (left orientation) ===');
console.log('Expected: White pawn should move from (1,3) to (3,9)');
console.log('Expected: Labels should rotate accordingly');
game.displayBoardWithOrientation('left');

console.log('\n=== 180° ROTATION (top orientation) ===');
console.log('Expected: White pawn should move from (1,3) to (9,9)');
console.log('Expected: Labels should be upside down');
game.displayBoardWithOrientation('top');

console.log('\n=== 90° COUNTER-CLOCKWISE ROTATION (right orientation) ===');
console.log('Expected: White pawn should move from (1,3) to (9,3)');
console.log('Expected: Labels should rotate accordingly');
game.displayBoardWithOrientation('right');

console.log('\n=== VERIFICATION ===');
console.log('Original board data (should be unchanged):');
console.log('White Trebuchet at (0,0):', game.board[0][0]);
console.log('White Pawn at (0,2):', game.board[2][0]);
console.log('White Queen at (4,0):', game.board[0][4]);
console.log('White King at (5,0):', game.board[0][5]);

console.log('\n=== Test Complete ===');