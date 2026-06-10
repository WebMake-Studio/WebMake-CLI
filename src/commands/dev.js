const { loadConfig } = require('../utils/config');
const { createLiveReload } = require('../core/livereload');
const { createServer } = require('../core/server');
const { createWatcher } = require('../core/watcher');
const { logger, bold, blue, cyan, dim, green, magenta, white } = require('../utils/logger');
const { ensureDirectory, parseBool, parsePort, printError, CliError } = require('../utils/cli');

const PANEL_WIDTH = 78;
const WEBMAKE_WORDMARK = [
    '██╗    ██╗███████╗██████╗ ███╗   ███╗ █████╗ ██╗  ██╗███████╗',
    '██║    ██║██╔════╝██╔══██╗████╗ ████║██╔══██╗██║ ██╔╝██╔════╝',
    '██║ █╗ ██║█████╗  ██████╔╝██╔████╔██║███████║█████╔╝ █████╗  ',
    '██║███╗██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██╔═██╗ ██╔══╝  ',
    '╚███╔███╔╝███████╗██████╔╝██║ ╚═╝ ██║██║  ██║██║  ██╗███████╗',
    ' ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝',
];

function stripAnsi(value) {
    return String(value).replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLength(value) {
    return stripAnsi(value).length;
}

function fit(value, width) {
    const text = String(value);
    const length = visibleLength(text);
    if (length <= width) return text + ' '.repeat(width - length);
    const plain = stripAnsi(text);
    return plain.slice(0, Math.max(0, width - 1)) + '…';
}

function panelLine(content = '') {
    const innerWidth = PANEL_WIDTH - 4;
    console.log(`  ${magenta('|')} ${fit(content, innerWidth)} ${magenta('|')}`);
}

function panelRule(top = false) {
    const cornerLeft = top ? '.' : '\'';
    const cornerRight = top ? '.' : '\'';
    console.log(`  ${magenta(cornerLeft + '-'.repeat(PANEL_WIDTH - 2) + cornerRight)}`);
}

function prettyPath(filePath) {
    const path = require('path');
    const relative = path.relative(process.cwd(), filePath);
    if (!relative) return '.';
    return !relative.startsWith('..') ? `.${path.sep}${relative}` : filePath;
}

function padLabel(label) {
    return dim(String(label).padEnd(12));
}

function statusPill(label, active = true) {
    return active ? green(label) : dim(label);
}

function statusLine(label, value, active = true) {
    const dot = active ? blue('*') : dim('*');
    return `${dot} ${white(label.padEnd(13))} ${value}`;
}

function printDevPanel(state) {
    logger.blank();
    panelRule(true);
    panelLine(`${dim('Welcome to')} ${blue(bold('WebMake'))} ${dim('command-line studio')}`);
    panelLine();
    for (const line of WEBMAKE_WORDMARK) {
        panelLine(blue(line));
    }
    panelLine();
    panelLine(`${dim('Serve, watch and preview static sites with Netlify-style routing.')}`);
    panelLine();
    panelLine(statusLine('Local URL', cyan(state.url)));
    panelLine(statusLine('Serving', white(prettyPath(state.rootDir))));
    panelLine(statusLine('Watching', white(prettyPath(state.watchedDir))));
    panelLine(statusLine('Live reload', statusPill('enabled')));
    panelLine(statusLine('Netlify', statusPill(`${state.redirectCount} rules`, state.redirectCount > 0), state.redirectCount > 0));
    if (state.spa) panelLine(statusLine('SPA fallback', statusPill('enabled')));
    if (state.poll) panelLine(statusLine('Polling', statusPill('enabled')));
    panelLine(statusLine('Indexed', `${white(`${state.fileCount} files`)} ${dim(`in ${state.folderCount} folders`)}`));
    panelLine();
    panelLine(`${dim('Ctrl+C')} ${white('stop')}  ${dim('|')}  ${dim('Edit files to reload the browser')}`);
    panelRule(false);
    logger.blank();
}

function openBrowser(url) {
    const { spawn } = require('child_process');
    const command = process.platform === 'win32'
        ? 'cmd'
        : process.platform === 'darwin'
            ? 'open'
            : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
}

module.exports = function dev(flags = {}) {
    const config = loadConfig(flags.config);
    const port = parsePort(flags.port || config.port || 3000);
    const host = flags.host || config.host || '127.0.0.1';
    const dir = flags.dir || config.dir || '.';
    const watchDir = flags.watch || config.watch || dir;
    const spa = parseBool(flags.spa ?? config.spa, 'spa');
    const poll = parseBool(flags.poll ?? config.poll, 'poll');
    const shouldOpen = parseBool(flags.open ?? config.open, 'open');
    const rootDir = ensureDirectory(dir, 'Directory to serve');
    const watchedDir = ensureDirectory(watchDir, 'Directory to watch');
    const liveReload = createLiveReload();

    const server = createServer({
        dir: rootDir,
        host,
        port,
        spa,
        liveReload,
    });

    const watcher = createWatcher(watchedDir, {
        ignoreInitial: true,
        ignored: config.ignore,
        poll,
    });
    const readyState = {
        server: false,
        watcher: false,
        url: null,
        rootDir,
        watchedDir,
        redirectCount: 0,
        fileCount: 0,
        folderCount: 0,
        spa,
        poll,
        printed: false,
    };

    function maybePrintReady() {
        if (readyState.printed || !readyState.server || !readyState.watcher) return;
        readyState.printed = true;
        printDevPanel(readyState);
        if (shouldOpen) openBrowser(readyState.url);
    }

    watcher.on('all', (event, filePath) => {
        logger.file(`${event}: ${filePath}`);
        liveReload.reload(filePath);
    });

    watcher.on('ready', () => {
        const watched = watcher.getWatched();
        const folderCount = Object.keys(watched).length;
        const fileCount = Object.values(watched).reduce((total, files) => total + files.length, 0);
        readyState.watcher = true;
        readyState.fileCount = fileCount;
        readyState.folderCount = folderCount;
        maybePrintReady();
    });

    watcher.on('error', error => {
        printError(new CliError('File watcher failed.', {
            hint: error.message,
        }));
    });

    server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        readyState.server = true;
        readyState.url = url;
        readyState.rootDir = server.rootDir;
        readyState.redirectCount = server.redirectRules.length;
        maybePrintReady();
    });

    server.on('error', error => {
        const cliError = error.code === 'EADDRINUSE'
            ? new CliError(`Port ${port} is already in use.`, {
                hint: 'Stop the other process or choose another port.',
                example: 'webmake dev --port=3001',
            })
            : error.code === 'EACCES'
                ? new CliError(`Permission denied for ${host}:${port}.`, {
                    hint: 'Try a port above 1024, for example --port=3000.',
                })
                : error;

        printError(cliError);
        process.exit(cliError.code || 1);
    });

    let stopping = false;
    const shutdown = async () => {
        if (stopping) return;
        stopping = true;

        logger.blank();
        console.log(`  ${blue('WebMake')} ${dim('Stopping studio...')}`);
        await watcher.close();
        await liveReload.close();

        const closed = new Promise(resolve => {
            const close = typeof server.closeNow === 'function' ? server.closeNow.bind(server) : server.close.bind(server);
            close(resolve);
        });

        await Promise.race([
            closed,
            new Promise(resolve => setTimeout(resolve, 500)),
        ]);

        console.log(`  ${green('done')} ${dim('Server stopped')}`);
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};
