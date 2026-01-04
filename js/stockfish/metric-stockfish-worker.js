// Metric Chess Fairy-Stockfish Web Worker
// Uses full Fairy-Stockfish WASM engine with NNUE and multithreading support

// Worker state
let engine = null;
let isReady = false;
let currentRequestId = null;
let currentFen = null;
let outputBuffer = [];

// Message types
const MESSAGE_TYPES = {
    INIT: 'init',
    SET_POSITION: 'setPosition',
    GO: 'go',
    STOP: 'stop',
    QUIT: 'quit'
};

// Response types
const RESPONSE_TYPES = {
    READY: 'ready',
    BESTMOVE: 'bestmove',
    INFO: 'info',
    ERROR: 'error'
};

// Metric Chess variant definition for Fairy-Stockfish
// The trebuchet moves to any square where max(|dx|, |dy|) = 3 (Chebyshev distance)
// In Betza notation: We need a custom piece that jumps distance 3
const METRIC_CHESS_VARIANT_INI = `
# Metric Chess - 10x10 variant with trebuchets
# Trebuchet: moves exactly Chebyshev distance 3 (jumping piece)
# Range 3 for leaper in Chebyshev = all squares with max(dx,dy)=3

[metricchess:chess]
maxRank = 10
maxFile = 10
startFen = trnbqkbnrt/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/TRNBQKBNRT w KQkq - 0 1
pieceToCharTable = PNBRQ..............Kpnbrq..............k.......T.......t
pocketSize = 0
promotionRank = 10
promotionPieceTypes = qrbnkt
doubleStep = true
doubleStepRank = 2
doubleStepRankMin = 2
castling = true
castlingKingsideFile = h
castlingQueensideFile = c
# Trebuchet: leaper that moves exactly distance 3 (Chebyshev)
# Using Betza: (3,0), (3,1), (3,2), (3,3), etc. - all jumps with max 3
# The "M" prefix means "make" (captures same as moves)
# W3 = Wazir extended 3 (orthogonal 3)
# F3 = Ferz extended 3 (diagonal 3)
# N  = Knight (2,1 leap)
# Custom: Need (3,0), (0,3), (3,1), (1,3), (3,2), (2,3), (3,3) leaps
# In Betza compound: (3,0)+(3,1)+(3,2)+(3,3) = W3+mabW3+mdabW3+mA3
customPiece1 = t:m(3,0)m(0,3)m(3,1)m(1,3)m(3,2)m(2,3)m(3,3)
`;

// Initialize the Fairy-Stockfish engine
async function initializeEngine() {
    try {
        console.log('Worker: Loading Fairy-Stockfish WASM engine...');

        // Determine the base path for stockfish files
        // Try multiple paths since the location differs between dev and production
        let stockfishBasePath = '/stockfish/';
        let stockfishScriptPath = '/stockfish/stockfish.js';
        
        // Import the stockfish.js script
        // In the dist build, fairy-stockfish files are in /stockfish/ (from public/)
        // The pthreads worker (stockfish.worker.js) needs to be in the same directory as stockfish.js
        try {
            importScripts('/stockfish/stockfish.js');
            console.log('Worker: stockfish.js loaded from /stockfish/');
            stockfishBasePath = '/stockfish/';
            stockfishScriptPath = '/stockfish/stockfish.js';
        } catch (e1) {
            console.log('Worker: Failed to load from /stockfish/, trying alternative path...', e1.message);
            try {
                // Try the js/stockfish path as fallback
                importScripts('/js/stockfish/stockfish.js');
                console.log('Worker: stockfish.js loaded from /js/stockfish/');
                stockfishBasePath = '/js/stockfish/';
                stockfishScriptPath = '/js/stockfish/stockfish.js';
            } catch (e2) {
                console.error('Worker: Failed to load stockfish.js from any path', e1.message, e2.message);
                throw new Error('Could not load stockfish.js: ' + e1.message);
            }
        }

        console.log('Worker: stockfish.js loaded, initializing engine...');

        // Configure the module before initialization
        // This is crucial for pthreads to work correctly
        // The mainScriptUrlOrBlob tells pthread workers where to find the main script
        // The locateFile helps the engine find its WASM and worker files
        const moduleConfig = {
            mainScriptUrlOrBlob: stockfishScriptPath,
            locateFile: function(path) {
                console.log('Worker: locateFile called for:', path);
                // Return the full path for requested files
                if (path.endsWith('.wasm')) {
                    return stockfishBasePath + 'stockfish.wasm';
                }
                if (path.endsWith('.worker.js')) {
                    return stockfishBasePath + 'stockfish.worker.js';
                }
                return stockfishBasePath + path;
            }
        };

        // Stockfish() returns a promise that resolves to the engine instance
        // Pass the module config to enable proper pthread worker spawning
        console.log('Worker: Initializing engine with config:', moduleConfig);
        engine = await Stockfish(moduleConfig);

        console.log('Worker: Engine instance created');

        // Try to write custom variant configuration to the virtual filesystem
        if (engine.FS) {
            try {
                console.log('Worker: Writing metricchess variant to virtual filesystem...');
                engine.FS.writeFile('/variants.ini', METRIC_CHESS_VARIANT_INI);
                console.log('Worker: Custom variant file written successfully');
            } catch (fsError) {
                console.warn('Worker: Could not write variant file:', fsError.message);
            }
        }

        // Set up message listener using the addMessageListener API
        engine.addMessageListener(handleEngineMessage);

        // Initialize UCI mode
        sendEngineCommand('uci');

    } catch (error) {
        console.error('Worker: Engine initialization error:', error);
        postError('Engine initialization error: ' + error.message, null);
    }
}

// Send command to engine
function sendEngineCommand(cmd) {
    if (engine && engine.postMessage) {
        console.log('Worker -> Engine:', cmd);
        engine.postMessage(cmd);
    } else {
        console.error('Worker: Engine not ready for command:', cmd);
    }
}

// Handle engine messages (UCI output)
function handleEngineMessage(message) {
    console.log('Engine -> Worker:', message);
    outputBuffer.push(message);

    if (message === 'uciok') {
        // UCI mode initialized, configure the Metric Chess variant
        console.log('Worker: UCI OK received, configuring Metric Chess variant...');
        
        // Load custom variant file if we wrote it to the virtual filesystem
        sendEngineCommand('setoption name VariantPath value /variants.ini');
        
        // Try to use our custom metricchess variant
        // If it fails, the engine will use chess as fallback
        sendEngineCommand('setoption name UCI_Variant value metricchess');
        
        // Enable NNUE for strong evaluation (if available in this build)
        sendEngineCommand('setoption name Use NNUE value true');
        
        // Hash size for better move quality (256 MB)
        sendEngineCommand('setoption name Hash value 256');
        
        // Multi-threading configuration
        // pthreads in WASM require:
        // 1. SharedArrayBuffer support (check with typeof SharedArrayBuffer !== 'undefined')
        // 2. COOP/COEP headers (configured in vite.config.js)
        // 3. The pthread worker (stockfish.worker.js) to properly handle urlOrBlob
        //
        // We use 75% of available CPU cores to leave resources for the UI and other tasks
        // This provides a good balance between search strength and system responsiveness
        const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
        const cpuCores = navigator.hardwareConcurrency || 2;
        // Use 75% of cores, rounded down, with minimum of 1 and reasonable max of 8
        const targetThreads = Math.max(1, Math.floor(cpuCores * 0.75));
        const threads = hasSharedArrayBuffer ? Math.min(targetThreads, 8) : 1;
        sendEngineCommand(`setoption name Threads value ${threads}`);
        console.log('Worker: Configured with', threads, 'of', cpuCores, 'available threads (75%)', hasSharedArrayBuffer ? '(SharedArrayBuffer available)' : '(no SharedArrayBuffer)');
        
        // Request ready confirmation
        sendEngineCommand('isready');
        
    } else if (message === 'readyok') {
        isReady = true;
        console.log('Worker: Engine ready!');
        postMessage({
            type: RESPONSE_TYPES.READY,
            data: { message: 'Fairy-Stockfish engine ready' }
        });

    } else if (message.startsWith('bestmove')) {
        // Parse bestmove response
        const parts = message.trim().split(' ');
        const bestMove = parts[1];
        const requestId = currentRequestId;

        console.log('Worker: Best move found:', bestMove);

        // Extract score from buffered info lines
        let score = null;
        let depth = null;
        for (let i = outputBuffer.length - 1; i >= 0; i--) {
            const line = outputBuffer[i];
            if (line.startsWith('info') && line.includes('score')) {
                const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
                if (scoreMatch) {
                    if (scoreMatch[1] === 'cp') {
                        score = parseInt(scoreMatch[2]) / 100; // Convert centipawns to pawns
                    } else if (scoreMatch[1] === 'mate') {
                        score = scoreMatch[2][0] === '-' ? -10000 : 10000;
                    }
                }
                const depthMatch = line.match(/depth (\d+)/);
                if (depthMatch) {
                    depth = parseInt(depthMatch[1]);
                }
                break;
            }
        }

        postMessage({
            type: RESPONSE_TYPES.BESTMOVE,
            data: {
                bestmove: bestMove,
                score: score,
                depth: depth
            },
            id: requestId
        });

        currentRequestId = null;
        outputBuffer = [];

    } else if (message.startsWith('info')) {
        // Forward info messages for progress tracking
        // Parse interesting details
        if (message.includes('depth') && message.includes('pv')) {
            const depthMatch = message.match(/depth (\d+)/);
            const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
            const pvMatch = message.match(/pv (.+)$/);
            
            if (depthMatch) {
                postMessage({
                    type: RESPONSE_TYPES.INFO,
                    data: {
                        depth: parseInt(depthMatch[1]),
                        score: scoreMatch ? parseInt(scoreMatch[2]) / 100 : null,
                        pv: pvMatch ? pvMatch[1] : null
                    },
                    id: currentRequestId
                });
            }
        }
    } else if (message.startsWith('option')) {
        // Log available options for debugging
        console.log('Worker: Available option:', message);
    }
}

// Handle incoming messages from main thread
self.onmessage = function(e) {
    try {
        const message = e.data;

        if (!message || !message.type) {
            postError('Invalid message format', null);
            return;
        }

        console.log('Worker received:', message.type, message);

        switch (message.type) {
            case MESSAGE_TYPES.INIT:
                handleInit(message);
                break;

            case MESSAGE_TYPES.SET_POSITION:
                handleSetPosition(message);
                break;

            case MESSAGE_TYPES.GO:
                handleGo(message);
                break;

            case MESSAGE_TYPES.STOP:
                handleStop(message);
                break;

            case MESSAGE_TYPES.QUIT:
                handleQuit(message);
                break;

            default:
                postError('Unknown message type: ' + message.type, message.id);
        }

    } catch (error) {
        postError('Message handling error: ' + error.message, null);
    }
};

// Message handlers
function handleInit(message) {
    if (isReady) {
        postMessage({
            type: RESPONSE_TYPES.READY,
            data: { alreadyInitialized: true }
        });
    } else if (!engine) {
        // Start initialization if not already started
        initializeEngine();
    }
}

function handleSetPosition(message) {
    if (!isReady || !engine) {
        postError('Worker not ready', message.id);
        return;
    }

    try {
        let fen = message.data.fen || 'trnbqkbnrt/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/TRNBQKBNRT w - - 0 1';
        
        // Store the original FEN
        currentFen = fen;

        // With our custom metricchess variant loaded, the engine should understand
        // trebuchets (t/T) directly. No conversion needed!
        // If the custom variant failed to load, the engine will still accept
        // the FEN but may not understand the 't' pieces correctly
        
        console.log('Worker: Setting position:', fen);
        sendEngineCommand(`position fen ${fen}`);

        postMessage({
            type: RESPONSE_TYPES.INFO,
            data: {
                fen: fen,
                message: 'Position set successfully'
            },
            id: message.id
        });

    } catch (error) {
        postError('Set position error: ' + error.message, message.id);
    }
}

function handleGo(message) {
    if (!isReady || !engine) {
        postError('Worker not ready', message.id);
        return;
    }

    try {
        const timeLimit = message.data.timeLimit || 3000;
        currentRequestId = message.id;
        outputBuffer = [];

        console.log('Worker: Starting search with time limit:', timeLimit, 'ms');

        // Send go command with time limit
        sendEngineCommand(`go movetime ${timeLimit}`);

    } catch (error) {
        postError('Search error: ' + error.message, message.id);
    }
}

function handleStop(message) {
    if (engine) {
        sendEngineCommand('stop');
    }

    if (currentRequestId === message.id) {
        currentRequestId = null;
    }

    postMessage({
        type: RESPONSE_TYPES.INFO,
        data: { message: 'Search stopped' },
        id: message.id
    });
}

function handleQuit(message) {
    if (engine) {
        sendEngineCommand('quit');
        engine = null;
    }

    currentRequestId = null;
    currentFen = null;
    isReady = false;
    outputBuffer = [];

    postMessage({
        type: RESPONSE_TYPES.INFO,
        data: { message: 'Worker quit successfully' },
        id: message.id
    });
}

// Utility functions
function postError(message, requestId) {
    console.error('Worker error:', message);
    
    postMessage({
        type: RESPONSE_TYPES.ERROR,
        data: { message: message },
        id: requestId
    });
}

// Start initialization when worker is loaded
console.log('Metric Stockfish Worker: Starting initialization...');
initializeEngine();
