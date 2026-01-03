// Test script to verify the board orientation fix
import { ChessGame } from './js/chess.js';

console.log('Testing board orientation fix...');

// Test 1: Normal orientation (white at bottom)
const game1 = new ChessGame();
console.log('\n=== Test 1: Normal Orientation ===');
console.log('White pieces should be on ranks 0-1 (bottom)');
console.log('Black pieces should be on ranks 8-9 (top)');

// Check white pieces
let whitePiecesFound = 0;
for (let rank = 0; rank < 2; rank++) {
    for (let file = 0; file < 10; file++) {
        if (game1.board[rank][file] && game1.board[rank][file].color === 'white') {
            whitePiecesFound++;
        }
    }
}
console.log(`White pieces on ranks 0-1: ${whitePiecesFound}`);

// Check black pieces
let blackPiecesFound = 0;
for (let rank = 8; rank < 10; rank++) {
    for (let file = 0; file < 10; file++) {
        if (game1.board[rank][file] && game1.board[rank][file].color === 'black') {
            blackPiecesFound++;
        }
    }
}
console.log(`Black pieces on ranks 8-9: ${blackPiecesFound}`);

// Test 2: Flipped orientation (black at bottom)
console.log('\n=== Test 2: Flipped Orientation ===');
const game2 = new ChessGame();

// Simulate flipping the board
const flippedBoard = Array(10).fill().map(() => Array(10).fill(null));

for (let rank = 0; rank < 10; rank++) {
    for (let file = 0; file < 10; file++) {
        const piece = game2.board[rank][file];
        if (piece) {
            // Vertical flip only (invert rank)
            flippedBoard[9 - rank][file] = {
                ...piece,
                flipped: true
            };
        }
    }
}

console.log('After flipping:');
console.log('White pieces should now be on ranks 8-9 (top)');
console.log('Black pieces should now be on ranks 0-1 (bottom)');

// Check white pieces after flip
whitePiecesFound = 0;
for (let rank = 8; rank < 10; rank++) {
    for (let file = 0; file < 10; file++) {
        if (flippedBoard[rank][file] && flippedBoard[rank][file].color === 'white') {
            whitePiecesFound++;
        }
    }
}
console.log(`White pieces on ranks 8-9 after flip: ${whitePiecesFound}`);

// Check black pieces after flip
blackPiecesFound = 0;
for (let rank = 0; rank < 2; rank++) {
    for (let file = 0; file < 10; file++) {
        if (flippedBoard[rank][file] && flippedBoard[rank][file].color === 'black') {
            blackPiecesFound++;
        }
    }
}
console.log(`Black pieces on ranks 0-1 after flip: ${blackPiecesFound}`);

// Test 3: Verify specific piece positions
console.log('\n=== Test 3: Specific Piece Positions ===');
console.log('Normal orientation:');
console.log('White king at [0][5]:', game1.board[0][5]);
console.log('Black king at [9][5]:', game1.board[9][5]);

console.log('\nFlipped orientation:');
console.log('White king should be at [9][5]:', flippedBoard[9][5]);
console.log('Black king should be at [0][5]:', flippedBoard[0][5]);

console.log('\n=== Board Orientation Tests Completed ===');