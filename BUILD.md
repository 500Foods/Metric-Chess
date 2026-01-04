# Build System and Development Guide

## 🚀 Vite Build System

Metric Chess uses Vite as its build system, providing fast development server and optimized production builds. This section explains the Vite configuration and build process.

### Vite Configuration Overview

The [`vite.config.js`](vite.config.js) file contains the complete build configuration:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
    headers: {
      // Enable SharedArrayBuffer for Stockfish WebAssembly threading
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  // ... plugins, build configuration
});
```

### Key Vite Features Used

1. **Development Server**: Fast HMR (Hot Module Replacement) for instant feedback
2. **Production Build**: Optimized, minified bundles with code splitting
3. **PWA Support**: Progressive Web App capabilities via `vite-plugin-pwa`
4. **Custom Build Plugins**: Special handling for Stockfish files

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod

# Run production preview
npm run preview
```

### Vite Build Process

The build process handles several special requirements:

1. **Stockfish File Copying**: Custom Rollup plugins copy WASM and worker files
2. **Service Worker Generation**: PWA plugin creates offline-capable service worker
3. **Asset Optimization**: Fonts, images, and other assets are optimized
4. **Code Splitting**: JavaScript bundles are split for better caching

## 🧰 Fairy-Stockfish Build Process

### Understanding the Build Components

Metric Chess uses two different Stockfish implementations:

1. **ffish.js**: Lightweight JavaScript wrapper for basic board manipulation
2. **Fairy-Stockfish WASM**: Full engine with NNUE and multi-threading for AI analysis

### Building Fairy-Stockfish from Source

The Fairy-Stockfish engine is compiled using Emscripten to create WebAssembly files. Here's how to rebuild it:

#### Prerequisites

```bash
# Install Emscripten SDK
# Follow instructions at: https://emscripten.org/docs/getting_started/downloads.html

# Required tools:
# - emcc (Emscripten compiler)
# - make
# - git
# - Python 3
```

#### Build Process

```bash
# Clone Fairy-Stockfish repository
git clone https://github.com/ianfab/Fairy-Stockfish.git
cd Fairy-Stockfish

# Checkout the specific version used by Metric Chess
# (Check package.json or stockfish files for exact version)
git checkout <specific-commit-hash>

# Build the WebAssembly version with pthreads support
make build ARCH=wasm

# Or use the JavaScript build target
make build ARCH=js
```

#### Emscripten Compilation Flags

The key compilation flags used for the WASM build:

```makefile
# From Fairy-Stockfish Makefile
build-stockfish:
    emcc $(EMCC_FLAGS) \
        -pthread \
        -s USE_PTHREADS=1 \
        -s PTHREAD_POOL_SIZE=8 \
        -s SHARED_MEMORY=1 \
        --preload-file $(EVALFILE) \
        -o ../tests/js/stockfish.js
```

**Flag Explanation:**

- `-pthread`: Enable POSIX threads support
- `-s USE_PTHREADS=1`: Activate pthreads in Emscripten
- `-s PTHREAD_POOL_SIZE=8`: Pre-allocate thread pool
- `-s SHARED_MEMORY=1`: Enable SharedArrayBuffer usage
- `--preload-file`: Embed NNUE evaluation files

### Advanced Build Options

For experienced developers, here are additional optimization flags:

```makefile
# Optimization flags for production builds
-O3                          # Maximum optimization
-s ALLOW_MEMORY_GROWTH=1    # Dynamic memory allocation
--llvm-lto 3               # Link-time optimization
-s WASM=1                  # Target WebAssembly
-s MODULARIZE=1            # Create modular JavaScript
-s EXPORT_ES6=1            # ES6 module support
```

## 📦 Project Structure

```directory
metric-chess/
├── public/                  # Static files (copied as-is)
│   └── stockfish/           # Pre-built Fairy-Stockfish files
├── js/                     # JavaScript source
│   └── stockfish/           # Stockfish integration code
│       ├── ffish.js         # Lightweight board manipulation
│       ├── ffish.wasm       # WASM for ffish
│       ├── stockfish.js      # Full Fairy-Stockfish engine
│       ├── stockfish.wasm    # WASM for main engine
│       ├── stockfish.worker.js # Pthread worker
│       └── metric-stockfish-worker.js # Custom worker wrapper
├── vite.config.js           # Vite configuration
├── package.json            # Project dependencies
└── BUILD.md                # This file
```

## 🔧 Development Workflow

### Working with Stockfish Files

The project includes pre-built Stockfish files, but you may need to update them:

1. **Development Mode**: Files are loaded from `/js/stockfish/`
2. **Production Mode**: Files are copied to `/dist/stockfish/` by build scripts

### Updating Stockfish Files

```bash
# Copy new stockfish files to the project
cp Fairy-Stockfish/build/stockfish.js public/stockfish/
cp Fairy-Stockfish/build/stockfish.wasm public/stockfish/
cp Fairy-Stockfish/build/stockfish.worker.js public/stockfish/

# Also copy to development location
cp Fairy-Stockfish/build/stockfish.js js/stockfish/
cp Fairy-Stockfish/build/stockfish.wasm js/stockfish/
cp Fairy-Stockfish/build/stockfish.worker.js js/stockfish/
```

### Custom Build Scripts

The `vite.config.js` includes custom Rollup plugins that handle file copying:

```javascript
// From vite.config.js
{
  name: 'copy-stockfish-files',
  writeBundle() {
    // Copy all stockfish files including the custom worker
    const files = ['ffish.js', 'ffish.wasm', 'stockfish.js', 'stockfish.wasm', 
                   'stockfish.worker.js', 'metric-stockfish-worker.js'];
    
    files.forEach(file => {
      const sourcePath = resolve(__dirname, 'js', 'stockfish', file);
      const destPath = resolve(__dirname, 'dist', 'js', 'stockfish', file);
      if (fs.existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
      }
    });
  }
}
```

## 🐛 Debugging Build Issues

### Common Build Problems

1. **SharedArrayBuffer Errors**:

   ```txt
   Error: SharedArrayBuffer is not defined
   Solution: Ensure COOP/COEP headers are set in vite.config.js
   ```

2. **WASM Loading Failures**:

   ```txt
   Error: Failed to load stockfish.wasm
   Solution: Check file paths in metric-stockfish-worker.js locateFile function
   ```

3. **Thread Creation Failures**:

   ```txt
   Error: Failed to create thread
   Solution: Reduce thread count or check memory limits
   ```

### Debugging Tools

```bash
# Check Vite build output
npm run build:prod

# Analyze bundle sizes
npm run build:prod -- --mode analyze

# Test production build locally
npm run preview
```

## 🚀 Production Deployment

### Server Configuration

For production deployment, ensure your server has the required headers:

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name metric-chess.example.com;
    
    root /path/to/dist;
    index index.html;
    
    # Required for SharedArrayBuffer
    add_header Cross-Origin-Opener-Policy same-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache Configuration:**

```apache
<VirtualHost *:80>
    ServerName metric-chess.example.com
    DocumentRoot /path/to/dist
    
    # Required for SharedArrayBuffer
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Embedder-Policy "require-corp"
    
    <Directory /path/to/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Deployment Checklist

- [ ] Set COOP/COEP headers on server
- [ ] Test SharedArrayBuffer support
- [ ] Verify WASM files are accessible
- [ ] Check service worker registration
- [ ] Test offline functionality
- [ ] Monitor memory usage

## 📚 Advanced Topics

### Customizing the Build

To modify the build process, edit `vite.config.js`:

```javascript
// Example: Change thread allocation strategy
export default defineConfig({
  // ... existing config
  define: {
    'process.env.MAX_THREADS': '6', // Override default max threads
    'process.env.THREAD_RATIO': '0.8' // Use 80% of cores instead of 75%
  }
});
```

### Memory Management

For large WASM applications, memory settings are crucial:

```javascript
// Emscripten memory configuration
-s TOTAL_MEMORY=256MB      // Base memory allocation
-s ALLOW_MEMORY_GROWTH=1   // Allow dynamic growth
-s SHARED_MEMORY=1         // Enable shared memory
-s PTHREAD_STACK_SIZE=2097152 // 2MB per thread stack
```

### Performance Optimization

Advanced build optimizations:

```bash
# Use more aggressive optimization
emcc -O3 -flto -s WASM=1 -s ALLOW_MEMORY_GROWTH=1

# Enable SIMD for vectorized operations
emcc -msimd128 -s WASM=1

# Reduce binary size
emcc -s MINIFY_HTML=2 -s WASM=1
```

This build guide provides comprehensive instructions for working with the Vite build system and Fairy-Stockfish compilation process, covering everything from basic setup to advanced optimization techniques.
