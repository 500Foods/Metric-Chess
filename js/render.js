// Metric Chess - Rendering Logic

// Import the rotateGrid function from chess.js to ensure consistency
import { ChessGame } from './chess.js';

export class ChessRenderer {
    constructor() {
        this.boardElement = document.getElementById('chessBoard');
        this.chessGame = new ChessGame(); // For accessing rotateGrid method
    }

    initializeBoard() {
        // Clear existing board
        this.boardElement.innerHTML = '';

        // Create 10x10 grid - rank 9 at top, rank 0 at bottom to match display
        for (let rank = 9; rank >= 0; rank--) {
            for (let file = 0; file < 10; file++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.coord = `${file}${rank}`;

                // Set initial chessboard pattern - matches text version exactly
                // Dark square if (file + rank) % 2 === 1, light otherwise
                if ((file + rank) % 2 === 1) {
                    cell.classList.add('dark-square');
                } else {
                    cell.classList.add('light-square');
                }

                this.boardElement.appendChild(cell);
            }
        }
    }

    updateSquareColors(whitePosition = 'bottom') {
        // Use the 12x12 grid approach like the text version
        // Create a 12x12 grid and rotate it, then extract square colors
        
        // Create a 12x12 grid (10x10 board + 1-cell border for labels)
        const grid = Array(12).fill().map(() => Array(12).fill(null));
        
        // Fill the 10x10 chessboard in the center (positions 1-10 in 12x12 grid)
        // board[rank][file] where rank=0 is bottom, rank=9 is top
        // Map to display: rank 0 (bottom) -> grid row 10, rank 9 (top) -> grid row 1
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const displayRank = 10 - rank; // rank 0 -> 10, rank 9 -> 1
                const displayFile = file + 1; // file 0 -> 1, file 9 -> 10
                
                // Empty square - use dot for dark squares, null for light squares
                // Dark square if (file + rank) % 2 === 1 (matches text version)
                if ((file + rank) % 2 === 1) {
                    grid[displayRank][displayFile] = '·'; // Dark square
                } else {
                    grid[displayRank][displayFile] = null; // Light square
                }
            }
        }
        
        // Add corner labels for square colors (matches text version)
        grid[0][0] = 'D'; // top-left corner
        grid[11][11] = 'D'; // bottom-right corner
        grid[0][11] = 'L'; // top-right corner
        grid[11][0] = 'L'; // bottom-left corner
        
        // Map orientation to rotation degrees (same as text version)
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise
        };
        
        const degrees = orientationToDegrees[whitePosition] || 0;
        
        // Apply rotation using the same function as text output
        const rotatedGrid = this.chessGame.rotateGrid(grid, degrees);
        
        // Extract square colors from the rotated 12x12 grid
        // Map back to 10x10 screen coordinates
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const cell = rotatedGrid[y][x];
                
                // Only process the inner 10x10 board area (positions 1-10 in 12x12 grid)
                if (x >= 1 && x <= 10 && y >= 1 && y <= 10) {
                    // Map 12x12 coordinates to 10x10 screen coordinates
                    const screenFile = x - 1;
                    const screenRank = 10 - y; // Invert y-axis
                    
                    const cellElement = this.getCellElement(screenFile, screenRank);
                    if (!cellElement) continue;
                    
                    // Update square colors based on rotated grid
                    cellElement.classList.remove('light-square', 'dark-square');
                    
                    if (cell === '·') {
                        // Dark square (empty)
                        cellElement.classList.add('dark-square');
                    } else if (cell === null) {
                        // Light square (empty)
                        cellElement.classList.add('light-square');
                    }
                }
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
        
        // Update coordinate labels based on current orientation
        this.updateCoordinateLabels(whitePosition);
         
        // Create a 12x12 grid system to match text output approach
        const grid = Array(12).fill().map(() => Array(12).fill(null));
        
        // Fill the 10x10 chessboard in the center (positions 1-10 in 12x12 grid)
        // board[rank][file] where rank=0 is bottom, rank=9 is top
        // Map to display: rank 0 (bottom) -> grid row 10, rank 9 (top) -> grid row 1
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                // FIXED: Use correct mapping that matches text output
                const displayRank = 10 - rank; // rank 0 -> 10, rank 9 -> 1
                const displayFile = file + 1; // file 0 -> 1, file 9 -> 10
                 
                if (board[rank][file]) {
                    // Piece exists - store piece with original coordinates for square color determination
                    const piece = board[rank][file];
                    grid[displayRank][displayFile] = {
                        piece: piece,
                        originalFile: file,
                        originalRank: rank,
                        type: 'piece'
                    };
                } else {
                   // Empty square - use dot for dark squares, null for light squares
                   // Dark square if (file + rank) % 2 === 1 (matches text version exactly)
                   if ((file + rank) % 2 === 1) {
                       grid[displayRank][displayFile] = '·'; // Dark square
                   } else {
                       grid[displayRank][displayFile] = null; // Light square
                   }
               }
            }
        }
        
        // Map orientation to rotation degrees (same as text output)
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise (same as 90° counter-clockwise)
        };
        
        const degrees = orientationToDegrees[whitePosition] || 0;
        
        // Apply rotation using the same function as text output
        const rotatedGrid = this.chessGame.rotateGrid(grid, degrees);
        
        // Render pieces and set square colors using the 12x12 grid approach
        // This mirrors the text display logic exactly
        
        // Process the rotated 12x12 grid
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const cell = rotatedGrid[y][x];
                
                // Only process the inner 10x10 board area (positions 1-10 in 12x12 grid)
                if (x >= 1 && x <= 10 && y >= 1 && y <= 10) {
                    // Map 12x12 coordinates to 10x10 screen coordinates
                    const screenFile = x - 1;
                    const screenRank = 10 - y; // Invert y-axis
                    
                    const cellElement = this.getCellElement(screenFile, screenRank);
                    if (!cellElement) continue;
                    
                    // Clear existing piece and color classes
                    const existingPiece = cellElement.querySelector('.chess-piece');
                    if (existingPiece) existingPiece.remove();
                    cellElement.classList.remove('light-square', 'dark-square');
                    
                    // Set square color based on rotated grid content
                    if (cell === '·') {
                        // Dark square (empty)
                        cellElement.classList.add('dark-square');
                    } else if (cell === null) {
                        // Light square (empty)
                        cellElement.classList.add('light-square');
                    } else if (cell && typeof cell === 'object' && cell.type === 'piece') {
                        // Chess piece - set square color first, then render piece
                        // Determine square color based on the original board position
                        const originalFile = cell.originalFile;
                        const originalRank = cell.originalRank;
                        
                        if ((originalFile + originalRank) % 2 === 1) {
                            cellElement.classList.add('dark-square');
                        } else {
                            cellElement.classList.add('light-square');
                        }
                        
                        // Render the piece on top of the colored square
                        this.renderPiece(screenFile, screenRank, cell.piece);
                    }
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
           
        // Create a 12x12 grid to map moves using the same approach as rendering
        const grid = Array(12).fill().map(() => Array(12).fill(null));
        
        // Mark the moves in the grid
        moves.forEach(move => {
            // Convert board coordinates to display coordinates
            const displayRank = 10 - move.rank; // rank 0 -> 10, rank 9 -> 1
            const displayFile = move.file + 1; // file 0 -> 1, file 9 -> 10
            
            grid[displayRank][displayFile] = move;
        });
        
        // Map orientation to rotation degrees
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise
        };
        
        const degrees = orientationToDegrees[whitePosition] || 0;
        
        // Apply rotation
        const rotatedGrid = this.chessGame.rotateGrid(grid, degrees);
        
        // Highlight moves from the rotated grid
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const cell = rotatedGrid[y][x];
                
                // Check if this cell contains a move (not a piece or empty square)
                if (cell && typeof cell === 'object' && cell.file !== undefined && cell.rank !== undefined && x >= 1 && x <= 10 && y >= 1 && y <= 10) {
                    // FIXED: Map 12x12 coordinates to 10x10 screen coordinates correctly
                    const screenFile = x - 1;
                    const screenRank = 10 - y; // FIXED: Invert y-axis
                    
                    const cellElement = this.getCellElement(screenFile, screenRank);
                    if (cellElement) {
                        const highlight = document.createElement('div');
                        highlight.className = `highlight ${cell.capture ? 'capture-move' : 'available-move'}`;
                        cellElement.appendChild(highlight);
                    }
                }
            }
        }
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
    
    updateCoordinateLabels(whitePosition = 'bottom') {
        // Update the coordinate labels based on current orientation
        // Create a 12x12 grid system to match text output approach
        const grid = Array(12).fill().map(() => Array(12).fill(null));

        // Add labels to the border for 0° rotation (bottom orientation)
        // Bottom labels (0-9) - row 11, columns 1-10
        for (let i = 0; i < 10; i++) {
            grid[11][i + 1] = String(i);
        }

        // Left labels (9-0) - column 0, rows 1-10 (9 at top, 0 at bottom)
        for (let i = 0; i < 10; i++) {
            grid[i + 1][0] = String(9 - i); // 9,8,7,...,0
        }

        // Add corner labels for square colors
        grid[0][0] = 'D';
        grid[11][11] = 'D';
        grid[0][11] = 'L';
        grid[11][0] = 'L';

        // Map orientation to rotation degrees
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise
        };

        const degrees = orientationToDegrees[whitePosition] || 0;

        // Apply rotation
        const rotatedGrid = this.chessGame.rotateGrid(grid, degrees);

        // Update the HTML coordinate labels based on the rotated grid
        this.updateLabelElements(rotatedGrid, whitePosition);
    }
    
    updateLabelElements(rotatedGrid, whitePosition) {
        // Hide all label containers first
        document.querySelectorAll('.coordinate-labels').forEach(el => el.style.display = 'none');

        // Determine which sides to show based on orientation
        const sidesToShow = {
            'bottom': ['bottom', 'left'],
            'left': ['left', 'top'],
            'top': ['top', 'right'],
            'right': ['right', 'bottom']
        };

        const activeSides = sidesToShow[whitePosition] || ['bottom', 'left'];

        // Extract labels from the rotated grid border
        const labels = {
            bottom: rotatedGrid[11].slice(1, 11).map(cell => cell || ''),
            left: rotatedGrid.slice(1, 11).map(row => row[0] || ''),
            top: rotatedGrid[0].slice(1, 11).map(cell => cell || ''),
            right: rotatedGrid.slice(1, 11).map(row => row[11] || '')
        };

        // Update and show the active sides
        activeSides.forEach(side => {
            if (side === 'bottom' || side === 'top') {
                this.updateFileLabels(`.file-labels.${side}`, labels[side]);
            } else {
                this.updateRankLabels(`.rank-labels.${side}`, labels[side]);
            }
            document.querySelector(`.${side === 'bottom' || side === 'top' ? 'file' : 'rank'}-labels.${side}`).style.display = 'flex';
        });
    }
    
    updateFileLabels(selector, labels) {
        const container = document.querySelector(selector);
        if (!container) return;
        
        const labelElements = container.querySelectorAll('.file-label');
        for (let i = 0; i < labelElements.length && i < labels.length; i++) {
            labelElements[i].textContent = labels[i];
        }
    }
    
    updateRankLabels(selector, labels) {
        const container = document.querySelector(selector);
        if (!container) return;
        
        const labelElements = container.querySelectorAll('.rank-label');
        for (let i = 0; i < labelElements.length && i < labels.length; i++) {
            labelElements[i].textContent = labels[i];
        }
    }
}