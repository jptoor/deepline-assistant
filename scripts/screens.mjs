// Screenshots of every panel state: builds a preview copy of dist/ with the
// stub (scripts/preview/stub.js) and captures each state with headless Chrome.
//   npm run build && node scripts/screens.mjs [--dark]
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dark = process.argv.includes("--dark");
const out = resolve("docs/screens");
const preview = resolve("dist-preview");
rmSync(preview, { recursive: true, force: true });
cpSync("dist", preview, { recursive: true });
cpSync("scripts/preview/stub.js", resolve(preview, "stub.js"));
const html = readFileSync(resolve(preview, "sidepanel.html"), "utf8").replace('<script type="module" src="sidepanel.js">', '<script src="stub.js"></script><script type="module" src="sidepanel.js">');
writeFileSync(resolve(preview, "sidepanel.html"), html);
// Headless Chrome won't size a window below ~500px, so the panel renders in a 360px frame and the shot is cropped to it.
writeFileSync(resolve(preview, "frame.html"), `<!doctype html><style>html,body{margin:0;background:${dark ? "#111110" : "#ffffff"}}iframe{display:block;width:360px;height:760px;border:0}</style><iframe id="f"></iframe><script>f.src="sidepanel.html"+location.search</script>`);
mkdirSync(out, { recursive: true });

const states = ["signed-out", "setup-needed", "person-new", "person-working", "person-found-handoff", "person-handoff-done", "person-found-copy", "person-nothing", "salesnav-lead", "company", "search", "search-confirm", "crm", "lookups", "no-actions"];
for (const s of states) {
  const file = resolve(out, `${s}${dark ? "-dark" : ""}.png`);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=2", "--window-size=600,760", "--virtual-time-budget=4000", `--blink-settings=preferredColorScheme=${dark ? 0 : 1}`, ...(dark ? ["--force-dark-mode"] : []), `--screenshot=${file}`, `file://${preview}/frame.html?state=${s}`], { stdio: "ignore" });
  execFileSync("python3", ["-c", "import sys;from PIL import Image;i=Image.open(sys.argv[1]);i.crop((0,0,720,1520)).save(sys.argv[1])", file]);
  console.log(file);
}
