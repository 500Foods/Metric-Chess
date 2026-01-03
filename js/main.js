// Metric Chess - Main Application
import { ChessGame } from './chess.js';
import { ChessRenderer } from './render.js';
import { loadFontAwesomeConfig, getFAIconPrefix, getUIIcon } from './fontawesome-config.js';

// Main application class
class MetricChessApp {
    constructor() {
        this.initializeApp();
    }

    async initializeApp() {
        // Load Font Awesome config first
        await loadFontAwesomeConfig();

        // Update static HTML icons to use the configured style
        this.updateStaticIcons();

        this.game = new ChessGame();
        this.renderer = new ChessRenderer();
        this.selectedPiece = null;
        this.availableMoves = [];
        this.audioEnabled = true;
        this.lastMovedPiece = null;

        // Set default game mode: human vs AI with white at bottom
        this.game.bottomPlayerType = 'human';
        this.game.topPlayerType = 'ai';
        this.game.whitePosition = 'bottom';

        // Set up event listeners for modals
        this.setupModalEventListeners();

        // Initialize the board first
        this.initialize();

        // Then show welcome modal
        this.showWelcomeModal();
    }

    initialize() {
        // Set up the chess board
        this.renderer.initializeBoard();

        // Render initial game state
        this.renderer.renderBoard(this.game);

        // Set up event listeners
        this.setupEventListeners();

        // Update game status
        this.updateGameStatus();

        // Update button states
        this.updateButtonStates();

        // Check if AI should make the first move (black AI in default setup)
        this.checkForAIMove();

        // Initialize fancy tooltips
        this.initializeTooltips();
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
            this.lastMovedPiece = null;
            this.renderer.lastMovedPiece = null;
            this.renderer.renderBoard(this.game);
            this.updateGameStatus();
            this.clearHighlights();
            this.updateMoveHistory();
            this.updateButtonStates();
        });
        
        // Undo move button
        document.getElementById('undoMove').addEventListener('click', () => {
            const undoneMove = this.game.gameHistory[this.game.gameHistory.length - 1]; // Get the move before undoing
            this.game.undoMove();
            if (undoneMove) {
                const screenCoords = this.transformBoardToScreenCoords(undoneMove.fromFile, undoneMove.fromRank);
                this.lastMovedPiece = { file: screenCoords.screenFile, rank: screenCoords.screenRank };
            } else {
                this.lastMovedPiece = null;
            }
            this.renderer.lastMovedPiece = this.lastMovedPiece;
            this.renderer.renderBoard(this.game);
            this.updateGameStatus();
            this.clearHighlights();
            this.updateMoveHistory();
            this.updateButtonStates();
        });

        // Redo move button
        document.getElementById('redoMove').addEventListener('click', () => {
            const redoneMove = this.game.redoStack[this.game.redoStack.length - 1]; // Get the move before redoing
            this.game.redoMove();
            if (redoneMove) {
                const screenCoords = this.transformBoardToScreenCoords(redoneMove.toFile, redoneMove.toRank);
                this.lastMovedPiece = { file: screenCoords.screenFile, rank: screenCoords.screenRank };
            } else {
                this.lastMovedPiece = null;
            }
            this.renderer.lastMovedPiece = this.lastMovedPiece;
            this.renderer.renderBoard(this.game);
            this.updateGameStatus();
            this.clearHighlights();
            this.updateMoveHistory();
            this.updateButtonStates();
        });
        
        // New game button
        document.getElementById('newGame').addEventListener('click', () => {
            this.showGameSetupModal();
        });
        
        // Orientation rotation buttons
        document.getElementById('rotateLeft').addEventListener('click', () => {
            this.rotateOrientation('left');
        });

        document.getElementById('rotateRight').addEventListener('click', () => {
            this.rotateOrientation('right');
        });


        // Resign game button
        document.getElementById('resignGame').addEventListener('click', () => {
            this.resignGame();
        });

        // Toggle audio button
        document.getElementById('toggleAudio').addEventListener('click', () => {
            this.toggleAudio();
        });
        
        // Game setup modal buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('cancelGame').addEventListener('click', () => {
            this.hideGameSetupModal();
        });

        // Promotion modal buttons
        document.querySelectorAll('.promotion-piece').forEach(button => {
            button.addEventListener('click', (e) => {
                const pieceType = e.currentTarget.dataset.piece;
                this.completePromotion(pieceType);
            });
        });
    }

    setupModalEventListeners() {
        // Welcome modal start game button
        document.getElementById('startWelcomeGame').addEventListener('click', () => {
            this.hideWelcomeModal();
            this.showGameSetupModal();
            // Board is already initialized, just show setup
        });
    }

    async makeMove(fromFile, fromRank, toFile, toRank, player, promotionPiece = null) {
        this.game.movePiece(fromFile, fromRank, toFile, toRank, promotionPiece);
        const screenCoords = this.transformBoardToScreenCoords(toFile, toRank);
        this.lastMovedPiece = { file: screenCoords.screenFile, rank: screenCoords.screenRank };
        await this.playMoveSound(player);
        this.renderer.lastMovedPiece = this.lastMovedPiece;
        this.renderer.renderBoard(this.game);
        this.updateGameStatus();
        this.clearHighlights();
        this.updateMoveHistory();
        this.updateButtonStates();

        // Check if AI should move next
        this.checkForAIMove();
    }

    async handleCellClick(file, rank) {
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
                // Check if this is a pawn promotion move
                const piece = this.selectedPiece.piece;
                const isPromotion = piece.type === 'pawn' &&
                    ((piece.color === 'white' && boardRank === 9) ||
                     (piece.color === 'black' && boardRank === 0));

                if (isPromotion) {
                    // Store the move details for later completion
                    this.pendingPromotion = {
                        fromFile: this.selectedPiece.file,
                        fromRank: this.selectedPiece.rank,
                        toFile: boardFile,
                        toRank: boardRank,
                        player: this.game.currentPlayer
                    };
                    this.showPromotionModal();
                } else {
                    // Make the move normally
                    await this.makeMove(this.selectedPiece.file, this.selectedPiece.rank, boardFile, boardRank, this.game.currentPlayer);
                }

                // Clear selection after move
                this.selectedPiece = null;
                this.availableMoves = [];
                return;
            }
        }
         
        // If we clicked on a piece of the current player's color
        if (piece && piece.color === this.game.currentPlayer) {
            // Check if it's already selected
            if (this.selectedPiece && this.selectedPiece.file === boardFile && this.selectedPiece.rank === boardRank) {
                // Deselect
                this.clearHighlights();
                this.selectedPiece = null;
                this.availableMoves = [];
            } else {
                // Calculate available moves using board coordinates
                this.availableMoves = this.game.getAvailableMoves(boardFile, boardRank);

                // Highlight the selected piece and available moves (using screen coordinates)
                this.renderer.highlightPiece(file, rank, 'selected-piece');
                this.renderer.highlightMoves(this.availableMoves, this.game.whitePosition);

                // Store the selected piece with board coordinates
                this.selectedPiece = { file: boardFile, rank: boardRank, piece };
            }
        } else {
            // Clear selection if clicking on empty cell or opponent's piece
            this.clearHighlights();
            this.selectedPiece = null;
            this.availableMoves = [];
        }
    }

    transformScreenToBoardCoords(screenFile, screenRank) {
        const whitePosition = this.game.whitePosition || 'bottom';
        
        // Create a 12x12 grid to map the screen coordinates using the same approach
        const grid = Array(12).fill().map(() => Array(12).fill(null));
        
        // Mark the screen position in the grid (12x12 coordinates)
        const screenX = screenFile + 1; // Convert to 12x12 coordinates (1-10)
        const screenY = 10 - screenRank; // Invert to match display grid
        grid[screenY][screenX] = { file: screenFile, rank: screenRank };
        
        // Map orientation to rotation degrees
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise
        };

        const appliedDegrees = orientationToDegrees[whitePosition] || 0;
        const reverseDegrees = (360 - appliedDegrees) % 360;

        // Apply reverse rotation to get back to original orientation
        const rotatedGrid = this.game.rotateGrid(grid, reverseDegrees);
        
        // Find the board coordinates in the rotated grid
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const cell = rotatedGrid[y][x];
                if (cell && x >= 1 && x <= 10 && y >= 1 && y <= 10) {
                    // Convert 12x12 display coordinates back to board coordinates
                    const boardRank = 10 - y; // y=1 -> rank=9, y=10 -> rank=0
                    const boardFile = x - 1; // x=1 -> file=0, x=10 -> file=9

                    return { boardFile: boardFile, boardRank: boardRank };
                }
            }
        }
        
        // Fallback to original coordinates if not found
        return { boardFile: screenFile, boardRank: screenRank };
    }
    
    transformBoardToScreenCoords(boardFile, boardRank) {
        const whitePosition = this.game.whitePosition || 'bottom';
        
        // Create a 12x12 grid to map the board coordinates using the same approach
        const grid = Array(12).fill().map(() => Array(12).fill(null));
        
        // Convert board coordinates to display coordinates in 12x12 grid
        const displayRank = 10 - boardRank; // board rank 0 -> display rank 10
        const displayFile = boardFile + 1; // board file 0 -> display file 1
        grid[displayRank][displayFile] = { file: boardFile, rank: boardRank };
        
        // Map orientation to rotation degrees
        const orientationToDegrees = {
            'bottom': 0,    // 0° rotation
            'left': 90,     // 90° clockwise
            'top': 180,     // 180°
            'right': 270    // 270° clockwise
        };
        
        const degrees = orientationToDegrees[whitePosition] || 0;
        
        // Apply rotation
        const rotatedGrid = this.game.rotateGrid(grid, degrees);
        
        // Find the screen coordinates in the rotated grid
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
                const cell = rotatedGrid[y][x];
                if (cell && x >= 1 && x <= 10 && y >= 1 && y <= 10) {
                    // Convert 12x12 screen coordinates to 10x10 screen coordinates
                    const screenFile = x - 1;
                    const screenRank = 10 - y; // y=10 -> rank=0, y=1 -> rank=9

                    return { screenFile, screenRank };
                }
            }
        }
        
        // Fallback to original coordinates if not found
        return { screenFile: boardFile, screenRank: boardRank };
    }
    
    clearHighlights() {
        this.renderer.clearHighlights();
    }

    updateMoveHistory() {
        const moveListElement = document.getElementById('moveList');
        moveListElement.innerHTML = '';

        // Group moves by move number (pairs of white/black)
        const movesByNumber = {};
        this.game.moveNotation.forEach(move => {
            if (!movesByNumber[move.moveNumber]) {
                movesByNumber[move.moveNumber] = {};
            }
            movesByNumber[move.moveNumber][move.player] = move.notation;
        });

        // Display each move pair
        Object.keys(movesByNumber).forEach(moveNumber => {
            const moveData = movesByNumber[moveNumber];
            const moveElement = document.createElement('div');
            moveElement.className = 'move-item';

            const moveNumberSpan = document.createElement('span');
            moveNumberSpan.className = 'move-number';
            moveNumberSpan.textContent = moveNumber + '.';

            const whiteSpan = document.createElement('span');
            whiteSpan.className = 'move-notation white';
            whiteSpan.textContent = moveData.white || '';

            const blackSpan = document.createElement('span');
            blackSpan.className = 'move-notation black';
            blackSpan.textContent = moveData.black || '';

            moveElement.appendChild(moveNumberSpan);
            moveElement.appendChild(whiteSpan);
            moveElement.appendChild(blackSpan);
            moveListElement.appendChild(moveElement);
        });
    }

    updateButtonStates() {
        const undoButton = document.getElementById('undoMove');
        const redoButton = document.getElementById('redoMove');

        undoButton.disabled = this.game.gameHistory.length === 0;
        redoButton.disabled = this.game.redoStack.length === 0;
    }

    updateGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        statusElement.textContent = `${this.game.currentPlayer.charAt(0).toUpperCase() + this.game.currentPlayer.slice(1)}'s turn`;

        if (this.game.isCheck()) {
            statusElement.textContent += ' - CHECK!';
        }

        if (this.game.isCheckmate()) {
            statusElement.textContent = `CHECKMATE! ${this.game.currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
        } else if (this.game.isStalemate()) {
            statusElement.textContent = 'STALEMATE! It\'s a draw!';
        }
    }

    resignGame() {
        // Resign the current player
        const winner = this.game.currentPlayer === 'white' ? 'Black' : 'White';
        alert(`${this.game.currentPlayer.charAt(0).toUpperCase() + this.game.currentPlayer.slice(1)} resigns! ${winner} wins!`);
        // Reset or start new game
        this.game.reset();
        this.renderer.renderBoard(this.game);
        this.clearHighlights();
        this.updateMoveHistory();
        this.updateButtonStates();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        const button = document.getElementById('toggleAudio');
        const icon = button.querySelector('i');
        const prefix = getFAIconPrefix();
        if (this.audioEnabled) {
            icon.className = `${prefix} fa-volume-up`;
        } else {
            icon.className = `${prefix} fa-volume-mute`;
        }
        console.log(`Audio ${this.audioEnabled ? 'enabled' : 'disabled'}`);
    }

    async playMoveSound(player) {
        if (!this.audioEnabled) return;

        // Create different sounds for white and black moves
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume audio context if suspended (required for autoplay policies)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (player === 'white') {
            // Higher pitch for white
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1);
        } else {
            // Lower pitch for black
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
        }

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    showGameSetupModal() {
        const modal = document.getElementById('gameSetupModal');
        modal.style.display = 'flex';
    }

    hideGameSetupModal() {
        const modal = document.getElementById('gameSetupModal');
        modal.style.display = 'none';
    }

    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        modal.style.display = 'flex';
    }

    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        modal.style.display = 'none';
    }

    showPromotionModal() {
        const modal = document.getElementById('promotionModal');
        const heirButton = modal.querySelector('[data-piece="heir"]');

        // Check if promotion square is adjacent to any king
        const { toFile, toRank } = this.pendingPromotion;
        const isAdjacent = this.game.isAdjacentToAnyKing(toFile, toRank);

        // Hide heir button if adjacent to enemy king
        heirButton.style.display = isAdjacent ? 'none' : 'flex';

        modal.style.display = 'flex';
    }

    hidePromotionModal() {
        const modal = document.getElementById('promotionModal');
        modal.style.display = 'none';
    }

    async completePromotion(pieceType) {
        if (!this.pendingPromotion) return;

        const { fromFile, fromRank, toFile, toRank, player } = this.pendingPromotion;
        await this.makeMove(fromFile, fromRank, toFile, toRank, player, pieceType);
        this.hidePromotionModal();
        this.pendingPromotion = null;
    }

    startNewGame() {
        const boardOrientation = document.getElementById('boardOrientation').value;
        const gameMode = document.getElementById('gameMode').value;
        const aiTimeLimit = parseInt(document.getElementById('aiDifficulty').value);

        // Reset the game completely
        this.game.reset();

        // Set up board orientation based on selection
        this.game.whitePosition = boardOrientation.replace('white-', '');

        // Parse game mode to determine AI players
        const [bottomPlayer, topPlayer] = gameMode.split('-');
        this.game.bottomPlayerType = bottomPlayer;
        this.game.topPlayerType = topPlayer;

        // Set AI time limit
        this.game.aiTimeLimit = aiTimeLimit;

        // Set current player (always white goes first)
        this.game.currentPlayer = 'white';

        this.lastMovedPiece = null;
        this.renderer.lastMovedPiece = null;

        // Re-render with new orientation
        this.renderer.renderBoard(this.game);
        this.updateGameStatus();
        this.clearHighlights();
        this.updateMoveHistory();
        this.updateButtonStates();

        this.hideGameSetupModal();

        console.log(`Starting new game: ${gameMode} with ${boardOrientation}`);
        console.log(`White position: ${this.game.whitePosition}`);
        console.log(`Bottom: ${bottomPlayer}, Top: ${topPlayer}`);

        // Check if AI needs to make a move
        this.checkForAIMove();
    }

    // Show/hide AI thinking spinners
    showAIThinking(player) {
        const spinnerId = player === 'white' ? 'whiteSpinner' : 'blackSpinner';
        const spinner = document.getElementById(spinnerId);
        spinner.classList.add('active');
        // Add fa-spin to the icon (handle both <i> and <svg>)
        const icon = spinner.querySelector('i') || spinner.querySelector('svg');
        if (icon) icon.classList.add('fa-spin');
    }

    hideAIThinking(player) {
        const spinnerId = player === 'white' ? 'whiteSpinner' : 'blackSpinner';
        const spinner = document.getElementById(spinnerId);
        spinner.classList.remove('active');
        // Remove fa-spin from the icon (handle both <i> and <svg>)
        const icon = spinner.querySelector('i') || spinner.querySelector('svg');
        if (icon) icon.classList.remove('fa-spin');
    }
    
    checkForAIMove() {
        // Check if game is over
        if (this.game.isCheckmate() || this.game.isStalemate()) {
            console.log('Game is over, no AI move');
            return;
        }

        // Check if it's AI's turn
        const currentPlayer = this.game.currentPlayer;
        // Fix: Determine player type based on board position and colors
        // If white is at bottom, then: white = bottomPlayer, black = topPlayer
        // If white is at top, then: white = topPlayer, black = bottomPlayer
        let playerType;
        if (this.game.whitePosition === 'bottom' || this.game.whitePosition === 'right') {
            // White at bottom/right
            playerType = currentPlayer === 'white' ? this.game.bottomPlayerType : this.game.topPlayerType;
        } else {
            // White at top/left
            playerType = currentPlayer === 'white' ? this.game.topPlayerType : this.game.bottomPlayerType;
        }

        console.log(`Check AI move: currentPlayer=${currentPlayer}, playerType=${playerType}, whitePosition=${this.game.whitePosition}, bottomPlayer=${this.game.bottomPlayerType}, topPlayer=${this.game.topPlayerType}`);

        if (playerType === 'ai') {
            // Show AI thinking spinner
            this.showAIThinking(currentPlayer);
            
            // Make the AI move
            setTimeout(() => {
                this.makeSimpleAIMove();
            }, 500); // Small delay for UI feedback
        }
    }
    
    async makeSimpleAIMove() {
        const currentPlayer = this.game.currentPlayer;

        // Use fairy-stockfish AI
        this.game.getAIMove(async (move) => {
            // Hide AI thinking spinner
            this.hideAIThinking(currentPlayer);

            // For AI, default to queen promotion
            const result = this.game.movePiece(
                move.fromFile,
                move.fromRank,
                move.toFile,
                move.toRank,
                'queen'
            );

            if (result) {
                const screenCoords = this.transformBoardToScreenCoords(move.toFile, move.toRank);
                this.lastMovedPiece = { file: screenCoords.screenFile, rank: screenCoords.screenRank };
                await this.playMoveSound(currentPlayer);
                this.renderer.lastMovedPiece = this.lastMovedPiece;
                this.renderer.renderBoard(this.game);
                this.updateGameStatus();
                this.clearHighlights();
                this.updateMoveHistory();
                this.updateButtonStates();

                // Check if the next player is also AI
                this.checkForAIMove();
            } else {
                console.error('AI move failed:', move);
                // Fallback to random move if AI fails
                await this.fallbackRandomMove();
            }
        });
    }

    async fallbackRandomMove() {
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
            const movingPlayer = this.game.currentPlayer;
            // For AI fallback, default to queen promotion
            const result = this.game.movePiece(
                randomMove.from.file,
                randomMove.from.rank,
                randomMove.to.file,
                randomMove.to.rank,
                'queen'
            );

            if (result) {
                const screenCoords = this.transformBoardToScreenCoords(randomMove.to.file, randomMove.to.rank);
                this.lastMovedPiece = { file: screenCoords.screenFile, rank: screenCoords.screenRank };
                await this.playMoveSound(movingPlayer);
                this.renderer.lastMovedPiece = this.lastMovedPiece;
                this.renderer.renderBoard(this.game);
                this.updateGameStatus();
                this.clearHighlights();
                this.updateMoveHistory();
                this.updateButtonStates();

                // Check if the next player is also AI
                this.checkForAIMove();
            }
        }
    }

    // Orientation rotation methods
    rotateOrientation(direction) {
        const orientations = ['bottom', 'left', 'top', 'right'];
        const currentIndex = orientations.indexOf(this.game.whitePosition);
        let nextIndex;

        if (direction === 'left') {
            // Rotate clockwise (left arrow) - white moves: bottom → left → top → right
            nextIndex = (currentIndex + 1) % orientations.length;
        } else {
            // Rotate counter-clockwise (right arrow) - white moves: bottom → right → top → left
            nextIndex = (currentIndex - 1 + orientations.length) % orientations.length;
        }

        this.game.whitePosition = orientations[nextIndex];

        // Re-render with new orientation
        this.renderer.renderBoard(this.game);

        console.log(`Orientation changed to: ${this.game.whitePosition}`);
    }

    updateStaticIcons() {
        // Update all static HTML icons to use the configured Font Awesome style
        const prefixClasses = getFAIconPrefix().split(' ').filter(cls => cls);
        const prefixString = prefixClasses.join(' ');
        
        console.log('Updating static icons with prefix:', prefixString);
        
        // Update UI icons based on config overrides
        document.querySelectorAll('i[data-icon]').forEach(icon => {
            const key = icon.dataset.icon;
            const newIcon = getUIIcon(key);
            
            // Remove all existing Font Awesome style/prefix classes
            icon.classList.remove('fa-solid', 'fa-duotone', 'fa-sharp', 'fa-sharp-duotone', 'fa-regular', 'fa-light', 'fa-thin');
            
            // Add the new style prefix classes
            prefixClasses.forEach(cls => icon.classList.add(cls));
            
            if (newIcon) {
                // Remove any existing icon class (starts with fa-)
                const classes = Array.from(icon.classList);
                classes.forEach(cls => {
                    if (cls.startsWith('fa-') && !cls.match(/^fa-(solid|duotone|sharp|sharp-duotone|regular|light|thin)$/)) {
                        icon.classList.remove(cls);
                    }
                });
                
                // Add the new icon class
                icon.classList.add(newIcon);
            }
        });
    }

    initializeTooltips() {
        // Initialize Floating UI tooltips for all elements with title attribute
        const { computePosition, flip, shift, offset, arrow, autoUpdate } = FloatingUIDOM;

        const elements = document.querySelectorAll('[title]');
        elements.forEach(el => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = el.title;
            el.title = ''; // Remove default title
            document.body.appendChild(tooltip);

            const arrowElement = document.createElement('div');
            arrowElement.className = 'tooltip-arrow';
            tooltip.appendChild(arrowElement);

            let cleanup;

            function update() {
                computePosition(el, tooltip, {
                    placement: 'top',
                    middleware: [
                        offset(8),
                        flip(),
                        shift({ padding: 5 })
                    ]
                }).then(({ x, y, placement }) => {
                    Object.assign(tooltip.style, {
                        left: `${x}px`,
                        top: `${y}px`,
                    });
                });
            }

            function show() {
                tooltip.style.display = 'block';
                update();
                cleanup = autoUpdate(el, tooltip, update);
            }

            function hide() {
                tooltip.style.display = 'none';
                cleanup?.();
            }

            el.addEventListener('mouseenter', show);
            el.addEventListener('mouseleave', hide);
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MetricChessApp();
});