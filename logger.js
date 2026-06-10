const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    white: '\x1b[97m',
    gray: '\x1b[90m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    bBlue: '\x1b[94m',
    bCyan: '\x1b[96m',
    bGreen: '\x1b[92m',
    bYellow: '\x1b[93m',
    bRed: '\x1b[91m',
    bMagenta: '\x1b[95m',
    bWhite: '\x1b[97m',
};

const c = (code, str) => `${code}${str}${C.reset}`;
const bold = str => c(C.bold, str);
const dim = str => c(C.dim, str);
const blue = str => c(C.bBlue, str);
const cyan = str => c(C.bCyan, str);
const green = str => c(C.bGreen, str);
const yellow = str => c(C.bYellow, str);
const red = str => c(C.bRed, str);
const magenta = str => c(C.bMagenta, str);
const gray = str => c(C.gray, str);
const white = str => c(C.bWhite, str);

const PREFIX = {
    info: blue('◆'),
    success: green('✔'),
    warn: yellow('⚠'),
    error: red('✖'),
    event: magenta('▸'),
    server: cyan('⚡'),
    file: gray('~'),
    ready: green('●'),
};

function ts() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return dim(`[${hh}:${mm}:${ss}]`);
}

const logger = {
    info: (...a) => console.log(`  ${PREFIX.info}  ${a.join(' ')}`),
    success: (...a) => console.log(`  ${PREFIX.success}  ${a.join(' ')}`),
    warn: (...a) => console.warn(`  ${PREFIX.warn}  ${a.join(' ')}`),
    error: (...a) => console.error(`  ${PREFIX.error}  ${a.join(' ')}`),
    event: (...a) => console.log(`  ${ts()} ${PREFIX.event}  ${a.join(' ')}`),
    server: (...a) => console.log(`  ${PREFIX.server}  ${a.join(' ')}`),
    file: (...a) => console.log(`  ${ts()} ${PREFIX.file}  ${a.join(' ')}`),
    ready: (...a) => console.log(`  ${PREFIX.ready}  ${bold(a.join(' '))}`),
    blank: () => console.log(),
    rule: () => console.log(`  ${gray('─'.repeat(52))}`),
    label: (k, v) => console.log(`  ${blue('◆')}  ${dim(k.padEnd(12))} ${white(v)}`),
};

module.exports = { logger, c, bold, dim, blue, cyan, green, yellow, red, magenta, gray, white };