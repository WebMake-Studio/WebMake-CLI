const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const { CliError } = require('../utils/cli');

function writeFileOnce(filePath, content) {
    if (fs.existsSync(filePath)) return false;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    return true;
}

module.exports = function init(flags = {}) {
    const name = flags.name || flags._[0] || 'webmake-site';
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
        throw new CliError(`Invalid project name: ${name}`, {
            hint: 'Use only letters, numbers, dots, dashes, or underscores.',
            example: 'webmake init --name=my-site',
        });
    }

    const target = path.resolve(process.cwd(), flags.dir || name);
    const existingFiles = fs.existsSync(target) ? fs.readdirSync(target) : [];

    if (existingFiles.length > 0) {
        throw new CliError(`Target directory is not empty: ${target}`, {
            hint: 'Choose another --name or --dir to avoid overwriting files.',
            example: 'webmake init --name=my-new-site',
        });
    }

    fs.mkdirSync(target, { recursive: true });

    const files = [
        ['index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name}</title>
  <link rel="stylesheet" href="./assets/style.css">
</head>
<body>
  <main>
    <h1>${name}</h1>
    <p>Your WebMake project is ready.</p>
  </main>
  <script src="./assets/app.js"></script>
</body>
</html>
`],
        ['assets/style.css', `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172033;
  background: #f4f7fb;
}

main {
  text-align: center;
}
`],
        ['assets/app.js', `console.log('WebMake project ready');
`],
        ['webmake.config.js', `module.exports = {
  dir: '.',
  out: './dist',
  port: 3000,
  host: '127.0.0.1',
  spa: false,
};
`],
    ];

    let created = 0;
    for (const [fileName, content] of files) {
        if (writeFileOnce(path.join(target, fileName), content)) created += 1;
    }

    logger.success(`Created ${created} files in ${target}`);
    logger.info(`Next: cd ${path.relative(process.cwd(), target) || '.'}`);
    logger.info('Then: webmake dev --dir=.');
};

module.exports.writeFileOnce = writeFileOnce;
