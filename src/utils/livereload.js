const WebSocket = require('ws');

const CLIENT_SCRIPT = `
<script>
(() => {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(protocol + '://' + location.host + '/__webmake_livereload');
  socket.addEventListener('message', event => {
    if (event.data === 'reload') location.reload();
  });
})();
</script>`;

function createLiveReload() {
    let wss = null;
    let timer = null;

    return {
        path: '/__webmake_livereload',
        attach(server) {
            wss = new WebSocket.Server({ server, path: this.path });
        },
        inject(html) {
            if (typeof html !== 'string') return html;
            if (html.includes('/__webmake_livereload')) return html;
            return html.includes('</body>')
                ? html.replace('</body>', `${CLIENT_SCRIPT}\n</body>`)
                : `${html}\n${CLIENT_SCRIPT}`;
        },
        reload() {
            if (!wss) return;
            clearTimeout(timer);
            timer = setTimeout(() => {
                for (const client of wss.clients) {
                    if (client.readyState === WebSocket.OPEN) client.send('reload');
                }
            }, 50);
        },
        close() {
            clearTimeout(timer);
            if (!wss) return Promise.resolve();
            for (const client of wss.clients) {
                client.terminate();
            }
            return new Promise(resolve => {
                wss.close(() => resolve());
            });
        },
    };
}

module.exports = { CLIENT_SCRIPT, createLiveReload };
