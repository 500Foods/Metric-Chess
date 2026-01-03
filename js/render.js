// Metric Chess - Rendering Logic

export class ChessRenderer {
    constructor() {
        this.boardElement = document.getElementById('chessBoard');
    }

    initializeBoard() {
        // Clear existing board
        this.boardElement.innerHTML = '';
         
        // Create 10x10 grid
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.coord = `${file}${rank}`;
                 
                // Set chessboard pattern - (file + rank) % 2 === 0 for light squares
                if ((file + rank) % 2 === 0) {
                    cell.classList.add('light-square');
                } else {
                    cell.classList.add('dark-square');
                }
                 
                this.boardElement.appendChild(cell);
            }
        }
    }

    renderBoard(game) {
        // Clear existing pieces
        const existingPieces = document.querySelectorAll('.chess-piece');
        existingPieces.forEach(piece => piece.remove());
         
        // Get the white position for rendering orientation
        const whitePosition = game.whitePosition || 'bottom';
        const board = game.board;
         
        // Render each piece with coordinate transformation based on orientation
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = board[rank][file];
                if (piece) {
                    // Use original color for rendering
                    const color = piece.color;
                    
                    // Transform coordinates based on white position
                    let renderFile = file;
                    let renderRank = rank;
                    
                    switch (whitePosition) {
                        case 'top':
                            // Flip vertically - white at top
                            renderRank = 9 - rank;
                            break;
                        case 'left':
                            // Rotate 90 degrees counter-clockwise - white at left
                            renderFile = rank;
                            renderRank = 9 - file;
                            break;
                        case 'right':
                            // Rotate 90 degrees clockwise - white at right
                            renderFile = 9 - rank;
                            renderRank = file;
                            break;
                        case 'bottom':
                        default:
                            // Normal orientation - white at bottom
                            // No transformation needed
                            break;
                    }
                    
                    this.renderPiece(renderFile, renderRank, { ...piece, color });
                }
            }
        }
    }

    renderPiece(file, rank, piece) {
        const cell = this.getCellElement(file, rank);
        if (!cell) return;
        
        // Clear existing piece in this cell
        const existingPiece = cell.querySelector('.chess-piece');
        if (existingPiece) existingPiece.remove();
        
        // Create piece element
        const pieceElement = document.createElement('i');
        pieceElement.className = `fas ${this.getPieceIcon(piece.type)} chess-piece ${piece.color}`;
        pieceElement.dataset.piece = piece.type;
        pieceElement.dataset.color = piece.color;
        
        cell.appendChild(pieceElement);
    }

    getPieceIcon(pieceType) {
        const iconMap = {
            'king': 'fa-chess-king',
            'queen': 'fa-chess-queen',
            'rook': 'fa-chess-rook',
            'bishop': 'fa-chess-bishop',
            'knight': 'fa-chess-knight',
            'pawn': 'fa-chess-pawn',
            'trebuchet': 'fa-tower-observation'
        };
        
        return iconMap[pieceType] || 'fa-question';
    }

    getCellElement(file, rank) {
        return document.querySelector(`.cell[data-coord="${file}${rank}"]`);
    }

    highlightPiece(file, rank, className) {
        const cell = this.getCellElement(file, rank);
        if (cell) {
            cell.classList.add(className);
        }
    }

    highlightMoves(moves, whitePosition = 'bottom') {
        // Clear existing move highlights
        this.clearMoveHighlights();
          
        // Highlight each available move with coordinate transformation
        moves.forEach(move => {
            // Transform board coordinates to screen coordinates based on orientation
            let screenFile = move.file;
            let screenRank = move.rank;
            
            switch (whitePosition) {
                case 'top':
                    screenRank = 9 - move.rank;
                    break;
                case 'left':
                    screenFile = move.rank;
                    screenRank = 9 - move.file;
                    break;
                case 'right':
                    screenFile = 9 - move.rank;
                    screenRank = move.file;
                    break;
                case 'bottom':
                default:
                    // No transformation
                    break;
            }
            
            const cell = this.getCellElement(screenFile, screenRank);
            if (cell) {
                const highlight = document.createElement('div');
                highlight.className = `highlight ${move.capture ? 'capture-move' : 'available-move'}`;
                cell.appendChild(highlight);
            }
        });
    }

    clearHighlights() {
        this.clearSelectionHighlights();
        this.clearMoveHighlights();
    }

    clearSelectionHighlights() {
        const selectedCells = document.querySelectorAll('.selected-piece');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected-piece');
        });
    }

    clearMoveHighlights() {
        const moveHighlights = document.querySelectorAll('.highlight');
        moveHighlights.forEach(highlight => {
            highlight.remove();
        });
    }
}