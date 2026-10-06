// Builds dist/index.html: a single self-contained file (styles, adapters and app inlined).
// Usage: node build.mjs        (no dependencies)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');
const safe = (js) => js.replace(/<\/script/gi, '<\\/script'); // never let inlined JS close the tag

const modules = readdirSync(join(root, 'src/js')).filter((f) => f.endsWith('.js')).sort();
const adapters = readdirSync(join(root, 'src/adapters')).filter((f) => f.endsWith('.js')).sort();
// Config comes from src/config.js (local), or from FS42_SUPABASE_URL and FS42_SUPABASE_KEY (hosting builds), or stays empty (demo mode).
let config;
if (existsSync(join(root, 'src/config.js'))) config = read('src/config.js');
else if (process.env.FS42_SUPABASE_URL && process.env.FS42_SUPABASE_KEY) {
  config = 'window.FS42_CONFIG = ' + JSON.stringify({ supabaseUrl: process.env.FS42_SUPABASE_URL, supabaseAnonKey: process.env.FS42_SUPABASE_KEY }) + ';';
} else config = 'window.FS42_CONFIG = {};';
// Default logo, inlined so the build stays a single file. Replace src/assets/logo.png to rebrand.
if (existsSync(join(root, 'src/assets/logo.png'))) {
  config += `\nwindow.FS42_DEFAULT_LOGO = 'data:image/png;base64,${readFileSync(join(root, 'src/assets/logo.png')).toString('base64')}';`;
}

const app = "(function(){\n'use strict';\n" + modules.map((f) => `/* ===== ${f} ===== */\n` + read('src/js/' + f)).join('\n') + '\n})();';
const out = read('src/index.html')
  .replace('/* @styles */', () => read('src/styles.css'))
  .replace('/* @config */', () => safe(config))
  .replace('/* @adapters */', () => safe(adapters.map((f) => read('src/adapters/' + f)).join('\n')))
  .replace('/* @app */', () => safe(app));

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), out);
console.log(`Built dist/index.html (${(out.length / 1024).toFixed(0)} KB) from ${modules.length} modules and ${adapters.length} adapters.`);
