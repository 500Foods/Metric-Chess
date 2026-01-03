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
        
        // Set default game mode: human vs AI with white at bottom
        this.game.bottomPlayerType = 'human';
        this.game.topPlayerType = 'ai';
        this.game.whitePosition = 'bottom';
        
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
        
        // Check if AI should make the first move (black AI in default setup)
        this.checkForAIMove();
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
        
        // Orientation toggle button
        document.getElementById('toggleOrientation').addEventListener('click', () => {
            this.cycleOrientation();
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
        // Transform the clicked coordinates back to board coordinates based on orientation
        const { boardFile, boardRank } = this.transformScreenToBoardCoords(file, rank);
        
        const piece = this.game.board[boardRank][boardFile];
         
        // If we have a selected piece and clicked on a different cell
        if (this.selectedPiece && (this.selectedPiece.file !== boardFile || this.selectedPiece.rank !== boardRank)) {
            // Check if the clicked cell is a valid move
            const isValidMove = this.availableMoves.some(move =>
                move.file === boardFile && move.rank === boardRank
            );
             
            if (isValidMove) {
                // Make the move using board coordinates
                this.game.movePiece(this.selectedPiece.file, this.selectedPiece.rank, boardFile, boardRank);
                this.renderer.renderBoard(this.game);
                this.updateGameStatus();
                this.clearHighlights();
                this.updateMoveHistory();
                return;
            }
        }
         
        // If we clicked on a piece of the current player's color
        if (piece && piece.color === this.game.currentPlayer) {
            // Calculate available moves using board coordinates
            this.availableMoves = this.game.getAvailableMoves(boardFile, boardRank);
             
            // Highlight the selected piece and available moves (using screen coordinates)
            this.renderer.highlightPiece(file, rank, 'selected-piece');
            this.renderer.highlightMoves(this.availableMoves, this.game.whitePosition);
             
            // Store the selected piece with board coordinates
            this.selectedPiece = { file: boardFile, rank: boardRank, piece };
        } else {
            // Clear selection if clicking on empty cell or opponent's piece
            this.clearHighlights();
            this.selectedPiece = null;
            this.availableMoves = [];
        }
    }

    transformScreenToBoardCoords(screenFile, screenRank) {
        const whitePosition = this.game.whitePosition || 'bottom';
        let boardFile = screenFile;
        let boardRank = screenRank;
        
        switch (whitePosition) {
            case 'top':
                // Flip vertically
                boardRank = 9 - screenRank;
                break;
            case 'left':
                // Rotate 90 degrees counter-clockwise
                boardFile = screenRank;
                boardRank = 9 - screenFile;
                break;
            case 'right':
                // Rotate 90 degrees clockwise
                boardFile = 9 - screenRank;
                boardRank = screenFile;
                break;
            case 'bottom':
            default:
                // No transformation
                break;
        }
        
        return { boardFile, boardRank };
    }
    
    transformBoardToScreenCoords(boardFile, boardRank) {
        const whitePosition = this.game.whitePosition || 'bottom';
        let screenFile = boardFile;
        let screenRank = boardRank;
        
        switch (whitePosition) {
            case 'top':
                // Flip vertically
                screenRank = 9 - boardRank;
                break;
            case 'left':
                // Rotate 90 degrees counter-clockwise
                screenFile = boardRank;
                screenRank = 9 - boardFile;
                break;
            case 'right':
                // Rotate 90 degrees clockwise
                screenFile = 9 - boardRank;
                screenRank = boardFile;
                break;
            case 'bottom':
            default:
                // No transformation
                break;
        }
        
        return { screenFile, screenRank };
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
          
        // Reset the game - this creates a fresh board and clears history
        this.game.reset();
        this.game.gameHistory = [];
        this.game.redoStack = [];
        this.game.moveNotation = [];
        this.game.moveCount = 0;
          
        // Set up board orientation based on selection
        this.game.whitePosition = boardOrientation.replace('white-', '');
          
        // Parse game mode to determine AI players
        const [bottomPlayer, topPlayer] = gameMode.split('-');
        this.game.bottomPlayerType = bottomPlayer;
        this.game.topPlayerType = topPlayer;
          
        // Set current player (always white goes first)
        this.game.currentPlayer = 'white';
          
        // Re-render with new orientation
        this.renderer.renderBoard(this.game);
        this.updateGameStatus();
        this.clearHighlights();
        this.updateMoveHistory();
          
        this.hideGameSetupModal();
          
        console.log(`Starting new game: ${gameMode} with ${boardOrientation}`);
        console.log(`White position: ${this.game.whitePosition}`);
        console.log(`Bottom: ${bottomPlayer}, Top: ${topPlayer}`);
          
        // Check if AI needs to make a move
        this.checkForAIMove();
    }
    
    checkForAIMove() {
        // Check if it's AI's turn
        const currentPlayer = this.game.currentPlayer;
        const playerType = currentPlayer === 'white' ? this.game.bottomPlayerType : this.game.topPlayerType;
        
        if (playerType === 'ai') {
            // For now, make a simple random move for AI
            // This will be replaced with fairy-stockfish integration later
            setTimeout(() => {
                this.makeSimpleAIMove();
            }, 1000); // Small delay to simulate thinking
        }
    }
    
    makeSimpleAIMove() {
        // Find all possible moves for the AI
        const allMoves = [];
        
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = this.game.board[rank][file];
                if (piece && piece.color === this.game.currentPlayer) {
                    const moves = this.game.getAvailableMoves(file, rank);
                    moves.forEach(move => {
                        allMoves.push({
                            from: { file, rank },
                            to: { file: move.file, rank: move.rank },
                            piece: piece
                        });
                    });
                }
            }
        }
        
        // If there are valid moves, make a random one
        if (allMoves.length > 0) {
            const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
            const result = this.game.movePiece(
                randomMove.from.file,
                randomMove.from.rank,
                randomMove.to.file,
                randomMove.to.rank
            );
            
            if (result) {
                this.renderer.renderBoard(this.game.board);
                this.updateGameStatus();
                this.clearHighlights();
                this.updateMoveHistory();
                
                // Check if the next player is also AI
                this.checkForAIMove();
            }
        }
    }

    // Orientation toggle methods
    cycleOrientation() {
        const orientations = ['bottom', 'right', 'top', 'left'];
        const currentIndex = orientations.indexOf(this.game.whitePosition);
        const nextIndex = (currentIndex + 1) % orientations.length;
        this.game.whitePosition = orientations[nextIndex];
        
        // Re-render with new orientation
        this.renderer.renderBoard(this.game);
        
        console.log(`Orientation changed to: ${this.game.whitePosition}`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MetricChessApp();
});