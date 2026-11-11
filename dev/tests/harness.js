// Harnais jsdom pour La Permanence
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
const ROOT = process.env.LP_ROOT || path.resolve(__dirname, "..", "..");
const NM = path.join(__dirname, "..", "node_modules");

function makeCtx() {
  const noop = () => {};
  return new Proxy({}, { get: (t, k) => {
    if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4), width: w, height: h });
    if (k === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
    if (k === "measureText") return () => ({ width: 5 });
    if (k === "canvas") return { width: 256, height: 96 };
    if (k in t) return t[k];
    return noop;
  }, set: (t, k, v) => { t[k] = v; return true; } });
}

function boot(opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push("jsdomError: " + (e.stack || e.message)));
  vc.on("error", (...a) => { const m = a.map(String).join(" "); if (!/Warning:/.test(m) || opts.warnings) errors.push("console.error: " + m); });
  vc.on("warn", (...a) => { if (opts.verbose) console.log("warn:", ...a); });
  vc.on("log", (...a) => { if (opts.verbose) console.log("log:", ...a); });
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  html = html.replace(/<script src="https:[^"]+"><\/script>/g, "").replace(/<link[^>]+>/g, "");
  const local = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
  html = html.replace(/<script src="js\/[^"]+"><\/script>/g, "");
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + html + "</body></html>", { runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc, url: "https://example.org/" });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = function () { return makeCtx(); };
  w.HTMLCanvasElement.prototype.toDataURL = () => "";
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
  w.scrollTo = () => {};
  w.Element.prototype.scrollIntoView = function () {};
  const run = (file) => { try { w.eval(fs.readFileSync(file, "utf8") + "\n//# sourceURL=" + path.basename(file)); } catch (e) { errors.push("load " + file + ": " + (e.stack || e)); } };
  run(path.join(NM, "react/umd/react.development.js"));
  run(path.join(NM, "react-dom/umd/react-dom.development.js"));
  run(path.join(NM, "htm/dist/htm.umd.js"));
  for (const f of local) run(path.join(ROOT, f));
  return { dom, w, CR: w.CR, doc: w.document, errors };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function texts(el) { return (el.textContent || "").replace(/\s+/g, " ").trim(); }
function findBtn(doc, re, root) {
  const all = [...(root || doc).querySelectorAll("button")];
  return all.find((b) => (re instanceof RegExp ? re.test(texts(b)) : texts(b).includes(re)) && !b.disabled);
}
async function click(w, el) {
  if (!el) throw new Error("élément introuvable");
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await sleep(30);
}
module.exports = { boot, sleep, texts, findBtn, click };
