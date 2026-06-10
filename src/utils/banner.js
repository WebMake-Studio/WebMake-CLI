const { bold, blue, dim, gray, magenta } = require('./logger');
const { version } = require('../../package.json');

const ART = [
    '██╗    ██╗███████╗██████╗ ███╗   ███╗ █████╗ ██╗  ██╗███████╗',
    '██║    ██║██╔════╝██╔══██╗████╗ ████║██╔══██╗██║ ██╔╝██╔════╝',
    '██║ █╗ ██║█████╗  ██████╔╝██╔████╔██║███████║█████╔╝ █████╗  ',
    '██║███╗██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██╔═██╗ ██╔══╝  ',
    '╚███╔███╔╝███████╗██████╔╝██║ ╚═╝ ██║██║  ██║██║  ██╗███████╗',
    ' ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝',
].join('\n');

function printBanner() {
    console.log('\n' + blue(ART));
    console.log(`  ${bold('WebMake CLI')} ${dim('v' + version)}  ${magenta('Local dev server & build toolkit')}`);
    console.log(`  ${gray('Rafael ISTE / FarTekTV')}\n`);
}

module.exports = { printBanner };
