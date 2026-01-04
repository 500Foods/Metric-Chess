// Stockfish Worker Wrapper - Main thread interface for web worker communication
// This class replaces the direct ffish.js calls with worker-based communication

class StockfishWorker {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.onReadyCallback = null;
        this.moveCallback = null;
        this.thinking = false;
        this.requestId = 0;
        this.pendingRequests = {};
        this.fallbackMode = false;
        
        // Initialize the worker
        this.init();
    }

    init() {
        try {
            // Check if workers are supported
            if (!window.Worker) {
                console.warn('Web Workers not supported, falling back to main thread');
                this.fallbackMode = true;
                return;
            }

            // Create the worker (classic worker, not module) with cache busting
            const cacheBust = Date.now();
            this.worker = new Worker(`/js/stockfish/metric-stockfish-worker.js?v=${cacheBust}`, {
                name: 'metric-stockfish-worker'
            });

            // Set up message handler
            this.worker.onmessage = (e) => {
                this.handleWorkerMessage(e);
            };

            // Set up error handler
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                this.handleWorkerError(error);
            };

            // Send initialization message
            this.sendMessage({ type: 'init' });

        } catch (error) {
            console.error('Failed to initialize worker:', error);
            this.fallbackMode = true;
        }
    }

    handleWorkerMessage(e) {
        const message = e.data;
        
        if (!message || !message.type) {
            console.error('Invalid worker message:', message);
            return;
        }

        console.log('Main thread received:', message.type, message);

        switch (message.type) {
            case 'ready':
                this.handleReadyMessage(message);
                break;
                
            case 'bestmove':
                this.handleBestMoveMessage(message);
                break;
                
            case 'info':
                this.handleInfoMessage(message);
                break;
                
            case 'error':
                this.handleErrorMessage(message);
                break;
                
            default:
                console.warn('Unknown worker message type:', message.type);
        }
    }

    handleReadyMessage(message) {
        this.isReady = true;
        console.log('Worker ready:', message.data);
        
        if (this.onReadyCallback) {
            this.onReadyCallback();
        }
    }

    handleBestMoveMessage(message) {
        this.thinking = false;
        
        if (message.data && message.data.bestmove) {
            const uciMove = message.data.bestmove;
            console.log('Worker best move:', uciMove);
            
            // Parse UCI move and call callback
            if (this.moveCallback) {
                const move = this.parseUCIMove(uciMove);
                this.moveCallback(move);
            }
        } else {
            console.warn('No valid best move from worker');
            this.fallbackToMainThread();
        }
    }

    handleInfoMessage(message) {
        console.log('Worker info:', message.data);
        // Could update UI with search info if needed
    }

    handleErrorMessage(message) {
        console.error('Worker error:', message.data);
        this.thinking = false;
        
        // If there's a pending move callback, call it with null to trigger fallback
        if (this.moveCallback) {
            const callback = this.moveCallback;
            this.moveCallback = null;
            callback({ fromFile: NaN, fromRank: NaN, toFile: NaN, toRank: NaN });
        }
    }

    handleWorkerError(error) {
        console.error('Worker fatal error:', error);
        this.thinking = false;
        
        // Don't immediately go to fallback mode - the worker might still be usable
        // Check if we have a pending callback
        if (this.moveCallback) {
            const callback = this.moveCallback;
            this.moveCallback = null;
            // Return invalid move to trigger fallback in the integration layer
            callback({ fromFile: NaN, fromRank: NaN, toFile: NaN, toRank: NaN });
        }
        
        // Only terminate if the error is truly fatal
        if (error.message && error.message.includes('Module is not a function')) {
            console.error('WASM load failed, terminating worker');
            this.fallbackMode = true;
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
        }
    }

    fallbackToMainThread() {
        console.warn('Falling back to main thread implementation');
        this.fallbackMode = true;
        
        // If we have a pending move request, try to fulfill it
        if (this.moveCallback) {
            // This would need to use the original StockfishEngine fallback
            console.error('Main thread fallback not yet implemented');
        }
    }

    sendMessage(message, callback) {
        if (!this.worker) {
            console.error('Worker not available');
            return;
        }

        // Add request ID for tracking
        this.requestId++;
        const request = {
            ...message,
            id: this.requestId.toString()
        };

        if (callback) {
            this.pendingRequests[request.id] = callback;
        }

        console.log('Sending to worker:', request.type, request);
        this.worker.postMessage(request);
    }

    // Public API methods (matching original StockfishEngine interface)
    
    onReady(callback) {
        this.onReadyCallback = callback;
        if (this.isReady) {
            callback();
        }
    }

    setPosition(fen) {
        if (this.fallbackMode) {
            console.warn('Worker fallback mode - setPosition not implemented');
            return;
        }

        if (!this.isReady) {
            console.warn('Worker not ready for setPosition');
            return;
        }

        this.sendMessage({
            type: 'setPosition',
            data: { fen: fen }
        });
    }

    getLegalMoves() {
        // This would need worker support or fallback
        console.warn('getLegalMoves not implemented in worker mode');
        return [];
    }

    makeMove(move) {
        // This would need worker support or fallback  
        console.warn('makeMove not implemented in worker mode');
        return false;
    }

    getFen() {
        // This would need worker support or fallback
        console.warn('getFen not implemented in worker mode');
        return null;
    }

    isGameOver() {
        // This would need worker support or fallback
        console.warn('isGameOver not implemented in worker mode');
        return false;
    }

    getResult() {
        // This would need worker support or fallback
        console.warn('getResult not implemented in worker mode');
        return '*';
    }

    go(timeLimitMs = 3000, callback) {
        if (this.fallbackMode) {
            console.warn('Worker fallback mode - using main thread');
            // Would need to implement main thread fallback here
            return;
        }

        if (!this.isReady) {
            console.warn('Worker not ready for go command');
            return;
        }

        if (this.thinking) {
            console.warn('Worker already thinking');
            return;
        }

        this.thinking = true;
        this.moveCallback = callback;

        this.sendMessage({
            type: 'go',
            data: { timeLimit: timeLimitMs }
        });
    }

    stop() {
        if (this.worker && this.thinking) {
            this.sendMessage({ type: 'stop' });
            this.thinking = false;
        }
    }

    quit() {
        if (this.worker) {
            this.sendMessage({ type: 'quit' });
            this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
    }

    parseUCIMove(uciMove) {
        // Parse UCI move format for 10x10 boards
        // Files: a-j = 0-9, Ranks: 1-10 = 0-9
        // Examples: "a1b2", "c10d8", "e5f7"
        // The move can be 4-6 characters: a1b2 (4), a10b2 (5), a10b10 (6), a1b10 (5)
        
        if (!uciMove || uciMove.length < 4) {
            console.error('Invalid UCI move format (too short):', uciMove);
            return { fromFile: NaN, fromRank: NaN, toFile: NaN, toRank: NaN };
        }

        // Use regex to parse the move
        // Match: (file a-j)(rank 1-10)(file a-j)(rank 1-10)(optional promotion piece)
        const match = uciMove.match(/^([a-j])(\d{1,2})([a-j])(\d{1,2})([qrbnck])?$/);
        if (!match) {
            console.error('Invalid UCI move format:', uciMove);
            return { fromFile: NaN, fromRank: NaN, toFile: NaN, toRank: NaN };
        }

        const fromFile = match[1].charCodeAt(0) - 'a'.charCodeAt(0);  // a=0, b=1, ..., j=9
        const fromRank = parseInt(match[2]) - 1;  // 1=0, 2=1, ..., 10=9
        const toFile = match[3].charCodeAt(0) - 'a'.charCodeAt(0);
        const toRank = parseInt(match[4]) - 1;
        const promotion = match[5] || null;

        // Validate ranks are in range 0-9
        if (fromRank < 0 || fromRank > 9 || toRank < 0 || toRank > 9) {
            console.error('Invalid rank in UCI move:', uciMove, { fromRank, toRank });
            return { fromFile: NaN, fromRank: NaN, toFile: NaN, toRank: NaN };
        }

        console.log('Parsed UCI move:', { fromFile, fromRank, toFile, toRank, promotion });
        return { fromFile, fromRank, toFile, toRank, promotion };
    }

    // Fallback methods for when worker fails
    // These would need to be implemented if we want true backward compatibility
}

export default StockfishWorker;