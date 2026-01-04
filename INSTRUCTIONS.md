# Metric Chess - Developer Guide

## 📋 Overview

**Metric Chess** is a 10x10 chess variant featuring trebuchets, heir kings, and advanced AI powered by Fairy-Stockfish. This guide provides high-level information for developers working on the project.

## 🏗️ Architecture

### Core Components

- **Game Logic** (`js/chess.js`): Chess rules, move validation, game state
- **Rendering** (`js/render.js`): Board display, piece positioning, animations
- **Application** (`js/main.js`): User interaction, event handling, game flow
- **AI Engine** (`js/stockfish/`): Multi-threaded chess analysis using WebAssembly

### Key Features

- **10x10 Board**: Extended battlefield with unique trebuchet pieces
- **Multi-threading AI**: Non-blocking analysis using web workers and WASM
- **Progressive Web App**: Offline functionality and native app experience
- **Responsive Design**: Works on desktop and mobile devices
- **Customizable UI**: Font Awesome icon system with Pro kit support

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod
```

## 📚 Documentation

### System Components

- **[WORKERS.md](WORKERS.md)**: Web worker architecture and message passing
- **[THREADING.md](THREADING.md)**: Multi-threading, WASM, and Emscripten pthreads
- **[UI.md](UI.md)**: User interface architecture and components
- **[FONTAWESOME.md](FONTAWESOME.md)**: Icon configuration and customization
- **[PWA.md](PWA.md)**: Progressive Web App features and service worker

### Game Rules

- **[README.md](README.md)**: Complete game rules and strategy guide

## 🎯 Development Areas

### Current Status

- ✅ **Core Game**: 10x10 chess with trebuchets and heir kings
- ✅ **AI Integration**: Multi-threaded Fairy-Stockfish with NNUE evaluation
- ✅ **PWA Features**: Offline play, installable, service worker caching
- ✅ **UI/UX**: Responsive design, accessibility, customizable icons
- ✅ **Build System**: Vite-based development and production builds

### Future Development

- **Game Features**: Castling rules, save/load functionality
- **UI Enhancements**: Piece animations, sound effects, themes
- **AI Improvements**: Difficulty levels, AI vs AI mode
- **Performance**: Rendering optimizations, memory management

## 🔧 Technical Stack

### Frontend

- **Vanilla JavaScript**: ES6 modules, classes, async/await
- **CSS Grid**: Responsive layout system
- **Web Components**: Custom modal and UI elements

### AI & Performance

- **WebAssembly**: Compiled Fairy-Stockfish engine
- **Web Workers**: Non-blocking AI analysis
- **Emscripten Pthreads**: Multi-threaded search algorithms
- **SharedArrayBuffer**: Cross-thread memory sharing

### Build & Deployment

- **Vite**: Fast development server and optimized builds
- **Service Worker**: Offline caching and PWA functionality
- **Font Awesome**: Configurable icon system with Pro support

## 🎨 Design Principles

### Code Quality

- **Modular Architecture**: Separate concerns across files
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Performance First**: Optimized rendering and memory usage
- **Accessibility**: Keyboard navigation, screen reader support

### User Experience

- **Responsive Design**: Works on all screen sizes
- **Intuitive Controls**: Clear UI with helpful tooltips
- **Fast Feedback**: Immediate visual and audio responses
- **Offline Ready**: Full functionality without network

## 🤝 Contributing

1. **Read the Documentation**: Understand the architecture from the detailed guides
2. **Follow Code Style**: Consistent formatting and naming conventions
3. **Test Thoroughly**: Check functionality across browsers and devices
4. **Update Docs**: Keep documentation current with code changes

## 📝 License

This project is licensed under the **MIT License**. See [LICENSE.md](LICENSE.md) for details.

## 📚 Resources

- **Fairy-Stockfish**: <https://github.com/ianfab/Fairy-Stockfish>
- **Vite**: <https://vitejs.dev/>
- **Font Awesome**: <https://fontawesome.com/>
- **WebAssembly**: <https://webassembly.org/>
- **PWA Guide**: <https://web.dev/progressive-web-apps/>
