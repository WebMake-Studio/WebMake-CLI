const fs = require('fs');
const path = require('path');

const CANDIDATES = [
    'public',
    'dist',
    'build',
    'web',
    'www',
    'site',
];

function hasIndexHtml(dir) {
    return fs.existsSync(path.join(dir, 'index.html'));
}

function detectProject(root = process.cwd()) {
    const resolvedRoot = path.resolve(root);

    if (hasIndexHtml(resolvedRoot)) {
        return { root: resolvedRoot, dir: resolvedRoot, type: 'static' };
    }

    for (const name of CANDIDATES) {
        const candidate = path.join(resolvedRoot, name);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return {
                root: resolvedRoot,
                dir: candidate,
                type: hasIndexHtml(candidate) ? 'static' : 'directory',
            };
        }
    }

    return { root: resolvedRoot, dir: resolvedRoot, type: 'unknown' };
}

module.exports = { detectProject, hasIndexHtml };
