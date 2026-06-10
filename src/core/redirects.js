const fs = require('fs');
const path = require('path');

function cleanPath(value) {
    if (!value) return '/';
    const [pathname] = String(value).split('?');
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function unquote(value) {
    return String(value || '').trim().replace(/^["']|["']$/g, '');
}

function parseStatus(value, fallback = 301) {
    const status = Number(value);
    return Number.isInteger(status) ? status : fallback;
}

function parseRedirectsFile(content, source) {
    return content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [from, to, status] = line.split(/\s+/);
            if (!from || !to) return null;
            return {
                from: cleanPath(from),
                to: cleanPath(to),
                status: parseStatus(status),
                source,
            };
        })
        .filter(Boolean);
}

function parseNetlifyToml(content, source) {
    const redirects = [];
    let current = null;

    function pushCurrent() {
        if (current && current.from && current.to) {
            redirects.push({
                from: cleanPath(current.from),
                to: cleanPath(current.to),
                status: parseStatus(current.status),
                source,
            });
        }
    }

    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        if (/^\[\[redirects\]\]$/.test(line)) {
            pushCurrent();
            current = {};
            continue;
        }

        if (/^\[\[.+\]\]$/.test(line) || /^\[.+\]$/.test(line)) {
            pushCurrent();
            current = null;
            continue;
        }

        if (!current) continue;

        const match = line.match(/^([A-Za-z_]+)\s*=\s*(.+)$/);
        if (!match) continue;
        current[match[1]] = unquote(match[2]);
    }

    pushCurrent();
    return redirects;
}

function loadRedirects(rootDir) {
    const rules = [];
    const redirectsPath = path.join(rootDir, '_redirects');
    const tomlPath = path.join(rootDir, 'netlify.toml');

    if (fs.existsSync(redirectsPath)) {
        rules.push(...parseRedirectsFile(fs.readFileSync(redirectsPath, 'utf8'), '_redirects'));
    }

    if (fs.existsSync(tomlPath)) {
        rules.push(...parseNetlifyToml(fs.readFileSync(tomlPath, 'utf8'), 'netlify.toml'));
    }

    return rules;
}

function isCatchAll(rule) {
    return rule.from === '/*';
}

function matchRule(rule, requestPath) {
    const pathname = cleanPath(requestPath);

    if (rule.from === pathname) {
        return { ...rule, target: rule.to };
    }

    if (rule.from.endsWith('*')) {
        const prefix = rule.from.slice(0, -1);
        if (!pathname.startsWith(prefix)) return null;
        const splat = pathname.slice(prefix.length);
        const target = rule.to
            .replace(':splat', splat)
            .replace('*', splat);
        return { ...rule, target: cleanPath(target) };
    }

    return null;
}

function findRedirect(rules, requestPath, options = {}) {
    for (const rule of rules) {
        if (options.catchAll === false && isCatchAll(rule)) continue;
        if (options.catchAll === true && !isCatchAll(rule)) continue;

        const match = matchRule(rule, requestPath);
        if (match) return match;
    }

    return null;
}

module.exports = {
    cleanPath,
    findRedirect,
    loadRedirects,
    parseNetlifyToml,
    parseRedirectsFile,
};
