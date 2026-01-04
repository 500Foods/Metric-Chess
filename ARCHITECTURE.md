# Architecture Overview

## Project Vision

Metric Chess represents a sophisticated implementation of a 10x10 chess variant, pushing the boundaries of web technology through advanced AI integration, multi-threading, and progressive web app capabilities.

## Technical Achievements

### 🤖 Advanced AI Integration

**Challenge**: Implement professional-level chess analysis in the browser without blocking the UI.

**Solution**: Multi-threaded Fairy-Stockfish engine with NNUE evaluation running in dedicated web workers.

**Impact**:

- Real-time analysis without UI freezing
- Tournament-level chess evaluation
- Graceful fallback to minimax search
- Dynamic thread allocation based on hardware

### 🧵 Multi-Threading in WebAssembly

**Challenge**: Leverage modern CPU capabilities for parallel chess search.

**Solution**: Emscripten-compiled Fairy-Stockfish with pthreads support.

**Technical Details**:

- SharedArrayBuffer for cross-thread communication
- COOP/COEP headers for security compliance
- Dynamic thread pool sizing (75% of CPU cores, max 8)
- Lazy SMP (Symmetric Multi-Processing) search

### 🎨 Progressive Enhancement

**Challenge**: Provide rich features while maintaining broad compatibility.

**Solution**: Layered architecture with graceful degradation.

**Implementation**:

- Font Awesome Pro with Free fallback
- Web Workers with main-thread fallback
- PWA features with regular web app baseline
- SharedArrayBuffer with single-threaded mode

## System Architecture

### Core Components

```diagram
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Interface│    │   Game Logic    │    │   AI Engine     │
│                 │    │                 │    │                 │
│ • HTML/CSS      │◄──►│ • Move Validation│◄──►│ • Web Worker    │
│ • Event Handling│    │ • State Mgmt    │    │ • WASM Engine   │
│ • Rendering     │    │ • Rules Engine  │    │ • NNUE Eval     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ • Board State   │
                    │ • Move History  │
                    │ • Game Config   │
                    └─────────────────┘
```

### Data Flow

1. **User Input** → Event handlers → Coordinate transformation → Move validation
2. **AI Request** → Worker message → WASM analysis → Move response → UI update
3. **State Changes** → Re-rendering → Visual feedback → History updates

## Key Design Decisions

### Why Web Workers for AI?

**Problem**: Chess analysis is computationally intensive and would block the UI.

**Alternatives Considered**:

- Main thread with WebAssembly (blocks UI)
- Server-side analysis (requires backend, network dependency)
- Simplified AI (reduced playing strength)

**Chosen Solution**: Dedicated web worker with full Fairy-Stockfish engine.

**Benefits**:

- Non-blocking UI during analysis
- Full engine capabilities
- Offline functionality
- Progressive enhancement

### Why Emscripten Pthreads?

**Problem**: Modern CPUs have multiple cores, but JavaScript is single-threaded.

**Alternatives Considered**:

- Single-threaded WASM (underutilizes hardware)
- JavaScript web workers (no shared memory, complex coordination)
- asm.js (outdated technology)

**Chosen Solution**: Emscripten pthreads with SharedArrayBuffer.

**Benefits**:

- Native multi-threading performance
- Seamless C++ to WebAssembly compilation
- Industry-standard threading model

### Why Custom Chess Variant?

**Problem**: Standard chess engines don't support 10x10 boards with trebuchets.

**Alternatives Considered**:

- Modify existing engine (complex, maintenance burden)
- Create from scratch (time-intensive, quality concerns)
- Use general game engine (overkill, performance issues)

**Chosen Solution**: Extend Fairy-Stockfish with custom variant support.

**Benefits**:

- Professional engine quality
- Maintainable variant definitions
- Future extensibility

## Performance Characteristics

### AI Analysis Speed

- **Easy (1s)**: ~5-10 ply depth, basic tactical analysis
- **Medium (3s)**: ~8-12 ply depth, positional understanding
- **Hard (5s)**: ~10-15 ply depth, strategic planning
- **Expert (10s)**: ~12-18 ply depth, complex combinations
- **Master (20s)**: ~15-22 ply depth, tournament-level analysis

### Memory Usage

- **Base Application**: ~5-10MB
- **Fairy-Stockfish WASM**: ~2-3MB
- **NNUE Networks**: ~1-2MB per loaded network
- **Thread Stacks**: ~2MB per thread
- **Total (8 threads)**: ~25-35MB

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
| --------- | -------- | --------- | -------- | ------ |
| ES6 Modules | ✅ 61+ | ✅ 60+ | ✅ 10.1+ | ✅ 16+ |
| Web Workers | ✅ 4+ | ✅ 3.5+ | ✅ 4+ | ✅ 12+ |
| WebAssembly | ✅ 57+ | ✅ 52+ | ✅ 11+ | ✅ 16+ |
| SharedArrayBuffer | ✅ 68+ | ❌ | ✅ 15.2+ | ✅ 79+ |
| PWA Features | ✅ 40+ | ✅ 44+ | ✅ 11.3+ | ✅ 17+ |

## Security Considerations

### SharedArrayBuffer Requirements

- **COOP Header**: `Cross-Origin-Opener-Policy: same-origin`
- **COEP Header**: `Cross-Origin-Embedder-Policy: require-corp`
- **Purpose**: Prevents Spectre-style attacks on shared memory
- **Impact**: Required for multi-threading, enforced by browsers

### Content Security Policy

```javascript
// Recommended CSP for production
default-src 'self'
script-src 'self' 'unsafe-inline' https://kit.fontawesome.com
style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
connect-src 'self'
```

### Data Handling

- **No External APIs**: All processing client-side
- **No User Data Storage**: Game state stored locally only
- **No Authentication**: Public access application

## Scalability and Limitations

### Current Limitations

1. **Memory Constraints**: Large WASM files and thread stacks
2. **Browser Support**: SharedArrayBuffer not available in all browsers
3. **Mobile Performance**: Limited by device capabilities
4. **Build Complexity**: Emscripten compilation requirements

### Future Scalability

1. **WASM Optimizations**: Smaller binaries, better compression
2. **Progressive Loading**: Load engine components on demand
3. **Cloud Fallback**: Server-side analysis for unsupported clients
4. **WebAssembly Threads**: Native WASM threading (future spec)

## Development Philosophy

### Code Quality Principles

- **Progressive Enhancement**: Works everywhere, enhanced where possible
- **Performance First**: Optimized for smooth user experience
- **Maintainable Architecture**: Clear separation of concerns
- **Future-Proof**: Modern standards with fallbacks

### Technical Innovation

- **WebAssembly Multi-threading**: Pushing browser capabilities
- **Advanced AI Integration**: Professional chess analysis in web apps
- **PWA Implementation**: Native app experience on the web
- **Custom Game Variants**: Extensible chess engine architecture

## Success Metrics

### Technical Milestones

- ✅ **Multi-threaded WASM**: Successfully implemented pthreads in browser
- ✅ **Professional AI**: Tournament-level chess analysis
- ✅ **Zero UI Blocking**: Smooth interaction during AI thinking
- ✅ **Offline Functionality**: Full PWA with service worker
- ✅ **Broad Compatibility**: Works across modern browsers

### User Experience Goals

- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Fast Loading**: Optimized bundles and caching
- ✅ **Intuitive Interface**: Clear controls and feedback
- ✅ **Accessible**: Keyboard navigation and screen reader support
- ✅ **Progressive**: Enhanced experience with advanced features

This architecture demonstrates the cutting edge of web development, combining multiple advanced technologies into a cohesive, high-performance chess application.
