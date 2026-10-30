// Audit einer Microsite: axe (WCAG 2.2 AA), horizontales Überlaufen, Screenshots,
// Schaltflächengrößen, Rendern ohne JavaScript.
// node audit.mjs <url> [outdir]
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axeSrc = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const url = process.argv[2];
const out = process.argv[3] || ".";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/usr/bin/chromium" });
const views = [
  { name: "phone-320", width: 320, height: 640 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
const report = { url, axe: {}, overflow: {}, smallTargets: {}, noJs: {}, console: [] };

for (const scheme of ["light", "dark"]) {
  for (const v of views) {
    const ctx = await browser.newContext({ viewport: v, colorScheme: scheme, reducedMotion: "reduce", bypassCSP: true });
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") report.console.push(`${v.name}/${scheme}: ${m.text()}`); });
    page.on("pageerror", (e) => report.console.push(`${v.name}/${scheme}: ${e.message}`));
    await page.goto(url, { waitUntil: "networkidle" });
    const key = `${v.name}/${scheme}`;
    report.overflow[key] = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const bad = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        let inScroller = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
          if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) { inScroller = true; break; }
        if (!inScroller && r.width && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== "absolute")
          bad.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} → ${Math.round(r.right)}px`);
      }
      return { scrollWidth: document.documentElement.scrollWidth, clientWidth: w, elements: bad.slice(0, 10) };
    });
    report.smallTargets[key] = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll("button, input, summary, [role=tab], a:not(p a):not(li a):not(dd a):not(h2 a):not(h3 a)")) {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && (r.width < 24 || r.height < 24)) bad.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return bad;
    });
    if (v.name === "phone-390" || v.name === "desktop-1440") {
      await page.addScriptTag({ content: axeSrc });
      const res = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
        return r.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, nodes: x.nodes.slice(0, 5).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\n").slice(1, 2).join("")) }));
      });
      report.axe[key] = res;
      await page.screenshot({ path: `${out}/${v.name}-${scheme}.png` });
    }
    await ctx.close();
  }
}

// Verhalten: Suche findet Text in verborgenen Tabs, ?q= wirkt, Filter, Design-Umschalter.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  const b = {};
  b.scrollYAfterLoad = await page.evaluate(() => scrollY); // muss 0 sein: nichts darf beim Laden springen
  const hiddenPanels = await page.$$eval("[role=tabpanel][hidden]", (x) => x.map((e) => e.id));
  b.tabsEnhanced = hiddenPanels.length > 0;
  if (hiddenPanels.length) {
    const last = hiddenPanels[hiddenPanels.length - 1];
    const word = await page.$eval("#" + last + " p", (p) => p.textContent.trim().split(/\s+/).find((w) => w.length > 9).replace(/[^\p{L}-]/gu, ""));
    await page.fill("#q", word); await page.waitForTimeout(400);
    b.searchWord = word;
    b.searchHits = await page.textContent("#hitcount");
    b.hiddenTabRevealedBySearch = await page.$eval("#" + last, (e) => !e.hidden);
  }
  await page.fill("#q", "");
  await page.goto(url.replace(/\/?$/, "/") + "?q=Evaluation", { waitUntil: "networkidle" });
  b.queryParamHits = await page.$$eval("mark.hit", (m) => m.length);
  const filter = await page.$("input[id$=filter]");
  if (filter) {
    await filter.fill("zzzzqq"); await page.waitForTimeout(100);
    b.filterEmptyShown = await page.$$eval(".empty", (e) => e.some((x) => !x.hidden));
  }
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click("#theme");
  b.themeToggleChangesBg = before !== (await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
  b.errors = errors;
  report.behaviour = b;
  await ctx.close();
}

// Ohne JavaScript: was sieht ein Agent, der kein JS ausführt?
const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(url);
report.noJs = await page.evaluate(() => ({
  hiddenElements: [...document.querySelectorAll("[hidden]")].map((e) => e.id || e.tagName).slice(0, 20),
  visibleTextChars: document.body.innerText.length,
  allTextChars: document.body.textContent.replace(/\s+/g, " ").length,
}));
await ctx.close();
await browser.close();
console.log(JSON.stringify(report, null, 2));
