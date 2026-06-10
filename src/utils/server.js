const fs = require('fs');
const http = require('http');
const path = require('path');
const { findRedirect, loadRedirects } = require('./redirects');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
};

function safeJoin(root, requestPath) {
    const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
    const normalized = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
    const target = path.join(root, normalized);
    const relative = path.relative(root, target);
    return relative && (relative.startsWith('..') || path.isAbsolute(relative)) ? root : target;
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, headers);
    res.end(body);
}

function fileExists(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function resolveRequestFile(rootDir, requestPath, options = {}) {
    let filePath = safeJoin(rootDir, requestPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (fileExists(filePath)) return filePath;

    const ext = path.extname(filePath);
    if (!ext) {
        const htmlFile = `${filePath}.html`;
        const indexFile = path.join(filePath, 'index.html');

        if (fileExists(htmlFile)) return htmlFile;
        if (fileExists(indexFile)) return indexFile;
    }

    if (options.spa) {
        const spaFile = path.join(rootDir, 'index.html');
        if (fileExists(spaFile)) return spaFile;
    }

    return null;
}

function serveFile(filePath, res, status = 200, liveReload) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (ext === '.html' && liveReload) {
        const html = fs.readFileSync(filePath, 'utf8');
        send(res, status, liveReload.inject(html), { 'content-type': contentType });
        return;
    }

    res.writeHead(status, { 'content-type': contentType });
    fs.createReadStream(filePath).pipe(res);
}

function createServer(options = {}) {
    const rootDir = path.resolve(process.cwd(), options.dir || '.');
    const liveReload = options.liveReload;
    const sockets = new Set();
    const redirectRules = loadRedirects(rootDir);

    const server = http.createServer((req, res) => {
        const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
        const redirect = findRedirect(redirectRules, urlPath, { catchAll: false });

        if (redirect && redirect.status >= 300 && redirect.status < 400) {
            send(res, redirect.status, '', { location: redirect.target });
            return;
        }

        if (redirect) {
            const redirectedFile = resolveRequestFile(rootDir, redirect.target, { spa: false });
            if (redirectedFile) {
                serveFile(redirectedFile, res, redirect.status, liveReload);
                return;
            }
        }

        const filePath = resolveRequestFile(rootDir, urlPath, { spa: options.spa });
        if (filePath) {
            serveFile(filePath, res, 200, liveReload);
            return;
        }

        const catchAll = findRedirect(redirectRules, urlPath, { catchAll: true });
        if (catchAll) {
            const catchAllFile = resolveRequestFile(rootDir, catchAll.target, { spa: false });
            if (catchAllFile) {
                serveFile(catchAllFile, res, catchAll.status, liveReload);
                return;
            }
        }

        if (options.spa) {
            const spaFile = resolveRequestFile(rootDir, '/index.html', { spa: false });
            if (spaFile) {
                serveFile(spaFile, res, 200, liveReload);
                return;
            }
        }

        const default404 = resolveRequestFile(rootDir, '/404.html', { spa: false });
        if (default404) {
            serveFile(default404, res, 404, liveReload);
            return;
        }

        send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
    });

    server.rootDir = rootDir;
    server.redirectRules = redirectRules;
    server.on('connection', socket => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
    });

    server.closeNow = function closeNow(callback) {
        if (typeof server.closeAllConnections === 'function') {
            server.closeAllConnections();
        } else {
            for (const socket of sockets) socket.destroy();
        }
        server.close(callback);
    };

    if (liveReload) liveReload.attach(server);
    return server;
}

module.exports = { MIME_TYPES, createServer, resolveRequestFile, safeJoin };
