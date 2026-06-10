const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../utils/config');
const { logger } = require('../utils/logger');
const { CliError, ensureDirectory } = require('../utils/cli');

const DEFAULT_IGNORES = new Set([
    '.git',
    'node_modules',
    '.DS_Store',
    'Thumbs.db',
]);

function shouldIgnore(name, extraIgnores) {
    return DEFAULT_IGNORES.has(name) || extraIgnores.has(name);
}

function isSameOrInside(parent, candidate) {
    const relative = path.relative(parent, candidate);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function copyDir(source, target, options = {}) {
    const ignores = new Set(Array.isArray(options.ignore) ? options.ignore : [options.ignore].filter(Boolean));
    const excludedPaths = (options.excludePaths || []).map(excluded => path.resolve(excluded));
    fs.mkdirSync(target, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        if (shouldIgnore(entry.name, ignores)) continue;

        const from = path.join(source, entry.name);
        const to = path.join(target, entry.name);
        const resolvedFrom = path.resolve(from);

        if (excludedPaths.some(excluded => isSameOrInside(excluded, resolvedFrom))) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDir(from, to, options);
            continue;
        }

        if (entry.isFile()) {
            fs.copyFileSync(from, to);
        }
    }
}

module.exports = function build(flags = {}) {
    const config = loadConfig(flags.config);
    const root = process.cwd();
    const source = ensureDirectory(flags.dir || config.dir || '.', 'Source directory');
    const target = path.resolve(root, flags.out || config.out || 'dist');

    if (source === target) {
        throw new CliError('Build output cannot be the same as the source directory.', {
            hint: 'Choose a different --out folder.',
            example: 'webmake build --dir=./public --out=./dist',
        });
    }

    if (target === root) {
        throw new CliError('Build output cannot be the project root.', {
            hint: 'Choose a dedicated output folder.',
            example: 'webmake build --out=./dist',
        });
    }

    if (isSameOrInside(target, source)) {
        throw new CliError('Build output cannot contain the source directory.', {
            hint: 'This would delete or copy the project into itself.',
            example: 'webmake build --dir=./public --out=./dist',
        });
    }

    fs.rmSync(target, { recursive: true, force: true });
    copyDir(source, target, {
        ignore: config.ignore,
        excludePaths: [target],
    });

    logger.success(`Built ${source} -> ${target}`);
};

module.exports.copyDir = copyDir;
module.exports.isSameOrInside = isSameOrInside;
