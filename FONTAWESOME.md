# Font Awesome Configuration System

## Overview

Metric Chess implements a flexible Font Awesome icon configuration system that supports both free and Pro versions, allowing customization of chess pieces and UI elements through a JSON configuration file. The system gracefully degrades to Font Awesome Free when no Pro kit is available.

## Architecture

### Configuration File Structure

The system uses `metric-chess.json` for configuration:

```json
{
  "fontAwesomeKit": "your-kit-code-here",
  "fontAwesomeStyle": "fa-sharp-duotone fa-solid",
  "icons": {
    "pieces": {
      "king": "fa-chess-king",
      "trebuchet": "fa-meteor"
    },
    "ui": {
      "resignGame": ["fa-flag", "fa-swap-opacity"],
      "whiteSpinner": ["fa-atom-simple"]
    }
  }
}
```

### Key Components

1. **`js/fontawesome-config.js`**: Main configuration loader and API
2. **`metric-chess.json`**: User configuration file (gitignored)
3. **Dynamic Loading**: Conditional loading of Free vs Pro versions
4. **Icon Normalization**: Handles both string and array icon definitions

## Configuration Options

### Font Awesome Kit

```javascript
"fontAwesomeKit": "07d198fec2"
```

- **Type**: String
- **Required**: No (falls back to Free version)
- **Purpose**: Enables Font Awesome Pro features
- **Security**: File is gitignored to prevent kit code exposure

### Font Awesome Style

```javascript
"fontAwesomeStyle": "fa-sharp-duotone fa-solid"
```

- **Type**: String (space-separated classes)
- **Default**: `"fa-solid"` (Free) or `"fa-duotone"` (Pro)
- **Purpose**: Sets default style for all icons
- **Examples**:
  - `"fa-solid"` - Classic solid icons
  - `"fa-duotone"` - Two-tone icons
  - `"fa-sharp-duotone fa-solid"` - Sharp duotone with solid fallback

### Icon Overrides

#### Piece Icons

```json
"pieces": {
  "king": "fa-chess-king",
  "heir": "fa-chess-king",
  "queen": "fa-chess-queen",
  "rook": "fa-chess-rook",
  "bishop": "fa-chess-bishop",
  "knight": "fa-chess-knight",
  "pawn": "fa-chess-pawn",
  "trebuchet": "fa-meteor"
}
```

#### UI Icons

```json
"ui": {
  "whiteSpinner": "fa-atom",
  "blackSpinner": ["fa-atom", "fa-swap-opacity"],
  "newGame": "fa-plus-circle",
  "resetGame": "fa-refresh",
  "undoMove": "fa-undo",
  "redoMove": "fa-redo",
  "resignGame": ["fa-flag", "fa-swap-opacity"],
  "rotateLeft": "fa-arrow-left",
  "rotateRight": "fa-arrow-right",
  "toggleAudio": "fa-volume-up"
}
```

## Implementation Details

### Loading Process

```javascript
// From js/fontawesome-config.js
export async function loadFontAwesomeConfig() {
  try {
    const response = await fetch('metric-chess.json');
    const config = await response.json();

    // Check for valid kit code
    if (config.fontAwesomeKit?.trim()) {
      // Load Pro kit
      loadFontAwesomePro(config);
    } else {
      // Load Free version
      loadFontAwesomeFree();
    }

    // Apply icon overrides
    mergeIconOverrides(config);
  } catch (error) {
    // Fallback to Free version
    loadFontAwesomeFree();
  }
}
```

### Icon Format Handling

The system supports both simple strings and arrays for advanced features:

```javascript
// Simple icon
"resignGame": "fa-flag"

// Advanced icon with modifiers
"resignGame": ["fa-flag", "fa-swap-opacity"]
"whiteSpinner": ["fa-atom-simple", "fa-spin"]
```

### Dynamic Script Loading

#### Pro Version Loading

```javascript
function loadFontAwesomePro(config) {
  const script = document.createElement('script');
  script.src = `https://kit.fontawesome.com/${config.fontAwesomeKit}.js`;
  script.crossOrigin = 'anonymous';
  script.async = true;

  script.onload = () => console.log('Font Awesome Pro loaded');
  script.onerror = () => console.warn('Failed to load Pro kit');

  document.head.appendChild(script);
}
```

#### Free Version Loading

```javascript
function loadFontAwesomeFree() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(link);
}
```

## API Functions

### Configuration Access

```javascript
import { getFAIconPrefix, getPieceIcon, getUIIcon } from './js/fontawesome-config.js';

// Get current style prefix
const prefix = getFAIconPrefix(); // "fa-sharp-duotone fa-solid"

// Get piece icon (always returns array)
const kingIcon = getPieceIcon('king'); // ["fa-chess-king"]

// Get UI icon (always returns array)
const spinnerIcon = getUIIcon('whiteSpinner'); // ["fa-atom-simple"]
```

### Icon Application

Icons are applied using data attributes in HTML:

```html
<!-- Before configuration -->
<button data-icon="resignGame">
  <i class="fa-solid fa-flag"></i>
</button>

<!-- After configuration with ["fa-flag", "fa-swap-opacity"] -->
<button data-icon="resignGame">
  <i class="fa-sharp-duotone fa-solid fa-flag fa-swap-opacity"></i>
</button>
```

### Static Icon Updates

```javascript
// From js/main.js
function updateStaticIcons() {
  const icons = document.querySelectorAll('[data-icon]');

  icons.forEach(icon => {
    const iconKey = icon.getAttribute('data-icon');
    const iconClasses = getUIIcon(iconKey);

    // Clear existing FA classes
    icon.classList.remove('fa-solid', 'fa-duotone', 'fa-sharp', 'fa-sharp-duotone');

    // Add configured style prefix
    const prefixClasses = getFAIconPrefix().split(' ');
    prefixClasses.forEach(cls => icon.classList.add(cls));

    // Add icon classes
    iconClasses.forEach(cls => icon.classList.add(cls));
  });
}
```

## Font Awesome Features

### Style Families

- **Classic**: `fa-solid`, `fa-regular`, `fa-light`, `fa-thin`
- **Duotone**: `fa-duotone` (Pro only)
- **Sharp**: `fa-sharp-solid`, `fa-sharp-regular`, etc. (Pro only)

### Icon Modifiers

- **Animations**: `fa-spin`, `fa-pulse`, `fa-beat`, `fa-shake`
- **Transforms**: `fa-rotate-90`, `fa-flip-horizontal`
- **Effects**: `fa-swap-opacity`, `fa-stack`, `fa-inverse`

### Advanced Features

```json
{
  "icons": {
    "ui": {
      "loadingSpinner": ["fa-atom", "fa-spin"],
      "warningFlag": ["fa-flag", "fa-beat"],
      "invertedIcon": ["fa-moon", "fa-inverse"]
    }
  }
}
```

## Browser Compatibility

### Font Awesome Free

- **All Browsers**: Full support
- **CDN**: `cdnjs.cloudflare.com`
- **Version**: 6.4.0 (locked for stability)

### Font Awesome Pro

- **Kit Required**: Personal/Enterprise license
- **CORS**: Requires `crossorigin="anonymous"`
- **Fallback**: Graceful degradation to Free version

## Development Workflow

### Testing Configurations

1. **Free Version Test**:

```json
{
  "fontAwesomeKit": "",
  "icons": {}
}
```

1. **Pro Version Test**:

```json
{
  "fontAwesomeKit": "your-kit-code",
  "fontAwesomeStyle": "fa-sharp-duotone",
  "icons": {
    "pieces": {
      "trebuchet": "fa-meteor"
    }
  }
}
```

1. **Advanced Features Test**:

```json
{
  "fontAwesomeKit": "your-kit-code",
  "fontAwesomeStyle": "fa-sharp-duotone fa-solid",
  "icons": {
    "ui": {
      "whiteSpinner": ["fa-atom-simple", "fa-spin"],
      "resignGame": ["fa-flag", "fa-swap-opacity"]
    }
  }
}
```

### Icon Preview

Use the Font Awesome icon browser: <https://fontawesome.com/icons>

### Debugging

```javascript
// Check current configuration
console.log('FA Config:', FA_CONFIG);

// Test icon resolution
console.log('King icon:', getPieceIcon('king'));
console.log('Spinner icon:', getUIIcon('whiteSpinner'));
```

## Performance Considerations

### Loading Strategy

- **Conditional Loading**: Only loads required version (Free/Pro)
- **Async Loading**: Non-blocking script execution
- **Caching**: Leverages browser/CDN caching

### Bundle Size

- **Free Version**: ~100KB CSS
- **Pro Kit**: ~50KB JavaScript + dynamic icon loading
- **Custom Icons**: Minimal additional overhead

## Security Considerations

### Kit Code Protection

- **Gitignore**: `metric-chess.json` is gitignored
- **Environment Variables**: Consider using build-time injection
- **Access Control**: Limit kit code exposure

### Content Security Policy

```javascript
// For Pro kits
script-src 'self' https://kit.fontawesome.com

// For Free version
style-src 'self' https://cdnjs.cloudflare.com
```

## Migration Guide

### From Hardcoded Icons

```javascript
// Old: Hardcoded in HTML
<i class="fa-solid fa-chess-king"></i>

// New: Data attribute driven
<i data-icon="king"></i>
```

### From Single Icons to Arrays

```javascript
// Old: Single class
"resignGame": "fa-flag"

// New: Array support
"resignGame": ["fa-flag", "fa-swap-opacity"]
```

This configuration system provides maximum flexibility while maintaining backward compatibility and graceful degradation.
