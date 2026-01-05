# User Interface Architecture

## Overview

Metric Chess implements a responsive, accessible web interface that supports multiple game modes, board orientations, and progressive enhancement. The UI is built with vanilla JavaScript and CSS Grid, providing a native app-like experience across devices.

## Core Components

### 1. Main Application Structure (`index.html`)

The HTML structure provides semantic layout with progressive enhancement:

```html
<div class="app-container">
    <div class="board-container">
        <!-- Coordinate labels -->
        <div class="file-labels top coordinate-labels">...</div>
        <div class="rank-labels left coordinate-labels">...</div>
        <div class="chess-board" id="chessBoard"></div>
        <div class="rank-labels right coordinate-labels">...</div>
        <div class="file-labels bottom coordinate-labels">...</div>
    </div>

    <div class="game-controls">
        <!-- AI thinking indicators -->
        <div class="ai-spinner white-thinking" id="whiteSpinner">...</div>

        <!-- Game control buttons -->
        <button id="newGame">New Game</button>
        <button id="resetGame">Reset</button>
        <button id="undoMove">Undo</button>
        <button id="redoMove">Redo</button>

        <!-- Game status display -->
        <div class="game-status" id="gameStatus">White's turn</div>

        <!-- Additional controls -->
        <button id="resignGame">Resign</button>
        <button id="rotateLeft">Rotate Left</button>
        <button id="rotateRight">Rotate Right</button>
        <button id="toggleAudio">Toggle Audio</button>

        <div class="ai-spinner black-thinking" id="blackSpinner">...</div>
    </div>

    <!-- Move history panel -->
    <div class="move-history" id="moveHistory">...</div>
</div>
```

### 2. Modal System

Three modal types handle different user interactions:

#### Welcome Modal

- **Purpose**: First-time user introduction and feature overview
- **Content**: Game features, setup instructions
- **Triggers**: Automatic on first load, dismissible

#### Game Setup Modal

- **Purpose**: Configure new game parameters
- **Options**:
  - Board orientation (bottom/left/top/right)
  - Game mode (human vs human/AI, AI vs AI)
  - AI difficulty (1-20 seconds thinking time)

#### Promotion Modal

- **Purpose**: Handle pawn promotion choices
- **Options**: Queen, Rook, Bishop, Knight, Trebuchet, Heir King
- **Logic**: Hides Heir King option when adjacent to enemy king

#### Customization Modal

- **Purpose**: Allow users to customize the board layout by placing, moving, or removing pieces
- **Activation**: Triggered by clicking the "Customize board" button (screwdriver-wrench icon)
- **Key Features**:
  - **Piece Placement**: Add any piece (pawn, knight, bishop, rook, trebuchet, queen, king) to any square
  - **Piece Movement**: Move pieces between squares using drag-and-drop interaction
  - **Square Clearing**: Remove pieces from individual squares
  - **Bulk Operations**: Clear entire ranks, files, or the entire board
  - **Board Operations**: Mirror board layout, reset to default setup
  - **Undo/Redo**: Full history tracking with undo functionality
  - **Color Selection**: Choose between light (white) and dark (black) pieces

- **UI Components**:
  - **Function Buttons**: Undo, Clear Square, Clear Rank, Clear File, Clear Board, Mirror Board, Reset Board
  - **Piece Palette**: Two rows of piece buttons (light pieces on top, dark pieces on bottom)
  - **Visual Feedback**: Highlighted target square during customization

- **Implementation Details**:
  - **State Management**: Uses `customizationMode` flag and `customizationTarget` object
  - **History Tracking**: Maintains `customizationHistory` array for undo functionality
  - **Event Handling**: Special click handling when in customization mode
  - **Modal Interaction**: Modal appears when a target square is selected

- **Code Structure**:

  ```javascript
  // Main customization methods in MetricChessApp class
  toggleCustomizationMode() { /* Toggle mode and update UI */ }
  handleCustomizationClick(file, rank) { /* Handle piece placement/movement */ }
  placeCustomPiece(boardFile, boardRank, piece) { /* Place piece on board */ }
  clearRank(rank) { /* Clear all pieces in a rank */ }
  clearFile(file) { /* Clear all pieces in a file */ }
  clearBoard() { /* Clear entire board */ }
  mirrorBoard() { /* Mirror board layout horizontally */ }
  resetBoard() { /* Reset to default starting position */ }
  undoCustomization() { /* Revert to previous board state */ }
  ```

- **HTML Structure**:

  ```html
  <div class="modal" id="customizationModal">
      <div class="modal-content customization-content">
          <div class="customization-options">
              <!-- Function buttons -->
              <div class="function-buttons">
                  <button id="undoCustom"><i class="fa-solid fa-rotate-left"></i></button>
                  <button id="clearSquare"><i class="fa-solid fa-trash"></i></button>
                  <!-- More function buttons... -->
              </div>
              
              <!-- Light pieces -->
              <div class="piece-row light-pieces">
                  <button class="piece-btn" data-piece="pawn" data-color="white">
                      <i class="fa-sharp-duotone fa-solid fa-chess-pawn chess-piece white"></i>
                  </button>
                  <!-- More light pieces... -->
              </div>
              
              <!-- Dark pieces -->
              <div class="piece-row dark-pieces">
                  <button class="piece-btn" data-piece="pawn" data-color="black">
                      <i class="fa-sharp-duotone fa-solid fa-chess-pawn chess-piece black"></i>
                  </button>
                  <!-- More dark pieces... -->
              </div>
          </div>
      </div>
  </div>
  ```

- **Usage Workflow**:
  1. User clicks "Customize board" button to enter customization mode
  2. User clicks on target square to select it (highlighted in orange)
  3. Customization modal appears with piece selection options
  4. User selects a piece to place or uses function buttons for operations
  5. Changes are immediately reflected on the board
  6. User can undo changes or exit customization mode when done

- **Visual Indicators**:
  - Customization mode active: Button turns orange (`customization-active` class)
  - Target square: Highlighted with semi-transparent orange overlay
  - Piece buttons: Show actual chess piece icons with color coding

## Rendering System (`js/render.js`)

### ChessRenderer Class

The rendering system uses a 12x12 grid transformation approach to handle board rotations consistently:

```javascript
export class ChessRenderer {
    constructor() {
        this.boardElement = document.getElementById('chessBoard');
        this.chessGame = new ChessGame(); // For rotation methods
        this.lastMovedPiece = null;
    }
}
```

### Board Coordinate System

#### Internal vs Display Coordinates

- **Board Coordinates**: `board[rank][file]` where rank 0-9 (bottom to top), file 0-9 (left to right)
- **Display Coordinates**: HTML data attributes `data-coord="${file}${rank}"` where rank 0-9 (top to bottom)
- **12x12 Grid**: Intermediate representation for rotation calculations

#### Rotation Logic

```javascript
// Map orientation to rotation degrees
const orientationToDegrees = {
    'bottom': 0,    // White at bottom
    'left': 90,     // White at left
    'top': 180,     // White at top
    'right': 270    // White at right
};
```

### Piece Rendering

Pieces are rendered as Font Awesome icons with dynamic styling:

```javascript
renderPiece(file, rank, piece) {
    const pieceElement = document.createElement('i');
    pieceElement.className = `${getFAIconPrefix()} ${this.getPieceIcon(piece.type)} chess-piece ${piece.color}`;

    // Add last-moved indicator
    if (this.lastMovedPiece && this.lastMovedPiece.file === file && this.lastMovedPiece.rank === rank) {
        pieceElement.classList.add('last-moved');
    }

    cell.appendChild(pieceElement);
}
```

## Game State Management (`js/main.js`)

### MetricChessApp Class

The main application controller handles user interactions and game flow:

```javascript
class MetricChessApp {
    constructor() {
        this.game = new ChessGame();
        this.renderer = new ChessRenderer();
        this.selectedPiece = null;
        this.availableMoves = [];
        this.initializeApp();
    }
}
```

### Event Handling

#### Board Interactions

```javascript
handleCellClick(file, rank) {
    // Transform screen coordinates to board coordinates
    const { boardFile, boardRank } = this.transformScreenToBoardCoords(file, rank);

    const piece = this.game.board[boardRank][boardFile];

    if (piece && piece.color === this.game.currentPlayer) {
        // Select piece and show moves
        this.selectedPiece = { file: boardFile, rank: boardRank, piece };
        this.availableMoves = this.game.getAvailableMoves(boardFile, boardRank);
        this.renderer.highlightPiece(file, rank, 'selected-piece');
        this.renderer.highlightMoves(this.availableMoves, this.game.whitePosition);
    }
}
```

#### Coordinate Transformations

The app handles complex coordinate transformations for board rotations:

```javascript
transformScreenToBoardCoords(screenFile, screenRank) {
    // Create 12x12 grid for rotation calculations
    const grid = Array(12).fill().map(() => Array(12).fill(null));

    // Apply reverse rotation to map back to board coordinates
    const reverseDegrees = (360 - appliedDegrees) % 360;
    const rotatedGrid = this.game.rotateGrid(grid, reverseDegrees);

    // Extract board coordinates
    return { boardFile, boardRank };
}
```

## UI State Management

### Game Status Updates

```javascript
updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');

    if (this.game.isCheckmate()) {
        statusElement.textContent = `CHECKMATE! ${this.game.currentPlayer === 'white' ? 'Dark' : 'Light'} wins!`;
    } else if (this.game.isCheck()) {
        statusElement.textContent = `${currentPlayerColor} is in CHECK!`;
    } else {
        statusElement.textContent = `Waiting for ${currentPlayerColor} to play`;
    }
}
```

### Button State Management

```javascript
updateButtonStates() {
    const undoButton = document.getElementById('undoMove');
    const redoButton = document.getElementById('redoMove');

    undoButton.disabled = this.game.gameHistory.length === 0;
    redoButton.disabled = this.game.redoStack.length === 0;
}
```

## Move History Display

### History Panel Structure

```html
<div class="move-history" id="moveHistory">
    <h3>Move History</h3>
    <div class="move-list" id="moveList"></div>
</div>
```

### History Updates

```javascript
updateMoveHistory() {
    const moveListElement = document.getElementById('moveList');
    moveListElement.innerHTML = '';

    // Group moves by move number (white/black pairs)
    const movesByNumber = {};
    this.game.moveNotation.forEach(move => {
        if (!movesByNumber[move.moveNumber]) {
            movesByNumber[move.moveNumber] = {};
        }
        movesByNumber[move.moveNumber][move.player] = move.notation;
    });

    // Render each move pair
    Object.keys(movesByNumber).forEach(moveNumber => {
        const moveElement = document.createElement('div');
        moveElement.className = 'move-item';
        // Add move number, white move, black move
    });
}
```

## Audio System

### Move Sound Effects

```javascript
async playMoveSound(player) {
    if (!this.audioEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Resume context (required for autoplay policies)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    // Generate different tones for white/black moves
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    if (player === 'white') {
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    } else {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    }

    // Apply envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}
```

## Accessibility Features

### Keyboard Navigation

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Proper focus indicators and logical tab order
- **Screen Reader Support**: Semantic HTML and ARIA labels

### Visual Feedback

- **High Contrast**: Chess board uses distinct light/dark squares
- **Color Independence**: Icons and text don't rely solely on color
- **Animation Reduction**: Respects `prefers-reduced-motion`

## Responsive Design

### CSS Grid Layout

```css
.app-container {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 1fr;
    gap: 1rem;
}

.board-container {
    grid-column: 1;
    grid-row: 1 / -1;
}

.game-controls {
    grid-column: 2;
    grid-row: 1;
}

.move-history {
    grid-column: 2;
    grid-row: 2;
}
```

### Mobile Optimizations

- **Touch Targets**: Minimum 44px touch targets
- **Viewport Units**: Board scales with `min(90vh, 90vw)`
- **Orientation Support**: Works in both portrait and landscape

## Progressive Enhancement

### Feature Detection

```javascript
// Web Workers support
if (window.Worker) {
    // Use advanced AI
} else {
    // Fallback to basic AI
}

// Audio API support
if (window.AudioContext || window.webkitAudioContext) {
    // Enable sound effects
}
```

### Graceful Degradation

- **No JavaScript**: Basic HTML fallback (not implemented)
- **No Web Workers**: Falls back to main-thread AI
- **No Audio API**: Silent operation
- **No Service Worker**: Functions as regular web app

## Performance Optimizations

### Rendering Efficiency

- **Minimal DOM Updates**: Only update changed elements
- **Efficient Selectors**: Use `data-coord` attributes for O(1) lookups
- **Batched Updates**: Group DOM changes to minimize reflows

### Memory Management

- **Object Reuse**: Reuse DOM elements when possible
- **Event Cleanup**: Remove event listeners on component destruction
- **Grid Recycling**: Reuse 12x12 grid objects for transformations

## Tooltips and Help System

### Floating UI Integration

```javascript
initializeTooltips() {
    const { computePosition, flip, shift, offset } = FloatingUIDOM;

    document.querySelectorAll('[title]').forEach(el => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';

        // Position tooltip relative to element
        computePosition(el, tooltip, {
            placement: 'top',
            middleware: [offset(8), flip(), shift({ padding: 5 })]
        });
    });
}
```

### Delayed Display

```javascript
let showTimeout;

function show() {
    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
        tooltip.classList.add('show');
    }, 1500); // 1.5 second delay
}
```

This UI architecture provides a robust, accessible, and performant chess interface that works across devices and degrades gracefully when features aren't available.
