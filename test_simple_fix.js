// Simple test to verify the board orientation fix
import { ChessGame } from './js/chess.js';

console.log('Testing simple board orientation fix...');

const game = new ChessGame();

console.log('\n=== Board Setup After Fix ===');
console.log('White pieces should be on ranks 8-9 (visual top)');
console.log('Black pieces should be on ranks 0-1 (visual bottom)');

// Check white pieces
console.log('\nWhite pieces:');
let whitePiecesFound = 0;
for (let rank = 8; rank < 10; rank++) {
    for (let file = 0; file < 10; file++) {
        if (game.board[rank][file] && game.board[rank][file].color === 'white') {
            whitePiecesFound++;
        }
    }
}
console.log(`White pieces on ranks 8-9: ${whitePiecesFound}`);

// Check black pieces
console.log('\nBlack pieces:');
let blackPiecesFound = 0;
for (let rank = 0; rank < 2; rank++) {
    for (let file = 0; file < 10; file++) {
        if (game.board[rank][file] && game.board[rank][file].color === 'black') {
            blackPiecesFound++;
        }
    }
}
console.log(`Black pieces on ranks 0-1: ${blackPiecesFound}`);

// Check specific positions
console.log('\n=== Specific Positions ===');
console.log('White king should be at [9][5]:', game.board[9][5]);
console.log('Black king should be at [0][5]:', game.board[0][5]);
console.log('White pawn should be at [8][0]:', game.board[8][0]);
console.log('Black pawn should be at [1][0]:', game.board[1][0]);

console.log('\n=== Test Completed ===');
console.log('If this shows white pieces on ranks 8-9 and black on 0-1,');
console.log('then the board will render with WHITE at the BOTTOM (visual)');
console.log('and BLACK at the TOP (visual), which is the correct orientation.');