const path = require('path');
const chokidar = require('chokidar');

function toArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function createWatcher(dir, options = {}) {
    const root = path.resolve(process.cwd(), dir || '.');
    const ignored = [
        '**/.git/**',
        '**/node_modules/**',
        ...toArray(options.ignored),
    ];

    return chokidar.watch(root, {
        ignoreInitial: options.ignoreInitial !== false,
        ignored,
        persistent: true,
        usePolling: Boolean(options.poll),
        interval: options.interval || 100,
        binaryInterval: options.binaryInterval || 300,
        awaitWriteFinish: {
            stabilityThreshold: options.stabilityThreshold || 80,
            pollInterval: 40,
        },
    });
}

module.exports = { createWatcher };
