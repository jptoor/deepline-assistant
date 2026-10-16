// Build script: bundles TS entrypoints with esbuild and writes manifest.json.
// TEST_BUILD=1 builds unminified with inline sourcemaps into dist-test/.
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const isTest = process.env.TEST_BUILD === "1";
const outdir = resolve(isTest ? "dist-test" : "dist");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const manifest = {
  manifest_version: 3,
  name: "Deepline Assistant",
  short_name: "Deepline",
  version: pkg.version,
  description: "Run your team's Deepline plays on any LinkedIn profile, company, search, CRM record or website. Results land in your Deepline table.",
  minimum_chrome_version: "116",
  // storage: settings. sidePanel: the panel. tabs: the active tab's URL and
  // title, which is the only page input. No content scripts, no page access,
  // nothing a site can detect.
  permissions: ["storage", "sidePanel", "tabs"],
  host_permissions: ["https://code.deepline.com/*"],
  // Requested only when Settings points at a local Deepline.
  optional_host_permissions: ["http://localhost/*", "http://127.0.0.1/*"],
  background: { service_worker: "background.js", type: "module" },
  action: { default_title: "Deepline Assistant" },
  side_panel: { default_path: "sidepanel.html" },
  commands: { _execute_action: { suggested_key: { default: "Alt+Shift+D" }, description: "Open Deepline Assistant" } },
  icons: { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
};
writeFileSync(resolve(outdir, "manifest.json"), JSON.stringify(manifest, null, 2));

await build({
  entryPoints: {
    background: "src/background/service-worker.ts",
    sidepanel: "src/sidepanel/sidepanel.ts"
  },
  bundle: true,
  format: "esm",
  target: "chrome116",
  outdir,
  sourcemap: isTest ? "inline" : false,
  minify: !isTest,
  define: {
    __EXTENSION_VERSION__: JSON.stringify(pkg.version),
  },
  logLevel: "info"
});

for (const f of ["src/sidepanel/sidepanel.html"]) {
  cpSync(f, resolve(outdir, f.split("/").pop()));
}
cpSync("src/icons", resolve(outdir, "icons"), { recursive: true });
cpSync("src/brand", resolve(outdir, "brand"), { recursive: true });
cpSync("src/fonts", resolve(outdir, "fonts"), { recursive: true });
console.log(`built -> ${outdir}`);
