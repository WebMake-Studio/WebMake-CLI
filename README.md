# WebMake CLI

WebMake CLI is a small local toolkit for static web projects. It provides a dev server with live reload, a simple production build command, and a project initializer.

## Installation

```bash
npm install
npm link
```

After linking, the `webmake` command is available from your terminal.

## Commands

```bash
webmake dev --dir=./public --watch=. --port=3000
webmake build --dir=./public --out=./dist
webmake init --name=my-site
```

## Options

- `--dir=./public`: directory to serve or build.
- `--out=./dist`: build output directory.
- `--port=3000`: dev server port.
- `--host=127.0.0.1`: dev server host.
- `--spa`: serve `index.html` for unknown routes.
- `--open`: open the dev server in the default browser.
- `--watch=.`: directory watched recursively for live reload.
- `--poll`: use polling when native file events miss changes.
- `--config=webmake.config.js`: load defaults from a config file.

## Friendly Errors

WebMake CLI validates user input before running commands. It prints readable messages for common problems like unknown options, missing config files, invalid ports, missing folders, invalid project names, busy ports, and non-empty init targets.

## Cleaning Broken Build Outputs

If an older build created nested output folders like `dist/dist/dist`, use the Windows cleanup helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\clean-build-output.ps1 -Path "F:\path\to\your\site\dist"
```

The build command now excludes its own output folder, even when `--out` is inside `--dir`.

## Netlify-style Routing

The dev server supports pretty URLs and basic Netlify redirects:

- `/about` serves `/about.html` when it exists.
- `/docs` serves `/docs/index.html` when it exists.
- `_redirects` rules like `/login /auth/login.html 200` are loaded.
- `netlify.toml` `[[redirects]]` blocks with `from`, `to`, and `status` are loaded.
- A catch-all rule like `/* /public/404.html 404` serves the custom 404 page.

Example `_redirects`:

```text
/login /auth/login.html 200
/register /auth/register.html 200
/reset-password /auth/reset-password.html 200
/auth/callback /auth/callback.html 200
/account /account/index.html 200
/logout /public/logout.html 200
/* /public/404.html 404
```

Example `netlify.toml`:

```toml
[[redirects]]
  from = "/login"
  to = "/auth/login.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/public/404.html"
  status = 404
```

## Config File

Create `webmake.config.js` at the project root:

```js
module.exports = {
  dir: './public',
  out: './dist',
  port: 3000,
  host: '127.0.0.1',
  watch: '.',
  poll: false,
  spa: false,
};
```
