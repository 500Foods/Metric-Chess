// Metric Chess - Game Logic
import StockfishEngine from './stockfish/stockfish-integration.js';

// Piece types and their Font Awesome icons
const PIECE_ICONS = {
    'king': 'fa-chess-king',
    'heir': 'fa-chess-king', // Heir king uses same icon
    'queen': 'fa-chess-queen',
    'rook': 'fa-chess-rook',
    'bishop': 'fa-chess-bishop',
    'knight': 'fa-chess-knight',
    'pawn': 'fa-chess-pawn',
    'trebuchet': 'fa-tower-observation'
};

// Movement patterns for each piece type
const MOVEMENT_PATTERNS = {
    'king': [
        {dx: -1, dy: -1}, {dx: -1, dy: 0}, {dx: -1, dy: 1},
        {dx: 0, dy: -1}, {dx: 0, dy: 1},
        {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1}
    ],
    'heir': [
        {dx: -1, dy: -1}, {dx: -1, dy: 0}, {dx: -1, dy: 1},
        {dx: 0, dy: -1}, {dx: 0, dy: 1},
        {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1}
    ],
    'queen': [
        // Horizontal/Vertical
        {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1},
        // Diagonal
        {dx: -1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: 1, dy: 1}
    ],
    'rook': [
        {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}
    ],
    'bishop': [
        {dx: -1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: 1, dy: 1}
    ],
    'knight': [
        {dx: -2, dy: -1}, {dx: -2, dy: 1}, {dx: -1, dy: -2}, {dx: -1, dy: 2},
        {dx: 1, dy: -2}, {dx: 1, dy: 2}, {dx: 2, dy: -1}, {dx: 2, dy: 1}
    ],
    'pawn': {
        'white': [{dx: 0, dy: 1}, {dx: 0, dy: 2}],
        'black': [{dx: 0, dy: -1}, {dx: 0, dy: -2}]
    }
};

export class ChessGame {
    constructor() {
        this.board = Array(10).fill().map(() => Array(10).fill(null));
        this.currentPlayer = 'white';
        this.gameHistory = [];
        this.redoStack = [];
        this.capturedPieces = { white: [], black: [] };
        this.moveCount = 0;
        this.moveNotation = [];
        this.bottomPlayerType = 'human'; // Default to human
        this.topPlayerType = 'human';    // Default to human
        this.whitePosition = 'bottom';   // 'bottom', 'top', 'left', 'right'
        this.aiTimeLimit = 3000;         // AI thinking time in milliseconds (3 seconds default)

        // Initialize AI engine
        this.aiEngine = new StockfishEngine();

        // Initialize the board with Metric Chess setup
        this.reset();
    }

    reset() {
        // Clear the board
        this.board = Array(10).fill().map(() => Array(10).fill(null));
        this.currentPlayer = 'white';
        this.gameHistory = [];
        this.redoStack = [];
        this.capturedPieces = { white: [], black: [] };
        this.moveCount = 0;
        this.moveNotation = [];

        // Set up white pieces (rank 0 and 1) - DATA: white at bottom
        // Setup: TRNBQKBNRT
        this.board[0][0] = { type: 'trebuchet', color: 'white' };
        this.board[0][1] = { type: 'rook', color: 'white' };
        this.board[0][2] = { type: 'knight', color: 'white' };
        this.board[0][3] = { type: 'bishop', color: 'white' };
        this.board[0][4] = { type: 'queen', color: 'white' };
        this.board[0][5] = { type: 'king', color: 'white' };
        this.board[0][6] = { type: 'bishop', color: 'white' };
        this.board[0][7] = { type: 'knight', color: 'white' };
        this.board[0][8] = { type: 'rook', color: 'white' };
        this.board[0][9] = { type: 'trebuchet', color: 'white' };

        // White pawns (rank 1)
        for (let file = 0; file < 10; file++) {
            this.board[1][file] = { type: 'pawn', color: 'white' };
        }

        // Set up black pieces (rank 9 and 8) - DATA: black at top
        // Setup: TRNBQKBNRT
        this.board[9][0] = { type: 'trebuchet', color: 'black' };
        this.board[9][1] = { type: 'rook', color: 'black' };
        this.board[9][2] = { type: 'knight', color: 'black' };
        this.board[9][3] = { type: 'bishop', color: 'black' };
        this.board[9][4] = { type: 'queen', color: 'black' };
        this.board[9][5] = { type: 'king', color: 'black' };
        this.board[9][6] = { type: 'bishop', color: 'black' };
        this.board[9][7] = { type: 'knight', color: 'black' };
        this.board[9][8] = { type: 'rook', color: 'black' };
        this.board[9][9] = { type: 'trebuchet', color: 'black' };

        // Black pawns (rank 8)
        for (let file = 0; file < 10; file++) {
            this.board[8][file] = { type: 'pawn', color: 'black' };
        }

        // Store initial board state
        this.initialBoard = this.board.map(row => [...row]);
    }

    getPseudoLegalMoves(file, rank) {
        const piece = this.board[rank][file];
        if (!piece) return [];

        const moves = [];

        if (piece.type === 'trebuchet') {
            // Special trebuchet movement (Chebyshev distance = 3)
            moves.push(...this.getTrebuchetMoves(file, rank));
        } else if (piece.type === 'pawn') {
            moves.push(...this.getPawnMoves(file, rank));
        } else {
            // Standard piece movement
            const patterns = MOVEMENT_PATTERNS[piece.type];

            for (const pattern of patterns) {
                let dx = pattern.dx;
                let dy = pattern.dy;
                let x = file + dx;
                let y = rank + dy;

                // Check if within bounds
                if (x < 0 || x >= 10 || y < 0 || y >= 10) continue;

                const targetPiece = this.board[y][x];

                // For sliding pieces (queen, rook, bishop), continue in direction until blocked
                if (['queen', 'rook', 'bishop'].includes(piece.type)) {
                    let validMoves = this.getSlidingMoves(file, rank, dx, dy);
                    moves.push(...validMoves);
                } else {
                    // Non-sliding pieces (king, knight)
                    if (!targetPiece || targetPiece.color !== piece.color) {
                        moves.push({ file: x, rank: y, capture: !!targetPiece });
                    }
                }
            }
        }

        return moves;
    }

    getAvailableMoves(file, rank) {
        const pseudoMoves = this.getPseudoLegalMoves(file, rank);

        // Filter out moves that would leave the king in check
        return pseudoMoves.filter(move => {
            // Simulate the move
            const originalBoard = this.board.map(row => [...row]);
            const originalCurrentPlayer = this.currentPlayer;

            // Make the move
            this.board[move.rank][move.file] = this.board[rank][file];
            this.board[rank][file] = null;

            // Check if the move leaves the current player's king in check
            const leavesKingInCheck = this.isCheck();

            // Restore
            this.board = originalBoard;
            this.currentPlayer = originalCurrentPlayer;

            // Keep the move only if it doesn't leave king in check
            return !leavesKingInCheck;
        });
    }

    getSlidingMoves(file, rank, dx, dy) {
        const moves = [];
        const piece = this.board[rank][file];
        
        for (let distance = 1; distance < 10; distance++) {
            const x = file + dx * distance;
            const y = rank + dy * distance;
            
            // Check bounds
            if (x < 0 || x >= 10 || y < 0 || y >= 10) break;
            
            const targetPiece = this.board[y][x];
            
            // If empty square, add to moves
            if (!targetPiece) {
                moves.push({ file: x, rank: y, capture: false });
            } else {
                // If opponent's piece, add capture move and stop
                if (targetPiece.color !== piece.color) {
                    moves.push({ file: x, rank: y, capture: true });
                }
                // Stop sliding if any piece is encountered
                break;
            }
        }
        
        return moves;
    }

    getTrebuchetMoves(file, rank) {
        const moves = [];
        const piece = this.board[rank][file];
        
        // Chebyshev distance = 3 (max of dx, dy = 3)
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const dx = Math.abs(x - file);
                const dy = Math.abs(y - rank);
                const distance = Math.max(dx, dy);
                
                if (distance === 3 && !(dx === 0 && dy === 0)) {
                    const targetPiece = this.board[y][x];
                    
                    // Can move to empty square or capture opponent's piece
                    if (!targetPiece || targetPiece.color !== piece.color) {
                        moves.push({ file: x, rank: y, capture: !!targetPiece });
                    }
                }
            }
        }
        
        return moves;
    }

    getPawnMoves(file, rank) {
        const moves = [];
        const piece = this.board[rank][file];
        const direction = piece.color === 'white' ? 1 : -1;
         
        // Forward movement - pawns can always move 1 or 2 squares
        const oneStep = rank + direction;
        if (oneStep >= 0 && oneStep < 10 && !this.board[oneStep][file]) {
            moves.push({ file: file, rank: oneStep, capture: false });
             
            // Two steps forward (always allowed if path is clear)
            const twoSteps = rank + (direction * 2);
            if (twoSteps >= 0 && twoSteps < 10 && !this.board[twoSteps][file]) {
                moves.push({ file: file, rank: twoSteps, capture: false });
            }
        }
         
        // Captures (diagonal)
        const captureFiles = [file - 1, file + 1];
        for (const captureFile of captureFiles) {
            if (captureFile >= 0 && captureFile < 10) {
                const captureRank = rank + direction;
                if (captureRank >= 0 && captureRank < 10) {
                    const targetPiece = this.board[captureRank][captureFile];
                    if (targetPiece && targetPiece.color !== piece.color) {
                        moves.push({ file: captureFile, rank: captureRank, capture: true });
                    }
                }
            }
        }
         
        return moves;
    }

    movePiece(fromFile, fromRank, toFile, toRank) {
        const piece = this.board[fromRank][fromFile];
        if (!piece) return false;
        
        // Check if move is valid
        const availableMoves = this.getAvailableMoves(fromFile, fromRank);
        const isValidMove = availableMoves.some(move =>
            move.file === toFile && move.rank === toRank
        );
        
        if (!isValidMove) return false;
        
        // Check for pawn promotion
        if (piece.type === 'pawn' &&
            ((piece.color === 'white' && toRank === 9) ||
             (piece.color === 'black' && toRank === 0))) {
            // Promote to queen (default)
            piece.type = 'queen';
        }
        
        // Generate move notation
        const moveNotation = this.generateMoveNotation(piece, fromFile, fromRank, toFile, toRank);

        // Move the piece
        this.board[toRank][toFile] = piece;
        this.board[fromRank][fromFile] = null;

        // Check if capture
        const targetPiece = this.board[toRank][toFile];
        if (targetPiece && targetPiece.color !== piece.color) {
            this.capturedPieces[piece.color].push(targetPiece);
        }

        // Add to move notation list
        this.moveNotation.push({
            moveNumber: Math.floor(this.moveCount / 2) + 1,
            player: this.currentPlayer,
            notation: moveNotation
        });

        // Save move to history
        this.gameHistory.push({
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer,
            moveCount: this.moveCount,
            capturedPieces: { ...this.capturedPieces },
            notation: [...this.moveNotation]
        });

        // Clear redo stack when making a new move
        this.redoStack = [];

        // Switch player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.moveCount++;
        
        return true;
    }

    undoMove() {
        if (this.gameHistory.length === 0) return false;

        const lastMove = this.gameHistory.pop();

        // Save to redo stack
        this.redoStack.push(lastMove);

        // Restore to previous state
        if (this.gameHistory.length > 0) {
            const prevState = this.gameHistory[this.gameHistory.length - 1];
            this.board = prevState.board.map(row => [...row]);
            this.currentPlayer = prevState.currentPlayer;
            this.moveCount = prevState.moveCount;
            this.capturedPieces = { ...prevState.capturedPieces };
            this.moveNotation = [...prevState.notation];
        } else {
            // Restore initial state
            this.board = this.initialBoard.map(row => [...row]);
            this.currentPlayer = 'white';
            this.moveCount = 0;
            this.capturedPieces = { white: [], black: [] };
            this.moveNotation = [];
        }

        return true;
    }

    redoMove() {
        if (this.redoStack.length === 0) return false;

        const stateToRedo = this.redoStack.pop();

        // Restore the state
        this.board = stateToRedo.board.map(row => [...row]);
        this.currentPlayer = stateToRedo.currentPlayer;
        this.moveCount = stateToRedo.moveCount;
        this.capturedPieces = { ...stateToRedo.capturedPieces };
        this.moveNotation = [...stateToRedo.notation];

        // Push back to history
        this.gameHistory.push(stateToRedo);

        // Switch player and increment count as if the move was just made
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.moveCount++;

        return true;
    }

    generateMoveNotation(piece, fromFile, fromRank, toFile, toRank) {
        // Generate notation in Metric Chess format
        const pieceSymbol = piece.type.charAt(0).toUpperCase();
        const fromCoord = `${fromFile}${fromRank}`;
        const toCoord = `${toFile}${toRank}`;
        
        // Check if it's a capture
        const targetPiece = this.board[toRank][toFile];
        if (targetPiece && targetPiece.color !== piece.color) {
            return `${pieceSymbol}${fromCoord}x${toCoord}`;
        }
        
        // Regular move
        return `${pieceSymbol}${fromCoord}-${toCoord}`;
    }

    isCheck() {
        // Find the king position
        let kingFile, kingRank;
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = this.board[rank][file];
                if (piece && piece.type === 'king' && piece.color === this.currentPlayer) {
                    kingFile = file;
                    kingRank = rank;
                    break;
                }
            }
        }

        if (kingFile === undefined || kingRank === undefined) return false;

        // Check if any opponent piece can attack the king
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = this.board[rank][file];
                if (piece && piece.color !== this.currentPlayer) {
                    const moves = this.getPseudoLegalMoves(file, rank);
                    const canAttackKing = moves.some(move =>
                        move.file === kingFile && move.rank === kingRank
                    );

                    if (canAttackKing) return true;
                }
            }
        }

        return false;
    }

    isCheckmate() {
        if (!this.isCheck()) return false;

        // Check if current player has any legal moves
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = this.board[rank][file];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getAvailableMoves(file, rank);
                    if (moves.length > 0) return false;
                }
            }
        }

        return true;
    }

    isStalemate() {
        if (this.isCheck()) return false;

        // Check if current player has any legal moves
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const piece = this.board[rank][file];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getAvailableMoves(file, rank);
                    if (moves.length > 0) return false;
                }
            }
        }

        return true;
    }

    getPieceIcon(piece) {
        if (!piece) return null;
        return PIECE_ICONS[piece.type];
    }

    // Generate FEN notation for the current board position
    generateFEN() {
        let fen = '';

        for (let rank = 9; rank >= 0; rank--) { // Start from rank 9 (top) to 0 (bottom)
            let emptyCount = 0;
            for (let file = 0; file < 10; file++) {
                const piece = this.board[rank][file];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    let symbol = piece.type.charAt(0).toUpperCase();
                    if (piece.type === 'knight') symbol = 'N';
                    if (piece.type === 'trebuchet') symbol = 'T';
                    if (piece.type === 'heir') symbol = 'H';
                    fen += piece.color === 'white' ? symbol : symbol.toLowerCase();
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            if (rank > 0) fen += '/';
        }

        // Add current player
        fen += ` ${this.currentPlayer.charAt(0)}`;

        // Add castling rights (none for now)
        fen += ' -';

        // Add en passant (none for now)
        fen += ' -';

        // Add halfmove clock and fullmove number
        fen += ` 0 ${Math.floor(this.moveCount / 2) + 1}`;

        return fen;
    }

    // Get AI move using fairy-stockfish
    getAIMove(callback) {
        const fen = this.generateFEN();
        console.log('Setting FEN for AI:', fen);
        this.aiEngine.setPosition(fen);
        this.aiEngine.go(this.aiTimeLimit, (move) => {
            console.log('Raw UCI move from ffish:', move);
            
            // Parse UCI move format (e.g., "a2b3" for file a rank 2 to file b rank 3)
            // Files: a-j = 0-9
            // Ranks: 1-10 = 0-9
            // UCI format can be "a2b3" or "a10b10" so we need to be careful
            const match = move.match(/^([a-j])(\d+)([a-j])(\d+)/);
            if (!match) {
                console.error('Invalid UCI move format:', move);
                callback({ fromFile: NaN, fromRank: NaN, toFile: NaN, toRank: NaN });
                return;
            }
            
            const fromFile = match[1].charCodeAt(0) - 'a'.charCodeAt(0);  // a=0, b=1, ..., j=9
            const fromRank = parseInt(match[2]) - 1;  // 1=0, 2=1, ..., 10=9
            const toFile = match[3].charCodeAt(0) - 'a'.charCodeAt(0);
            const toRank = parseInt(match[4]) - 1;

            console.log('Parsed move:', { fromFile, fromRank, toFile, toRank });
            callback({ fromFile, fromRank, toFile, toRank });
        });
    }

    // Compact text board display function
    displayBoardCompact() {
        console.log('Compact Text Board (0-9 at bottom and left):');
        
        for (let rank = 9; rank >= 0; rank--) { // Start from top (9) to bottom (0)
            let row = rank + ' '; // Row number (left)
            
            for (let file = 0; file < 10; file++) {
                const piece = this.board[rank][file];
                
                if (piece) {
                    // Use lowercase for white, uppercase for black
                    // Special case for knight to use 'n' instead of 'k'
                    let symbol;
                    if (piece.type === 'knight') {
                        symbol = 'n';
                    } else {
                        symbol = piece.type.charAt(0);
                    }
                    row += (piece.color === 'white' ? symbol.toLowerCase() : symbol.toUpperCase()) + ' ';
                } else {
                    row += '. '; // Empty square
                }
            }
            
            console.log(row);
        }
        
        console.log('  0 1 2 3 4 5 6 7 8 9'); // Column headers (bottom only)
        
        console.log('\nPiece Legend:');
        console.log('Lowercase = White pieces: t=trebuchet, r=rook, n=knight, b=bishop, q=queen, k=king, p=pawn');
        console.log('Uppercase = Black pieces: T=trebuchet, R=rook, N=knight, B=bishop, Q=queen, K=king, P=pawn');
        console.log('. = Empty square');
    }

    /**
     * Rotates a 12x12 grid clockwise by a multiple of 90 degrees.
     * @param {Array<Array<any>>} grid - The 12x12 2D array to rotate
     * @param {number} degrees - Rotation in degrees: 0, 90, 180, or 270 (clockwise)
     * @returns {Array<Array<any>>} A new 12x12 rotated grid
     */
    rotateGrid(grid, degrees) {
      // Normalize and validate input
      const normalizedDegrees = ((degrees % 360) + 360) % 360;
      if (![0, 90, 180, 270].includes(normalizedDegrees)) {
        throw new Error("Rotation must be a multiple of 90 degrees (0, 90, 180, 270)");
      }

      const size = 12;
      const rotations = normalizedDegrees / 90;

      let current = grid.map(row => [...row]); // deep copy

      for (let r = 0; r < rotations; r++) {
        const rotated = Array.from({ length: size }, () => Array(size).fill(null));

        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            // Clockwise 90°: (x, y) -> (y, size - 1 - x)
            rotated[y][size - 1 - x] = current[x][y];
          }
        }
        current = rotated;
      }

      return current;
    }

    // Display board with orientation transformation using 12x12 grid and proper rotation
    displayBoardWithOrientation(orientation) {
        console.log(`Compact Text Board (Orientation: ${orientation}):`);

        // Create a 12x12 grid (10x10 board + 1-cell border for labels)
        const grid = Array(12).fill().map(() => Array(12).fill(null));

        // Fill the 10x10 chessboard in the center (positions 1-10 in 12x12 grid)
        // board[rank][file] where rank=0 is bottom, rank=9 is top
        // Map to display: rank 0 (bottom) -> grid row 10, rank 9 (top) -> grid row 1
        for (let rank = 0; rank < 10; rank++) {
            for (let file = 0; file < 10; file++) {
                const displayRank = 10 - rank; // rank 0 -> 10, rank 9 -> 1
                const displayFile = file + 1; // file 0 -> 1, file 9 -> 10
                
                if (this.board[rank][file]) {
                    // Piece exists
                    grid[displayRank][displayFile] = this.board[rank][file];
                } else {
                    // Empty square - use dot for dark squares, null for light squares
                    // Dark square if (file + rank) % 2 === 1
                    if ((file + rank) % 2 === 1) {
                        grid[displayRank][displayFile] = '·'; // Dark square - use middle dot
                    } else {
                        grid[displayRank][displayFile] = null; // Light square - empty
                    }
                }
            }
        }

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
        // (0,0) = D (dark), (11,11) = D (dark), (0,11) = L (light), (11,0) = L (light)
        grid[0][0] = 'D'; // top-left corner
        grid[11][11] = 'D'; // bottom-right corner
        grid[0][11] = 'L'; // top-right corner
        grid[11][0] = 'L'; // bottom-left corner

        // Map orientation to rotation degrees
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise (same as 90° counter-clockwise)
        };

        const degrees = orientationToDegrees[orientation] || 0;
        console.log(`Rotation: ${degrees}° clockwise`);
        
        // Apply rotation using the proper rotation function
        const rotatedGrid = this.rotateGrid(grid, degrees);

        // Display the rotated 12x12 grid
        // Each cell takes exactly 2 characters of width
        for (let y = 0; y < 12; y++) {
            let row = '';
            
            for (let x = 0; x < 12; x++) {
                const cell = rotatedGrid[y][x];
                
                if (cell === null) {
                    row += '  '; // Empty border cell
                } else if (typeof cell === 'string') {
                    // Label cell (D, L, or number labels)
                    if (cell === 'D' || cell === 'L') {
                        row += cell + ' '; // Corner labels: "D " or "L "
                    } else if (y === 11) {
                        // Bottom labels: "0 " "1 " etc
                        row += cell + ' ';
                    } else {
                        // Left labels: "9 " "8 " etc (left-aligned with space after)
                        row += cell + ' ';
                    }
                } else if (cell) {
                    // Chess piece
                    let symbol;
                    if (cell.type === 'knight') {
                        symbol = 'n';
                    } else {
                        symbol = cell.type.charAt(0);
                    }
                    row += (cell.color === 'white' ? symbol.toLowerCase() : symbol.toUpperCase()) + ' ';
                } else if (cell === '·') {
                    // Dark empty square
                    row += '· ';
                } else {
                    // Light empty square or border
                    row += '  ';
                }
            }
            
            // Remove trailing space
            console.log(row.trimEnd());
        }

        console.log('\nPiece Legend:');
        console.log('Lowercase = White pieces: t=trebuchet, r=rook, n=knight, b=bishop, q=queen, k=king, p=pawn');
        console.log('Uppercase = Black pieces: T=trebuchet, R=rook, N=knight, B=bishop, Q=queen, K=king, P=pawn');
        console.log('· = Empty dark square, D/L = Corner square colors (Dark/Light)');
    }
}