const commands = {
    dev: () => require('../src/commands/dev')(flags),
    build: () => require('../src/commands/build')(flags),
    init: () => require('../src/commands/init')(flags),
    deploy: () => require('../src/commands/deploy')(flags),
};

const { printBanner } = require('../src/utils/banner');
const { COMMANDS, CliError, parseArgs, printError, printHelp, validateOptions } = require('../src/utils/cli');

let cmd;
let flags;

try {
    const parsed = parseArgs(process.argv.slice(2));
    cmd = parsed.command;
    flags = parsed.flags;
} catch (error) {
    printError(error);
    process.exit(error.code || 1);
}

if (!cmd || cmd === '--help' || cmd === 'help') {
    printBanner();
    printHelp();
    process.exit(0);
}

if (cmd === '--version' || cmd === '-v') {
    console.log(require('../package.json').version);
    process.exit(0);
}

if (flags.help) {
    printHelp(cmd);
    process.exit(0);
}

if (!COMMANDS[cmd] || !commands[cmd]) {
    printError(new CliError(`Unknown command: ${cmd}`, {
        hint: 'Run webmake --help to see available commands.',
        example: 'webmake dev --dir=./public',
    }));
    process.exit(1);
}

try {
    validateOptions(cmd, flags);
    commands[cmd]();
} catch (error) {
    printError(error);
    process.exit(error.code || 1);
}
