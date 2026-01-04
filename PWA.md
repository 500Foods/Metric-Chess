# Progressive Web App (PWA) Implementation

## Overview

Metric Chess is implemented as a Progressive Web App, providing offline functionality, installability, and native app-like experience through service workers, web app manifests, and modern web APIs.

## Core PWA Features

### Service Worker (`public/sw.js`)

The service worker enables offline functionality by caching essential assets:

```javascript
const CACHE_NAME = 'metric-chess-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/chess.js',
  './js/render.js',
  './js/fontawesome-config.js',
  './js/stockfish/ffish.js',
  './js/stockfish/stockfish.js',
  './js/stockfish/stockfish.worker.js',
  './js/stockfish/stockfish.wasm',
  './js/stockfish/metric-stockfish-worker.js',
  './js/stockfish/stockfish-worker-wrapper.js',
  './fonts/VanadiumMono-SemiExtended.woff2',
  './fonts/VanadiumSans-SemiExtended.woff2',
  './icons/chess-icon.svg',
  './manifest.json'
];
```

### Web App Manifest (`public/manifest.json`)

Defines app metadata for installation and appearance:

```json
{
  "name": "Metric Chess",
  "short_name": "MetricChess",
  "description": "A 10x10 chess variant with unique pieces including trebuchets and heir kings",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#2b2b2b",
  "theme_color": "#f0d9b5",
  "icons": [
    {
      "src": "icons/chess-icon.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

## Service Worker Lifecycle

### Installation Event

```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
});
```

**Process:**

1. Service worker installs when first accessed
2. Opens cache with versioned name
3. Caches all essential assets
4. Installation completes

### Fetch Event

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});
```

**Strategy:**

1. Check cache for matching request
2. Return cached response if available
3. Fall back to network request

### Activation Event

```javascript
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Purpose:**

- Clean up old cache versions
- Ensure only current cache remains

## Cache Strategy

### Cache-First with Network Fallback

```diagram
Request → Cache Check → Cache Hit? → Return Cached
                              ↓
                           Network → Return Fresh
```

### Cached Assets

#### Critical Assets

- `index.html` - Main application shell
- `css/style.css` - Core styling
- `js/main.js`, `js/chess.js`, `js/render.js` - Core functionality

#### Stockfish Assets

- `js/stockfish/ffish.js` - Board manipulation library
- `js/stockfish/stockfish.js` - NNUE engine
- `js/stockfish/stockfish.worker.js` - Pthread worker
- `js/stockfish/stockfish.wasm` - WebAssembly binary

#### Static Assets

- Font files (WOFF2)
- Icons and manifest
- Font Awesome configuration

## Offline Functionality

### What Works Offline

✅ **Core Game**: Complete chess gameplay
✅ **AI Analysis**: Pre-cached Stockfish engine
✅ **UI**: All interface elements cached
✅ **Fonts**: Custom typography loaded
✅ **Icons**: Font Awesome icons cached

### What Requires Network

❌ **Font Awesome Pro**: Kit loaded dynamically
❌ **External APIs**: None currently used
❌ **Real-time Features**: None implemented

## Installation and Updates

### Installation Prompt

The browser shows an "Add to Home Screen" prompt when:

1. **HTTPS**: Served over secure connection
2. **Service Worker**: Registered and active
3. **Manifest**: Valid web app manifest present
4. **User Engagement**: Sufficient interaction with site

### Update Mechanism

```javascript
// In main.js - Check for service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            // New version available
            showUpdatePrompt();
          }
        });
      });
    });
}
```

## Performance Optimizations

### Cache Versioning

```javascript
const CACHE_NAME = 'metric-chess-v2'; // Increment for updates
```

**Benefits:**

- Forces cache refresh on updates
- Prevents stale asset loading
- Enables atomic cache updates

### Asset Optimization

#### Font Loading

- **WOFF2**: Modern compression format
- **Preload**: Critical fonts loaded early
- **Fallback**: System fonts for fast initial render

#### JavaScript Splitting

- **Dynamic Imports**: Stockfish loaded on demand
- **Worker Isolation**: Heavy computation off main thread
- **Lazy Loading**: Non-critical features loaded later

## Browser Compatibility

### PWA Support Matrix

| Feature | Chrome | Firefox | Safari | Edge |
| --------- | -------- | --------- | -------- | ------ |
| Service Worker | ✅ 40+ | ✅ 44+ | ✅ 11.1+ | ✅ 17+ |
| Web App Manifest | ✅ 38+ | ✅ 76+ | ✅ 11.3+ | ✅ 17+ |
| Add to Home Screen | ✅ 31+ | ❌ | ✅ 11.3+ | ✅ 17+ |
| Background Sync | ✅ 49+ | ❌ | ❌ | ✅ 79+ |

### Fallback Behavior

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('SW registered'))
    .catch(() => console.log('SW not supported'));
} else {
  console.log('Service Worker not supported');
}
```

## Development and Testing

### Local Development

```bash
# Vite serves over HTTPS in development
npm run dev
# Access via https://localhost:3000
```

### Testing Offline Mode

#### Chrome DevTools

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Refresh page to test offline functionality

#### Firefox DevTools

1. Open DevTools → Application → Service Workers
2. Check "Offline" mode
3. Test cached assets

### Cache Inspection

```javascript
// Inspect cache contents
caches.open('metric-chess-v2').then(cache => {
  cache.keys().then(requests => {
    requests.forEach(request => {
      console.log(request.url);
    });
  });
});
```

## Deployment Considerations

### HTTPS Requirement

PWAs must be served over HTTPS:

- **Development**: Vite provides HTTPS automatically
- **Production**: Configure server certificates
- **Local Testing**: Use `mkcert` for local certificates

### Cache Busting

```javascript
// For dynamic assets, append version
const assetUrl = `/js/stockfish/stockfish.js?v=${BUILD_VERSION}`;
```

### CDN Integration

```javascript
// Font Awesome loaded from CDN
const faLink = document.createElement('link');
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
```

## Security Considerations

### Content Security Policy

```javascript
// For service worker and PWA
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com
font-src 'self' https://fonts.gstatic.com
connect-src 'self'
```

### Service Worker Scope

- **Scope**: Limited to origin by default
- **Registration**: Must be same-origin
- **Cache**: Only caches same-origin resources

## Future Enhancements

### Background Sync

```javascript
// Future: Sync game state when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-games') {
    event.waitUntil(syncGameState());
  }
});
```

### Push Notifications

```javascript
// Future: Notify when opponent moves
self.addEventListener('push', (event) => {
  const options = {
    body: 'Your opponent made a move!',
    icon: '/icons/chess-icon.svg'
  };
  event.waitUntil(
    self.registration.showNotification('Metric Chess', options)
  );
});
```

### App Shortcuts

```json
{
  "shortcuts": [
    {
      "name": "New Game",
      "short_name": "New",
      "description": "Start a new chess game",
      "url": "/?action=new",
      "icons": [{ "src": "/icons/new-game.svg", "sizes": "96x96" }]
    }
  ]
}
```

This PWA implementation provides a native app-like experience while maintaining the flexibility and reach of the web platform.
