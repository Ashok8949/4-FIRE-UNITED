import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/festive-universe.js', import.meta.url), 'utf8');

function harness({ search = '', config = null, now = Date.parse('2026-11-14T00:00:00Z'), reduced = false } = {}) {
  let clock = now;
  let nextTimer = 1;
  const timers = new Map();
  const storage = new Map();
  class Element {
    constructor(tag) {
      this.tagName = tag; this.children = []; this.attributes = {}; this.style = { setProperty() {} };
      this.className = ''; this.id = ''; this.textContent = ''; this.innerHTML = ''; this.parent = null;
      this.classList = {
        add: name => { this._classes ??= new Set(); this._classes.add(name); },
        remove: name => this._classes?.delete(name),
        contains: name => !!this._classes?.has(name),
        forEach: fn => (this._classes ?? new Set()).forEach(fn),
        [Symbol.iterator]: () => (this._classes ?? new Set()).values()
      };
    }
    setAttribute(k, v) { this.attributes[k] = v; }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    append(...items) { items.forEach(item => this.appendChild(item)); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  }
  const html = new Element('html');
  const body = new Element('body');
  function find(node, id) {
    if (node.id === id) return node;
    for (const child of node.children) { const hit = find(child, id); if (hit) return hit; }
    return null;
  }
  const listeners = {};
  const document = {
    readyState: 'complete', visibilityState: 'visible', documentElement: html, body,
    createElement: tag => new Element(tag), getElementById: id => find(body, id),
    addEventListener: (name, fn) => { (listeners[name] ??= []).push(fn); }
  };
  const window = {
    location: { search }, matchMedia: () => ({ matches: reduced }),
    setTimeout: (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, at: clock + delay }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  class FakeDate extends Date { static now() { return clock; } }
  const db = { collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: !!config, data: () => ({ festival: config }) }) }) }) };
  const context = {
    window, document, db, Date: FakeDate, URLSearchParams, console,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    Math, Promise
  };
  vm.runInNewContext(source, context);
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  async function advance(ms) {
    const target = clock + ms;
    while (true) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, timer] = due; timers.delete(id); clock = timer.at; timer.fn(); await flush();
    }
    clock = target; await flush();
  }
  return { html, body, document, storage, timers, advance, flush, listeners };
}

test('manual activation renders the selected theme', async () => {
  const h = harness({ config: { enabled: true, mode: 'manual', festival: 'diwali' } });
  await h.flush();
  assert.equal(h.html.classList.contains('fu-festival-diwali'), true);
  assert.ok(h.document.getElementById('fourfu-festival-layer'));
  assert.ok(h.document.getElementById('fourfu-festival-rangoli'));
});

test('scheduled festival activates at start and is removed at the exclusive end', async () => {
  const start = Date.parse('2026-11-14T00:01:00Z');
  const end = Date.parse('2026-11-14T00:02:00Z');
  const h = harness({ now: start - 1000, config: { enabled: true, mode: 'scheduled', festival: 'holi', startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString() } });
  await h.flush();
  assert.equal(h.html.classList.contains('fu-festival-holi'), false);
  await h.advance(1020);
  assert.equal(h.html.classList.contains('fu-festival-holi'), true);
  await h.advance(end - (start + 20) + 20);
  assert.equal(h.html.classList.contains('fu-festival-holi'), false);
  assert.equal(h.document.getElementById('fourfu-festival-layer'), null);
});

test('expired or malformed schedules never activate', async () => {
  const h = harness({ config: { enabled: true, mode: 'scheduled', festival: 'eid', startAt: 'bad', endAt: 'also-bad' } });
  await h.flush();
  assert.equal(h.html.classList.contains('fu-festival-eid'), false);
  assert.equal(h.document.getElementById('fourfu-festival-layer'), null);
});

test('preview is read-only with respect to live Firestore and welcome session state', async () => {
  const h = harness({ search: '?festivalPreview=christmas', config: { enabled: true, mode: 'manual', festival: 'diwali' } });
  await h.flush();
  assert.equal(h.html.classList.contains('fu-festival-christmas'), true);
  assert.equal(h.html.classList.contains('fu-festival-diwali'), false);
  assert.equal(h.storage.size, 0);
});

test('reduced-motion preference keeps the theme but omits animated particles', async () => {
  const h = harness({ reduced: true, config: { enabled: true, mode: 'manual', festival: 'newyear' } });
  await h.flush();
  const layer = h.document.getElementById('fourfu-festival-layer');
  assert.ok(layer);
  assert.equal(layer.children.length, 0);
  assert.equal(h.html.classList.contains('fu-festival-newyear'), true);
});

test('each festival gets its own once-per-session welcome message', async () => {
  const h = harness({ config: { enabled: true, mode: 'manual', festival: 'eid' } });
  await h.flush();
  assert.equal(h.storage.get('fu-festival-welcomed:eid'), '1');
  assert.equal(h.document.getElementById('fourfu-festival-toast')?.textContent.startsWith('🌙'), true);
});
