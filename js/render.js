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

    renderBoard(board) {
        // Clear existing pieces
        const existingPieces = document.querySelectorAll('.chess-piece');
        existingPieces.forEach(piece => piece.remove());
        
        // Check if we have a flipped board
        const actualBoard = board.flippedBoard || board;
        
        // Render each piece
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = actualBoard[rank][file];
                if (piece) {
                    // Use displayColor if available (for flipped boards), otherwise use piece.color
                    const color = piece.displayColor || piece.color;
                    this.renderPiece(file, rank, { ...piece, color });
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

    highlightMoves(moves) {
        // Clear existing move highlights
        this.clearMoveHighlights();
        
        // Highlight each available move
        moves.forEach(move => {
            const cell = this.getCellElement(move.file, move.rank);
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