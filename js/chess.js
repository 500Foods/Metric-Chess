// Metric Chess - Game Logic

// Piece types and their Font Awesome icons
const PIECE_ICONS = {
    'king': 'fa-chess-king',
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
    }

    getAvailableMoves(file, rank) {
        const piece = this.board[rank][file];
        if (!piece) return [];
        
        const moves = [];
        
        if (piece.type === 'trebuchet') {
            // Special trebuchet movement (Chebyshev distance = 3)
            return this.getTrebuchetMoves(file, rank);
        }
        
        if (piece.type === 'pawn') {
            return this.getPawnMoves(file, rank);
        }
        
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
        
        return moves;
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
        
        // Save move to history
        this.gameHistory.push({
            from: { file: fromFile, rank: fromRank },
            to: { file: toFile, rank: toRank },
            piece: { ...piece },
            captured: targetPiece,
            notation: moveNotation
        });
        
        // Add to move notation list
        this.moveNotation.push({
            moveNumber: Math.floor(this.moveCount / 2) + 1,
            player: this.currentPlayer,
            notation: moveNotation
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
        
        // Save to redo stack before undoing
        this.redoStack.push(lastMove);
        
        // Restore the piece to original position
        this.board[lastMove.from.rank][lastMove.from.file] = lastMove.piece;
        this.board[lastMove.to.rank][lastMove.to.file] = lastMove.captured || null;
        
        // Restore captured piece if any
        if (lastMove.captured) {
            this.capturedPieces[lastMove.piece.color].pop();
        }
        
        // Remove from move notation
        this.moveNotation.pop();
        
        // Switch player back
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.moveCount--;
        
        return true;
    }

    redoMove() {
        if (this.redoStack.length === 0) return false;
        
        const moveToRedo = this.redoStack.pop();
        
        // Get the piece from the original position
        const piece = this.board[moveToRedo.from.rank][moveToRedo.from.file];
        if (!piece) return false;
        
        // Move the piece back
        this.board[moveToRedo.to.rank][moveToRedo.to.file] = piece;
        this.board[moveToRedo.from.rank][moveToRedo.from.file] = null;
        
        // Restore captured piece if any
        if (moveToRedo.captured) {
            this.capturedPieces[piece.color].push(moveToRedo.captured);
        }
        
        // Restore move to history and notation
        this.gameHistory.push(moveToRedo);
        this.moveNotation.push({
            moveNumber: Math.floor(this.moveCount / 2) + 1,
            player: this.currentPlayer,
            notation: moveToRedo.notation
        });
        
        // Switch player
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
                    const moves = this.getAvailableMoves(file, rank);
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

    getPieceIcon(piece) {
        if (!piece) return null;
        return PIECE_ICONS[piece.type];
    }
}