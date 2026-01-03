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
- **Undo/Redo**: Full stack implementation with proper state restoration
- **Move Notation**: Metric Chess notation (P45-55, Q45x56, etc.)
- **Board Orientation**: Flipping logic for white/black at bottom

### Piece Movement Rules

- **Standard Pieces**: King, Queen, Rook, Bishop, Knight, Pawn
- **Trebuchet**: Chebyshev distance = 3 (unique to Metric Chess)
- **Pawns**: Can move 1 or 2 squares forward on ANY move
- **Promotion**: Pawns promote to Queen when reaching opposite side

## 🚀 TODO List - Future Development

### 🤖 AI Integration (High Priority)

- [ ] **Research fairy-stockfish WebAssembly**: Find appropriate WASM build
- [ ] **Integrate fairy-stockfish engine**: Add to project dependencies
- [ ] **Configure for Metric Chess**: Set up custom variant rules
- [ ] **Implement AI move generation**: Connect engine to game logic
- [ ] **Add difficulty levels**: Time limits or depth limits
- [ ] **AI vs AI mode**: Implement automated games

### 🎮 Game Features

- [ ] **Castling**: Implement rook and trebuchet castling rules
- [ ] **En Passant**: Add special pawn capture rule
- [ ] **Heir Kings**: Full implementation of promoted king rules
- [ ] **Game Timer**: Optional clock for each player
- [ ] **Save/Load Games**: Local storage or file export
- [ ] **PGN Import/Export**: Standard chess notation support

### 🎨 UI/UX Enhancements

- [ ] **Piece Animation**: Smooth movement between squares
- [ ] **Sound Effects**: Move sounds, capture sounds, check alerts
- [ ] **Themes**: Multiple board/piece style options
- [ ] **Mobile Optimization**: Better touch controls
- [ ] **Accessibility**: Keyboard navigation, screen reader support
- [ ] **Game Statistics**: Move analysis, piece values

### 🔧 Technical Improvements

- [ ] **Performance Optimization**: Analyze and optimize rendering
- [ ] **Error Handling**: Better validation and user feedback
- [ ] **Testing**: Unit tests for game logic
- [ ] **Documentation**: JSDoc comments for all methods
- [ ] **TypeScript**: Consider migration for better type safety

## 📦 Dependencies

### Current Dependencies

- **Font Awesome Free**: For chess piece icons (CDN)
- **Vite**: Build system and development server
- **Serve**: Simple HTTP server for production builds

### Future Dependencies (Planned)

- **fairy-stockfish.wasm**: Chess engine for AI functionality
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

## 📚 Resources

- **Metric Chess Rules**: See [README.md](README.md)
- **Fairy-Stockfish**: <https://github.com/ianfab/Fairy-Stockfish>
- **Vite Documentation**: <https://vitejs.dev/>
- **Font Awesome**: <https://fontawesome.com/>

## 🚨 Important Notes

1. **Board Coordinates**: File (x-axis) comes before Rank (y-axis) - e.g., "45" = file 4, rank 5
2. **Trebuchet Logic**: Uses Chebyshev distance (max of dx, dy) = 3
3. **Pawn Direction**: White pawns move up (increasing rank), black pawns move down (decreasing rank)
4. **Orientation**: When board is flipped, coordinates remain the same but display is mirrored

This project follows the MIT License and welcomes contributions from the open source community!
