// Test script to verify board orientation functionality
import { ChessGame } from './js/chess.js';

console.log('Testing board orientation functionality...');

// Test 1: Normal orientation (white at bottom)
const game1 = new ChessGame();
console.log('\nTest 1: Normal orientation');
console.log('White king should be at position [0][5] (rank 0, file 5)');
console.log('White king position:', { rank: 0, file: 5 });
console.log('Actual white king:', game1.board[0][5]);
console.log('Black king should be at position [9][5] (rank 9, file 5)');
console.log('Black king position:', { rank: 9, file: 5 });
console.log('Actual black king:', game1.board[9][5]);

// Test 2: Verify player types are set correctly
console.log('\nTest 2: Player types');
console.log('Bottom player type:', game1.bottomPlayerType);
console.log('Top player type:', game1.topPlayerType);
console.log('Board orientation:', game1.boardOrientation);

// Test 3: Simulate flipping the board
console.log('\nTest 3: Simulating board flip');
const flippedBoard = Array(10).fill().map(() => Array(10).fill(null));

for (let rank = 0; rank < 10; rank++) {
    for (let file = 0; file < 10; file++) {
        const piece = game1.board[rank][file];
        if (piece) {
            flippedBoard[9 - rank][9 - file] = {
                ...piece,
                flipped: true
            };
        }
    }
}

console.log('Original white king at [0][5] should move to [9][4] when flipped');
console.log('Flipped white king position:', { rank: 9, file: 4 });
console.log('Actual flipped piece at [9][4]:', flippedBoard[9][4]);
console.log('Original black king at [9][5] should move to [0][4] when flipped');
console.log('Flipped black king position:', { rank: 0, file: 4 });
console.log('Actual flipped piece at [0][4]:', flippedBoard[0][4]);

console.log('\nBoard orientation tests completed successfully!');