// Font Awesome Configuration Loader for Metric Chess

// Default fallback values
let FA_CONFIG = {
  kitCode: null,
  stylePrefix: 'fa-solid',  // Always works with free icons
  icons: {
    pieces: {
      king: 'fa-chess-king',
      heir: 'fa-chess-king',
      queen: 'fa-chess-queen',
      rook: 'fa-chess-rook',
      bishop: 'fa-chess-bishop',
      knight: 'fa-chess-knight',
      pawn: 'fa-chess-pawn',
      trebuchet: 'fa-meteor'
    },
    ui: {
      whiteSpinner: 'fa-atom',
      blackSpinner: 'fa-atom',
      newGame: 'fa-plus-circle',
      resetGame: 'fa-refresh',
      undoMove: 'fa-undo',
      redoMove: 'fa-redo',
      resignGame: 'fa-flag',
      rotateLeft: 'fa-arrow-left',
      rotateRight: 'fa-arrow-right',
      toggleAudio: 'fa-volume-up',
      chessBoard: 'fa-chess-board',
      trebuchetFeature: 'fa-meteor',
      heirFeature: 'fa-crown',
      aiFeature: 'fa-brain',
      undoFeature: 'fa-undo',
      responsiveFeature: 'fa-mobile-alt',
      customBoard: 'fa-screwdriver-wrench',
      themePalette: 'fa-palette'
    }
  }
};

// Function to load and apply Font Awesome config
export async function loadFontAwesomeConfig() {
  try {
    const response = await fetch('metric-chess.json');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const config = await response.json();

    // Only override if a valid kit code is provided
    if (config.fontAwesomeKit && typeof config.fontAwesomeKit === 'string' && config.fontAwesomeKit.trim()) {
      FA_CONFIG.kitCode = config.fontAwesomeKit.trim();
      FA_CONFIG.stylePrefix = config.fontAwesomeStyle?.trim() || 'fa-duotone'; // fallback to basic duotone if not specified

      // Load the Pro kit script
      const script = document.createElement('script');
      script.src = `https://kit.fontawesome.com/${FA_CONFIG.kitCode}.js`;
      script.crossOrigin = 'anonymous';
      script.async = true;

      // Optional: log success/failure
      script.onload = () => console.log('Font Awesome Pro kit loaded:', FA_CONFIG.stylePrefix);
      script.onerror = () => console.warn('Failed to load Font Awesome kit');

      document.head.appendChild(script);
    } else {
      console.log('No valid Font Awesome kit found in config — using free icons');
      // Ensure we use fa-solid for free icons, ignoring any fontAwesomeStyle in config
      FA_CONFIG.stylePrefix = 'fa-solid';
      // Load free Font Awesome CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }

    // Only merge icon overrides from config if a valid kit is provided
    if (config.fontAwesomeKit && typeof config.fontAwesomeKit === 'string' && config.fontAwesomeKit.trim()) {
      if (config.icons) {
        if (config.icons.pieces) {
          // Normalize icon definitions to handle both string and array formats
          const normalizedPieces = {};
          for (const [key, value] of Object.entries(config.icons.pieces)) {
            normalizedPieces[key] = Array.isArray(value) ? value : [value];
          }
          FA_CONFIG.icons.pieces = { ...FA_CONFIG.icons.pieces, ...normalizedPieces };
        }
        if (config.icons.ui) {
          // Normalize icon definitions to handle both string and array formats
          const normalizedUI = {};
          for (const [key, value] of Object.entries(config.icons.ui)) {
            normalizedUI[key] = Array.isArray(value) ? value : [value];
          }
          FA_CONFIG.icons.ui = { ...FA_CONFIG.icons.ui, ...normalizedUI };
        }
      }
    }
  } catch (err) {
    console.log('No metric-chess.json found or error loading it — using free Font Awesome');
    // Load free Font Awesome CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
    // FA_CONFIG remains at defaults
  }

  // Return the final config for use elsewhere
  return FA_CONFIG;
}

// Export functions
export function getFAIconPrefix() {
  return FA_CONFIG.stylePrefix;
}

export function getPieceIcon(pieceType) {
  const icon = FA_CONFIG.icons.pieces[pieceType] || 'fa-question';
  return Array.isArray(icon) ? icon : [icon];
}

export function getUIIcon(uiKey) {
  const icon = FA_CONFIG.icons.ui[uiKey] || FA_CONFIG.icons.pieces[uiKey] || 'fa-question';
  return Array.isArray(icon) ? icon : [icon];
}

// Make available globally for backward compatibility
window.getFAIconPrefix = getFAIconPrefix;
window.getPieceIcon = getPieceIcon;
window.getUIIcon = getUIIcon;