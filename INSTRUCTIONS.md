# Metric Chess - Developer Instructions

## 📋 Project Overview

**Metric Chess** is a 10x10 chess variant with unique pieces including trebuchets (catapults) and special movement rules. This document provides essential information for developers continuing work on this project.

## 🔧 Build System

### Development Workflow

```bash
# Install dependencies
npm install

# Start development server with hot reloading
npm run dev

# Create production build
npm run build:prod

# Preview production build
npm run preview

# Serve production build
npm run serve
```

### Vite Configuration

The project uses **Vite** as the build system with the following configuration:

- **Entry Point**: `index.html`
- **Output Directory**: `dist/`
- **Asset Hashing**: Enabled for cache busting
- **Development Server**: Port 3000 with auto-reload
- **Production Build**: Minified JS/CSS with proper chunking

### Project Structure

```structure
metric-chess/
├── dist/                  # Production build output
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   ├── main.js            # Main application logic
│   ├── chess.js           # Game logic and rules
│   └── render.js          # Rendering logic
├── index.html             # Main HTML file
├── package.json           # Project configuration
├── vite.config.js         # Vite build configuration
├── INSTRUCTIONS.md        # This file
└── README.md              # Game rules and overview
```

## 🎨 Design Choices & Consistency Guidelines

### CSS & Styling

- **Color Scheme**: Warm wood tones for chess board (#f0d9b5 light, #b58863 dark)
- **Typography**: Arial font family throughout
- **Spacing**: Consistent use of CSS Grid for board layout
- **Z-Index**: Coordinate labels use z-index 100 to ensure visibility
- **Responsive**: Board maintains square aspect ratio with `min(90vh, 90vw)`

### JavaScript Architecture

- **Modular**: Separate files for game logic, rendering, and main app
- **ES Modules**: Uses `import/export` syntax
- **Class-based**: Main components use ES6 classes
- **State Management**: Game state stored in `ChessGame` class

### Game Logic

- **Move Validation**: Comprehensive validation for all piece types
- **Undo/Redo**: Full stack implementation with proper state restoration. History states include board, current player, move count, captured pieces, and move notation. Redo properly advances game state after undo.
- **Move Notation**: Metric Chess notation (P45-55, Q45x56, etc.)
- **Board Orientation**: Flipping logic for white/black at bottom with coordinate transformations

### Piece Movement Rules

- **Standard Pieces**: King, Queen, Rook, Bishop, Knight, Pawn
- **Trebuchet**: Chebyshev distance = 3 (unique to Metric Chess)
- **Pawns**: Can move 1 or 2 squares forward on ANY move
- **Promotion**: Pawns promote to Queen when reaching opposite side

## 🚀 TODO List - Future Development

### 🤖 AI Integration

- [x] **Research fairy-stockfish WebAssembly**: Found appropriate source in temp_fairy/
- [x] **Build fairy-stockfish from source**: Successfully built with Emscripten 4.0.22
- [x] **Integrate fairy-stockfish engine**: ffish.js and ffish.wasm now in js/stockfish/
- [x] **Configure for Metric Chess**: Custom variant configured with trebuchets
- [x] **Implement AI move generation**: Basic AI using ffish.js Board API
- [ ] **Add difficulty levels**: Time limits or depth limits
- [ ] **Implement proper minimax search**: Replace random move selection with evaluation
- [ ] **AI vs AI mode**: Implement automated games

### 🎮 Game Features

- [ ] **Castling**: Implement rook and trebuchet castling rules
- [ ] **Heir Kings**: Full implementation of promoted king rules
- [ ] **Save/Load Games**: Local storage or file export

### 🎨 UI/UX Enhancements

- [ ] **Piece Animation**: Smooth movement between squares
- [ ] **Sound Effects**: Move sounds, capture sounds, check alerts
- [ ] **Themes**: Multiple board/piece style options
- [ ] **Mobile Optimization**: Better touch controls
- [ ] **Accessibility**: Keyboard navigation, screen reader support
- [ ] **Game Statistics**: Move analysis, piece values

### 🔧 Technical Improvements

- [ ] **Performance Optimization**: Analyze and optimize rendering

## 🎨 Font Awesome Configuration System

### Overview

Metric Chess uses a flexible configuration system that allows customization of Font Awesome icons and styles through [`metric-chess.json`](metric-chess.json). The system supports both Font Awesome Free (default) and Font Awesome Pro Kits.

NOTE: metrics_chess.json is included in .gitignore so that you can supply a key locally without it being overwritten by the repo (or so that you don't add your key to the repo if you're contributing changes).

### Configuration File

The [`metric-chess.json`](metric-chess.json) file contains three main sections:

```json
{
  "fontAwesomeKit": "your-kit-code-here",
  "fontAwesomeStyle": "fa-sharp-duotone fa-solid",
  "icons": {
    "pieces": { ... },
    "ui": { ... }
  }
}
```

#### Configuration Options

1. **fontAwesomeKit** (optional): Your Font Awesome Pro kit code
   - If omitted or empty: Uses Font Awesome Free with `fa-solid` style
   - If provided: Loads the Pro kit and enables style/icon overrides

NOTE: The `fa-solid` style has many icons in it, most in fact, but not all of them.
For example `fa-atom-simple` is not in the free set but is available in the pro kit.

1. **fontAwesomeStyle** (optional): Font Awesome icon style classes
   - Only applied when a kit is provided
   - Can be single class (`"fa-solid"`) or multiple (`"fa-sharp-duotone fa-solid"`)
   - Ignored if no kit is configured (defaults to `fa-solid`)

1. **icons.pieces**: Icon overrides for chess pieces
   - `king`, `heir`, `queen`, `rook`, `bishop`, `knight`, `pawn`, `trebuchet`
   - Example: `"trebuchet": "fa-meteor"`

1. **icons.ui**: Icon overrides for UI elements
   - `whiteSpinner`, `blackSpinner`, `newGame`, `resetGame`, `undoMove`, `redoMove`
   - `resignGame`, `rotateLeft`, `rotateRight`, `toggleAudio`
   - Modal icons: `chessBoard`, `trebuchetFeature`, `heirFeature`, `aiFeature`, `undoFeature`, `responsiveFeature`

### Implementation Details

#### Loading Process ([`js/fontawesome-config.js`](js/fontawesome-config.js))

1. **Loads config on app startup**: `loadFontAwesomeConfig()` is called first in [`js/main.js`](js/main.js:14)
2. **Validates kit code**: Checks if `fontAwesomeKit` is a non-empty string
3. **Kit provided**: Loads Pro kit script and applies custom style/icons
4. **No kit**: Loads Font Awesome Free CDN with `fa-solid` style
5. **Updates static HTML**: `updateStaticIcons()` applies configured styles to all icons with `data-icon` attributes

#### Icon Style Application

The [`updateStaticIcons()`](js/main.js:724) function in [`js/main.js`](js/main.js) handles style updates:

```javascript
// Removes all possible FA style classes
icon.classList.remove('fa-solid', 'fa-duotone', 'fa-sharp', 'fa-sharp-duotone', ...);

// Adds configured style classes
prefixClasses.forEach(cls => icon.classList.add(cls));

// Updates icon class (e.g., fa-chess-king → fa-meteor)
icon.classList.add(newIcon);
```

### SVG vs. `<i>` Element Handling

**Important**: Font Awesome Pro kits can render icons as either `<i>` elements (traditional) or `<svg>` elements (SVG mode). The codebase handles both:

#### CSS Sizing

Both `<i>` and `<svg>` elements need explicit sizing:

```css
/* Style for <i> tags */
.ai-spinner i,
button i,
.orientation-button i {
    font-size: 1.875rem;
}

/* Style for <svg> tags (Pro kits with SVG mode) */
.ai-spinner svg,
button svg,
.orientation-button svg {
    font-size: 1.875rem;
}
```

#### JavaScript Class Manipulation

When adding/removing classes (like `fa-spin` for animations), check for both elements:

```javascript
// Incorrect - only works with <i> elements
const icon = spinner.querySelector('i');
if (icon) icon.classList.add('fa-spin');

// Correct - works with both <i> and <svg>
const icon = spinner.querySelector('i') || spinner.querySelector('svg');
if (icon) icon.classList.add('fa-spin');
```

Examples in codebase:

- **Spinner animations**: [`showAIThinking()`](js/main.js:562) and [`hideAIThinking()`](js/main.js:571)
- **Icon updates**: [`updateStaticIcons()`](js/main.js:724)

### Default Fallback Behavior

When [`metric-chess.json`](metric-chess.json) is missing, malformed, or has no kit:

- Uses Font Awesome Free 6.4.0 from CDN
- Applies `fa-solid` as the default style
- Uses hardcoded default icons from [`js/fontawesome-config.js`](js/fontawesome-config.js:7)
- No custom icon overrides are applied

### Testing Different Configurations

To test Font Awesome Free (no kit):

```json
{
  "fontAwesomeKit": "",
  "icons": { }
}
```

To test Font Awesome Pro with custom style:

```json
{
  "fontAwesomeKit": "your-kit-code",
  "fontAwesomeStyle": "fa-sharp-duotone fa-solid",
  "icons": {
    "pieces": {
      "trebuchet": "fa-meteor"
    }
  }
}
```

## 📦 Dependencies

### Current Dependencies

- **Font Awesome**: Icons for chess pieces and UI elements
  - Free version (CDN) as default fallback
  - Pro version (kit) optionally configurable via [`metric-chess.json`](metric-chess.json)
  - See "Font Awesome Configuration System" section for details
- **Floating UI**: Positioning library for tooltips
- **Vite**: Build system and development server
- **Serve**: Simple HTTP server for production builds

### Current AI Dependencies

- **Fairy-Stockfish (ffish.js)**: Built from source in temp_fairy/ directory
  - Version: Latest from GitHub (compiled with Emscripten 4.0.22)
  - Files: `js/stockfish/ffish.js` and `js/stockfish/ffish.wasm`
  - Supports custom variants including Metric Chess with 10x10 board and trebuchets

### Future Dependencies (Planned)

- **@types/node**: TypeScript types (if migrating)
- **Jest/Vitest**: Testing framework

## 🔄 Development Workflow

### Branching Strategy

```bash
# Feature branches
git checkout -b feature/ai-integration
git checkout -b feature/castling-rules

# Bug fixes
git checkout -b bug/board-orientation-fix

# Main branch (protected)
main - Production ready code
```

### Commit Guidelines

- **Atomic Commits**: Small, focused changes
- **Descriptive Messages**: "Add pawn promotion logic" not "Fix stuff"
- **Prefixes**:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `docs:` - Documentation
  - `style:` - Formatting changes
  - `refactor:` - Code restructuring
  - `test:` - Testing related
  - `chore:` - Build/config changes

### Code Quality

- **ESLint**: Follow consistent JavaScript style
- **Prettier**: Automatic code formatting
- **Comments**: Explain complex logic, not obvious code
- **Consistency**: Follow existing patterns and naming conventions

## 🎯 Metric Chess Specific Rules

### Board Setup

- **10x10 Grid**: Files 0-9 (left-right), Ranks 0-9 (bottom-top)
- **White Pieces**: Ranks 0-1 (bottom)
- **Black Pieces**: Ranks 8-9 (top)
- **Trebuchets**: Positioned at corners (0,0 and 9,9 for white)

### Special Rules

- **Trebuchet Movement**: Exactly distance 3 (Chebyshev metric)
- **Pawn Movement**: Always 1 or 2 squares forward
- **Promotion**: Any piece except King (including Trebuchet)
- **Heir Kings**: Promoted pawns can become kings

## 🔄 Coordinate Systems and Transformations

Understanding the coordinate mappings is crucial for maintaining correct game behavior across different board orientations.

### Coordinate Systems

1. **Board Coordinates** (Internal Game Logic):
   - 10x10 grid: `board[file][rank]`
   - `file`: 0-9 (left to right, 0 = queenside)
   - `rank`: 0-9 (bottom to top, 0 = white's back row, 9 = black's back row)
   - Example: `board[0][0]` = white trebuchet starting position

2. **Screen Coordinates** (HTML/DOM):
   - 10x10 grid: `screenFile`, `screenRank`
   - `screenFile`: 0-9 (left to right)
   - `screenRank`: 0-9 (top to bottom, 0 = top row, 9 = bottom row)
   - Cell data attributes: `data-coord="${screenFile}${screenRank}"`
   - Example: Top-left cell = `data-coord="00"`, bottom-right = `data-coord="99"`

3. **Display Grid** (Rotation Intermediate):
   - 12x12 grid for rotation calculations (includes 1-cell border)
   - `displayFile`: 1-10 (board file 0-9 + 1 offset)
   - `displayRank`: 1-10 (inverted: board rank 0 → 10, board rank 9 → 1)
   - Used for applying rotations before mapping to screen

### Orientation Rotations

- **Applied Degrees**: Clockwise rotation applied to display grid
  - `bottom`: 0° (white at bottom)
  - `left`: 90° (white at left)
  - `top`: 180° (white at top)
  - `right`: 270° (white at right)

- **Reverse Degrees**: Counter-rotation for screen-to-board mapping
  - Calculated as `(360 - appliedDegrees) % 360`
  - Undoes the visual rotation to map clicks back to board coordinates

### Transformation Functions

#### Board to Screen (for rendering/highlighting)

1. Convert board coordinates to display grid:
   - `displayRank = 10 - boardRank`
   - `displayFile = boardFile + 1`
2. Apply forward rotation by `appliedDegrees`
3. Extract from rotated grid:
   - `screenFile = rotatedX - 1`
   - `screenRank = 10 - rotatedY`

#### Screen to Board (for click handling)

1. Convert screen coordinates to display grid:
   - `displayRank = 10 - screenRank` (invert Y-axis)
   - `displayFile = screenFile + 1`
2. Apply reverse rotation by `reverseDegrees`
3. Extract board coordinates:
   - `boardFile = rotatedX - 1`
   - `boardRank = 10 - rotatedY`

### Key Implementation Notes

- **Grid Inversion**: The display grid inverts ranks (board rank 0 at bottom → display rank 10) to match screen coordinates (screen rank 0 at top)
- **Rotation Consistency**: All rotation logic uses the same `rotateGrid` function with clockwise degrees
- **Border Handling**: 12x12 grid includes borders for coordinate labels, but only inner 10x10 is used for pieces
- **State Preservation**: Undo/redo maintains all coordinate transformations through saved game states

This system ensures that regardless of board orientation, user interactions (clicks) correctly map to game logic coordinates, and visual elements (pieces, highlights) display in the proper rotated positions.

### Notation System

- **Piece Symbols**: P, N, B, R, Q, K, T (Trebuchet)
- **Coordinates**: FileRank (e.g., 45 = file 4, rank 5)
- **Moves**: P45-47 (pawn from 45 to 47)
- **Captures**: Q45x56 (queen captures at 56)
- **Check**: Add + (Q45+)
- **Checkmate**: Add # (Q45#)

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE.md](LICENSE.md) file for details.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Commit changes** with clear messages
4. **Push to your branch**
5. **Open a Pull Request**
6. **Request review** from maintainers

## 🔨 Building Fairy-Stockfish from Source

The project includes Fairy-Stockfish source code in the `temp_fairy/` directory. If you need to rebuild it:

### Prerequisites

Install Emscripten SDK:

```bash
# Download and install emsdk
git clone https://github.com/emscripten-core/emsdk.git ~/emsdk
cd ~/emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### Build Steps

```bash
# Navigate to the Fairy-Stockfish source directory
cd temp_fairy/src

# Build using the JavaScript makefile
make -f Makefile_js build

# Copy the built files to the project
cp ../tests/js/ffish.js ../../js/stockfish/
cp ../tests/js/ffish.wasm ../../js/stockfish/ffish.wasm
```

### Important Notes

- The build was tested with Emscripten 4.0.22
- A small fix was applied to `temp_fairy/src/ffishjs.cpp` to make it compatible with newer Emscripten versions
  - Changed `read_game_pgn` return type from `Game` to `Game*` to avoid copy constructor issues
  - Updated all references in the function from `game.` to `game->`
- The Metric Chess variant is configured in [`stockfish-integration.js`](js/stockfish/stockfish-integration.js:71)

## 📚 Resources

- **Metric Chess Rules**: See [README.md](README.md)
- **Fairy-Stockfish**: <https://github.com/ianfab/Fairy-Stockfish>
- **Vite Documentation**: <https://vitejs.dev/>
- **Font Awesome**: <https://fontawesome.com/>

## 🚨 Important Notes

1. **Board Coordinates**: File (x-axis) comes before Rank (y-axis) - e.g., "45" = file 4, rank 5
2. **Trebuchet Logic**: Uses Chebyshev distance (max of dx, dy) = 3
3. **Pawn Direction**: White pawns move up (increasing rank), black pawns move down (decreasing rank)
4. **Orientation**: When board is rotated, coordinate transformations handle the mapping between screen clicks and board logic
5. **Undo/Redo**: Properly maintains move history and game state across operations
6. **Coordinate Transformations**: Screen coordinates (DOM) differ from board coordinates (logic) and require careful mapping, especially with rotations

This project follows the MIT License and welcomes contributions from the open source community!
