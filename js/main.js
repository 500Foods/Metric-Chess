// Metric Chess - Main Application
import { ChessGame } from './chess.js';
import { ChessRenderer } from './render.js';

// Main application class
class MetricChessApp {
    constructor() {
        this.game = new ChessGame();
        this.renderer = new ChessRenderer();
        this.selectedPiece = null;
        this.availableMoves = [];
        
        // Initialize the application
        this.initialize();
    }

    initialize() {
        // Set up the chess board
        this.renderer.initializeBoard();
        
        // Render initial game state
        this.renderer.renderBoard(this.game.board);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update game status
        this.updateGameStatus();
    }

    setupEventListeners() {
        // Board click handler
        document.getElementById('chessBoard').addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const coord = cell.dataset.coord;
            const file = parseInt(coord[0]);
            const rank = parseInt(coord[1]);
            
            this.handleCellClick(file, rank);
        });
        
        // Reset game button
        document.getElementById('resetGame').addEventListener('click', () => {
            this.game.reset();
            this.renderer.renderBoard(this.game.board);
            this.updateGameStatus();
            this.clearHighlights();
        });
        
        // Undo move button
        document.getElementById('undoMove').addEventListener('click', () => {
            this.game.undoMove();
            this.renderer.renderBoard(this.game.board);
            this.updateGameStatus();
            this.clearHighlights();
            this.updateMoveHistory();
        });
        
        // Redo move button
        document.getElementById('redoMove').addEventListener('click', () => {
            this.game.redoMove();
            this.renderer.renderBoard(this.game.board);
            this.updateGameStatus();
            this.clearHighlights();
            this.updateMoveHistory();
        });
        
        // New game button
        document.getElementById('newGame').addEventListener('click', () => {
            this.showGameSetupModal();
        });
        
        // Game setup modal buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('cancelGame').addEventListener('click', () => {
            this.hideGameSetupModal();
        });
    }

    handleCellClick(file, rank) {
        const piece = this.game.board[rank][file];
        
        // If we have a selected piece and clicked on a different cell
        if (this.selectedPiece && (this.selectedPiece.file !== file || this.selectedPiece.rank !== rank)) {
            // Check if the clicked cell is a valid move
            const isValidMove = this.availableMoves.some(move => 
                move.file === file && move.rank === rank
            );
            
            if (isValidMove) {
                // Make the move
                this.game.movePiece(this.selectedPiece.file, this.selectedPiece.rank, file, rank);
                this.renderer.renderBoard(this.game.board);
                this.updateGameStatus();
                this.clearHighlights();
                this.updateMoveHistory();
                return;
            }
        }
        
        // If we clicked on a piece of the current player's color
        if (piece && piece.color === this.game.currentPlayer) {
            // Calculate available moves
            this.availableMoves = this.game.getAvailableMoves(file, rank);
            
            // Highlight the selected piece and available moves
            this.renderer.highlightPiece(file, rank, 'selected-piece');
            this.renderer.highlightMoves(this.availableMoves);
            
            // Store the selected piece
            this.selectedPiece = { file, rank, piece };
        } else {
            // Clear selection if clicking on empty cell or opponent's piece
            this.clearHighlights();
            this.selectedPiece = null;
            this.availableMoves = [];
        }
    }

    clearHighlights() {
        this.renderer.clearHighlights();
    }

    updateMoveHistory() {
        const moveListElement = document.getElementById('moveList');
        moveListElement.innerHTML = '';
        
        // Group moves by pair (white and black)
        for (let i = 0; i < this.game.moveNotation.length; i++) {
            const move = this.game.moveNotation[i];
            const moveElement = document.createElement('div');
            moveElement.className = `move-item ${move.player}`;
            
            const moveNumberSpan = document.createElement('span');
            moveNumberSpan.className = 'move-number';
            moveNumberSpan.textContent = move.moveNumber + '.';
            
            const notationSpan = document.createElement('span');
            notationSpan.className = 'move-notation';
            notationSpan.textContent = move.notation;
            
            moveElement.appendChild(moveNumberSpan);
            moveElement.appendChild(notationSpan);
            moveListElement.appendChild(moveElement);
        }
    }

    updateGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        statusElement.textContent = `${this.game.currentPlayer.charAt(0).toUpperCase() + this.game.currentPlayer.slice(1)}'s turn`;
        
        if (this.game.isCheck()) {
            statusElement.textContent += ' - CHECK!';
        }
        
        if (this.game.isCheckmate()) {
            statusElement.textContent = `CHECKMATE! ${this.game.currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
        }
    }

    showGameSetupModal() {
        const modal = document.getElementById('gameSetupModal');
        modal.style.display = 'flex';
    }

    hideGameSetupModal() {
        const modal = document.getElementById('gameSetupModal');
        modal.style.display = 'none';
    }

    startNewGame() {
        const boardOrientation = document.getElementById('boardOrientation').value;
        const gameMode = document.getElementById('gameMode').value;
        
        // Reset the game
        this.game.reset();
        
        // Set up board orientation based on selection
        if (boardOrientation === 'black-bottom') {
            // Flip the board so black pieces are at the bottom
            this.flipBoardOrientation();
        } else {
            // Ensure normal orientation (white at bottom)
            this.ensureNormalOrientation();
        }
        
        // Parse game mode to determine AI players
        const [bottomPlayer, topPlayer] = gameMode.split('-');
        this.game.bottomPlayerType = bottomPlayer;
        this.game.topPlayerType = topPlayer;
        
        // Set current player based on orientation
        this.game.currentPlayer = boardOrientation === 'black-bottom' ? 'black' : 'white';
        
        this.renderer.renderBoard(this.game.board);
        this.updateGameStatus();
        this.clearHighlights();
        this.updateMoveHistory();
        
        this.hideGameSetupModal();
        
        console.log(`Starting new game: ${gameMode} with ${boardOrientation}`);
        console.log(`Bottom: ${bottomPlayer}, Top: ${topPlayer}`);
        
        // TODO: Implement AI logic when fairy-stockfish is integrated
    }

    flipBoardOrientation() {
        // Flip the board so black pieces are at the bottom
        const flippedBoard = Array(10).fill().map(() => Array(10).fill(null));
        
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = this.game.board[rank][file];
                if (piece) {
                    // Flip both rank and file to maintain proper orientation
                    flippedBoard[9 - rank][9 - file] = {
                        ...piece,
                        // Keep original color but note it's flipped for move logic
                        flipped: true
                    };
                }
            }
        }
        
        // Store the flipped board for rendering
        this.game.flippedBoard = flippedBoard;
        this.game.boardOrientation = 'flipped';
    }

    ensureNormalOrientation() {
        // Ensure normal orientation (white at bottom)
        this.game.boardOrientation = 'normal';
        delete this.game.flippedBoard;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MetricChessApp();
});