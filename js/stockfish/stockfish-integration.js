// Fairy-Stockfish (ffish.js) integration for Metric Chess

class StockfishEngine {
    constructor() {
        this.ffish = null;
        this.board = null;
        this.isReady = false;
        this.onReadyCallback = null;
        this.moveCallback = null;
        this.thinking = false;
        this.init();
    }

    async init() {
        try {
            // Wait for ffish Module to be loaded and initialized
            let attempts = 0;
            while ((!window.Module || !window.Module.Board) && attempts < 200) {
                await new Promise(resolve => setTimeout(resolve, 50));
                attempts++;
            }

            if (!window.Module || !window.Module.Board) {
                throw new Error('ffish Module not loaded or not ready');
            }

            // Use the global Module object
            this.ffish = window.Module;

            console.log('Fairy-Stockfish info:', this.ffish.info());
            console.log('Available variants:', this.ffish.variants());

            // Load the Metric Chess variant configuration
            this.loadMetricChessVariant();

            // Enable multithreading for better performance
            try {
                this.ffish.setOptionInt("Threads", navigator.hardwareConcurrency || 4);
                console.log(`Multithreading enabled with ${navigator.hardwareConcurrency || 4} threads`);
            } catch (error) {
                console.log('Multithreading not available:', error.message);
            }

            this.isReady = true;
            console.log('Fairy-Stockfish initialized successfully with Metric Chess variant');

            if (this.onReadyCallback) {
                this.onReadyCallback();
            }
        } catch (error) {
            console.error('Failed to initialize Fairy-Stockfish:', error);
        }
    }

    loadMetricChessVariant() {
        // Define the Metric Chess variant configuration for Fairy-Stockfish
        const metricChessConfig = `
# Metric Chess - 10x10 variant with trebuchets
[metricchess:chess]
maxRank = 10
maxFile = 10
startFen = trnbqkbnrt/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/TRNBQKBNRT w - - 0 1
promotionRank = 10
promotionPieceTypes = q r b n t k
doubleStep = true
doubleStepRank = 2
doubleStepRankMin = 2
castling = true
castlingKingSide = true
castlingQueenSide = true
# Trebuchet piece that moves exactly distance 3 (Chebyshev distance)
customPiece1 = t:mQ3
pieceToCharTable = PNBRQ..........Kpnbrq..........k......T.......t
`;

        try {
            this.ffish.loadVariantConfig(metricChessConfig);
            console.log('Metric Chess variant configuration loaded successfully');
        } catch (error) {
            console.error('Failed to load Metric Chess variant:', error);
        }
    }

    onReady(callback) {
        this.onReadyCallback = callback;
        if (this.isReady) {
            callback();
        }
    }

    setPosition(fen) {
        if (this.isReady) {
            try {
                // Create a new board with the Metric Chess variant
                if (this.board) {
                    this.board.delete();
                }
                this.board = new this.ffish.Board('metricchess', fen || undefined);
                console.log('Position set:', this.board.fen());
            } catch (error) {
                console.error('Error setting position:', error);
            }
        }
    }

    getLegalMoves() {
        if (this.board) {
            const moves = this.board.legalMoves();
            return moves ? moves.split(' ').filter(m => m.length > 0) : [];
        }
        return [];
    }

    makeMove(move) {
        if (this.board) {
            return this.board.push(move);
        }
        return false;
    }

    getFen() {
        if (this.board) {
            return this.board.fen();
        }
        return null;
    }

    isGameOver() {
        if (this.board) {
            return this.board.isGameOver();
        }
        return false;
    }

    getResult() {
        if (this.board) {
            return this.board.result();
        }
        return '*';
    }

    // Time-based AI move selection using Fairy-Stockfish's built-in search
    async go(timeLimitMs = 3000, callback) {
        if (!this.isReady || !this.board || this.thinking) {
            console.log('Cannot make AI move:', { isReady: this.isReady, hasBoard: !!this.board, thinking: this.thinking });
            return;
        }

        this.thinking = true;
        this.moveCallback = callback;

        // Try to use Fairy-Stockfish's built-in search first
        try {
            // Check if the board has a go method (UCI-style search)
            if (typeof this.board.go === 'function') {
                console.log('Using Fairy-Stockfish built-in search');

                // Set up search parameters
                const searchOptions = {
                    movetime: timeLimitMs,
                    threads: navigator.hardwareConcurrency || 4, // Use available CPU cores
                    depth: 20 // Allow deep search within time limit
                };

                // Start the search
                this.board.go(searchOptions, (result) => {
                    this.thinking = false;
                    console.log('Fairy-Stockfish search result:', result);

                    if (result && result.bestmove) {
                        this.moveCallback(result.bestmove);
                    } else {
                        console.warn('No bestmove from Fairy-Stockfish, falling back to custom search');
                        this.fallbackSearch(timeLimitMs, callback);
                    }
                });
            } else {
                throw new Error('Built-in search not available');
            }
        } catch (error) {
            console.log('Built-in search failed, using custom iterative deepening:', error.message);
            this.fallbackSearch(timeLimitMs, callback);
        }
    }

    // Fallback to custom iterative deepening search
    fallbackSearch(timeLimitMs, callback) {
        setTimeout(() => {
            try {
                const bestMove = this.findBestMoveIterativeDeepening(timeLimitMs);
                this.thinking = false;

                console.log('AI selected move (fallback):', bestMove);

                if (bestMove && this.moveCallback) {
                    this.moveCallback(bestMove);
                }
            } catch (error) {
                console.error('Error in fallback search:', error);
                this.thinking = false;
            }
        }, 100);
    }

    findBestMoveIterativeDeepening(timeLimitMs) {
        const legalMoves = this.getLegalMoves();

        console.log('Legal moves from ffish:', legalMoves);

        if (legalMoves.length === 0) {
            console.warn('No legal moves available');
            return null;
        }

        // Prioritize aggressive moves: captures, checks, and center moves
        const prioritizedMoves = this.prioritizeMoves(legalMoves);

        const startTime = Date.now();
        let bestMove = null;
        let bestScore = -Infinity;
        let currentDepth = 1;

        // Iterative deepening: increase depth until time runs out
        while (Date.now() - startTime < timeLimitMs) {
            let currentBestMove = null;
            let currentBestScore = -Infinity;
            const isMaximizing = true;

            // Search at current depth
            for (const move of prioritizedMoves) {
                // Check if we're running out of time for this depth
                if (Date.now() - startTime >= timeLimitMs) {
                    break;
                }

                // Make the move
                this.board.push(move);

                // Evaluate the position after the move
                const score = this.minimax(currentDepth - 1, -Infinity, Infinity, !isMaximizing);

                // Undo the move
                this.board.pop();

                if (score > currentBestScore) {
                    currentBestScore = score;
                    currentBestMove = move;
                }
            }

            // If we completed this depth, update our best move
            if (currentBestMove && Date.now() - startTime < timeLimitMs) {
                bestMove = currentBestMove;
                bestScore = currentBestScore;
                console.log(`Depth ${currentDepth} completed, best move: ${bestMove}, score: ${bestScore}`);
            } else {
                // Time ran out, use the best from previous depth
                break;
            }

            currentDepth++;
        }

        console.log(`Time-based search completed at depth ${currentDepth - 1}, selected move: ${bestMove}, score: ${bestScore}`);

        return bestMove;
    }

    prioritizeMoves(moves) {
        // Sort moves to prioritize aggressive play: captures, checks, center moves
        return moves.sort((a, b) => {
            const scoreA = this.scoreMove(a);
            const scoreB = this.scoreMove(b);
            return scoreB - scoreA; // Higher scores first
        });
    }

    scoreMove(move) {
        let score = 0;

        // Check if it's a capture - highest priority
        if (this.board.isCapture(move)) {
            score += 20; // Massive priority for captures

            // Bonus for capturing with trebuchet
            const fen = this.board.fen();
            const pieces = fen.split(' ')[0];
            const ranks = pieces.split('/');
            const fromRank = parseInt(move[1]) - 1;
            const rankStr = ranks[9 - fromRank];

            let fileIndex = 0;
            let piece = null;
            for (const char of rankStr) {
                if (char >= '1' && char <= '9') {
                    fileIndex += parseInt(char);
                } else {
                    if (fileIndex === (move.charCodeAt(0) - 'a'.charCodeAt(0))) {
                        piece = char;
                        break;
                    }
                    fileIndex++;
                }
            }

            if (piece && piece.toLowerCase() === 't') {
                score += 15; // Trebuchet captures are devastating
            }
        }

        // Check if it puts opponent in check
        this.board.push(move);
        if (this.board.isCheck()) {
            score += 15; // Very high priority for checks
        }
        this.board.pop();

        // Prefer moves to center files (3-6 on 10x10 board)
        const toFile = move.charCodeAt(2) - 'a'.charCodeAt(0);
        if (toFile >= 3 && toFile <= 6) {
            score += 3;
        }

        // Prefer moves to enemy territory
        const toRank = parseInt(move[3]) - 1;
        if (toRank >= 6) score += 2; // Deep attacks
        else if (toRank >= 4) score += 1; // Forward moves

        // Prioritize trebuchet moves even if not capturing
        const fen = this.board.fen();
        const pieces = fen.split(' ')[0];
        const ranks = pieces.split('/');
        const fromRank = parseInt(move[1]) - 1;
        const rankStr = ranks[9 - fromRank];

        let fileIndex = 0;
        let piece = null;
        for (const char of rankStr) {
            if (char >= '1' && char <= '9') {
                fileIndex += parseInt(char);
            } else {
                if (fileIndex === (move.charCodeAt(0) - 'a'.charCodeAt(0))) {
                    piece = char;
                    break;
                }
                fileIndex++;
            }
        }

        if (piece && piece.toLowerCase() === 't') {
            score += 5; // Always prioritize trebuchet moves
        }

        // Queen moves are also important
        if (piece && piece.toLowerCase() === 'q') {
            score += 2;
        }

        return score;
    }

    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0 || this.board.isGameOver()) {
            return this.evaluatePosition();
        }

        const legalMoves = this.getLegalMoves();

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of legalMoves) {
                this.board.push(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, false);
                this.board.pop();
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of legalMoves) {
                this.board.push(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, true);
                this.board.pop();
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
            return minEval;
        }
    }

    evaluatePosition() {
        // Highly aggressive position evaluation for Metric Chess
        const fen = this.board.fen();
        const pieces = fen.split(' ')[0];

        // Base material values - trebuchets are devastating
        const pieceValues = {
            'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 't': -10, 'k': 0,  // Trebuchet worth MORE than queen
            'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'T': 10, 'K': 0
        };

        let score = 0;

        // Count pieces and add positional bonuses
        let whiteTrebuchets = 0, blackTrebuchets = 0;
        let whiteAttacking = 0, blackAttacking = 0;
        let whiteCenterControl = 0, blackCenterControl = 0;

        // Parse the board to analyze positions
        const ranks = pieces.split('/');
        for (let rank = 0; rank < 10; rank++) {
            const rankStr = ranks[rank];
            let file = 0;

            for (const char of rankStr) {
                if (char >= '1' && char <= '9') {
                    file += parseInt(char);
                } else {
                    // Piece found
                    if (pieceValues[char] !== undefined) {
                        score += pieceValues[char];

                        // Count trebuchets
                        if (char === 'T') whiteTrebuchets++;
                        if (char === 't') blackTrebuchets++;

                        // Center control bonus (files 3-6 are center on 10x10 board)
                        if (file >= 3 && file <= 6) {
                            if (char === char.toUpperCase() && char !== 'K') {
                                whiteCenterControl += 0.3;
                                whiteAttacking += 0.2; // Center pieces are attacking
                            } else if (char === char.toLowerCase() && char !== 'k') {
                                blackCenterControl -= 0.3;
                                blackAttacking -= 0.2;
                            }
                        }

                        // Attacking bonus for pieces in enemy territory
                        if (char === char.toUpperCase() && char !== 'K') {
                            if (rank >= 6) whiteAttacking += 0.5; // Deep in enemy territory
                            else if (rank >= 4) whiteAttacking += 0.2; // Approaching enemy
                        } else if (char === char.toLowerCase() && char !== 'k') {
                            if (rank <= 3) blackAttacking -= 0.5; // Deep in enemy territory
                            else if (rank <= 5) blackAttacking -= 0.2; // Approaching enemy
                        }

                        // Mobility bonus for active pieces in good positions
                        if (['Q', 'R', 'B', 'N', 'T'].includes(char.toUpperCase())) {
                            // Pieces in the center area get mobility bonus
                            if (rank >= 2 && rank <= 7 && file >= 2 && file <= 7) {
                                if (char === char.toUpperCase()) {
                                    whiteAttacking += 0.3;
                                } else {
                                    blackAttacking -= 0.3;
                                }
                            }
                        }
                    }
                    file++;
                }
            }
        }

        // Trebuchet dominance - they can jump over everything!
        if (whiteTrebuchets >= 2) score += 5; // Massive pair bonus
        if (blackTrebuchets >= 2) score -= 5;

        if (whiteTrebuchets === 1) score += 2; // Single trebuchet still powerful
        if (blackTrebuchets === 1) score -= 2;

        // Attacking and center control bonuses
        score += whiteAttacking - blackAttacking;
        score += (whiteCenterControl - blackCenterControl) * 2; // Double center importance

        // King safety - penalize exposed kings
        const whiteKingExposed = this.isKingExposed(true);
        const blackKingExposed = this.isKingExposed(false);
        if (whiteKingExposed) score -= 1;
        if (blackKingExposed) score += 1;

        // Initiative bonus - reward aggressive positioning
        score += (whiteAttacking - blackAttacking) * 0.5;

        // Small random element to avoid draws
        score += Math.random() * 0.05 - 0.025;

        return score;
    }

    isKingExposed(isWhite) {
        // Simple check if king is in danger zone
        const fen = this.board.fen();
        const pieces = fen.split(' ')[0];

        // Kings in center files are exposed
        if (isWhite) {
            return pieces.includes('K') && ['d', 'e', 'f'].some(file =>
                pieces.includes(`K${file}`) || pieces.includes(`${file}K`)
            );
        } else {
            return pieces.includes('k') && ['d', 'e', 'f'].some(file =>
                pieces.includes(`k${file}`) || pieces.includes(`${file}k`)
            );
        }
    }

    stop() {
        this.thinking = false;
    }

    quit() {
        if (this.board) {
            this.board.delete();
            this.board = null;
        }
    }
}

export default StockfishEngine;
