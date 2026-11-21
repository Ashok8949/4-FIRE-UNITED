import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFile(path.join(folder, name), "utf8");
const [html, css, js, readme] = await Promise.all([
  read("index.html"),
  read("assets/diwaliverse.css"),
  read("assets/diwaliverse.js"),
  read("README.md")
]);

test("page links to its local stylesheet and script", () => {
  assert.match(html, /href="assets\/diwaliverse\.css"/);
  assert.match(html, /src="assets\/diwaliverse\.js"/);
});

test("every JavaScript element lookup exists in the page", () => {
  const ids = [...js.matchAll(/byId\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.ok(ids.length > 0, "expected interactive element lookups");
  const missing = [...new Set(ids)].filter((id) => !html.includes('id="' + id + '"'));
  assert.deepEqual(missing, []);
});

test("the preview does not send or persist personal data", () => {
  assert.match(js, /event\.preventDefault\(\)/);
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/);
  assert.match(readme, /not shared across visitors/);
  assert.match(readme, /not submitted or published/);
});

test("accessibility motion preferences and focus styles are present", () => {
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(html, /class="skip-link"/);
});

test("greeting card export and invitation sharing are implemented", () => {
  assert.match(js, /toBlob/);
  assert.match(js, /diwaliverse-greeting\.png/);
  assert.match(js, /navigator\.share/);
  assert.match(js, /clipboard\.writeText/);
});

test("illustrative wish content is clearly labelled", () => {
  assert.match(html, /Sample message/);
  assert.match(readme, /illustrative content/);
});
