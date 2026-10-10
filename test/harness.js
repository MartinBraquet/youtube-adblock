// Loads utils.js and content.js into a jsdom window the same way Firefox does for content scripts: both files
// run as classic scripts sharing one global scope, so nothing in the add-on has to be restructured for tests.
const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = ['utils.js', 'content.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'));

// Minimal stand-in for browser.storage.local: callback based get/set over a plain object.
class LocalStorageMock {
    constructor(initial = {}) {
        this.data = {...initial};
    }

    get(keys, callback) {
        const result = {};
        for (const key of Array.isArray(keys) ? keys : [keys]) {
            if (key in this.data) result[key] = this.data[key];
        }
        if (callback) callback(result);
        return Promise.resolve(result);
    }

    set(items, callback) {
        Object.assign(this.data, items);
        if (callback) callback();
        return Promise.resolve();
    }
}

/**
 * Creates a jsdom page at `url`, with the given body html, loads the add-on scripts in it and returns the window.
 * `window.messages` collects the runtime messages the add-on sends; `window.intervals` the callbacks it schedules
 * with setInterval (they are not started, tests drive the checks by calling window.checkForAds()).
 */
function loadAddon({url = 'https://www.youtube.com/watch?v=abc', html = '', storage = {}} = {}) {
    const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {url, runScripts: 'outside-only', pretendToBeVisual: true});
    const window = dom.window;
    window.messages = [];
    window.intervals = [];
    window.timeouts = [];
    window.storage = new LocalStorageMock(storage);
    window.browser = {
        storage: {local: window.storage},
        runtime: {sendMessage: (m) => window.messages.push(m)},
    };
    window.setInterval = (fn, ms) => { window.intervals.push({fn, ms}); return window.intervals.length; };
    window.setTimeout = (fn, ms, ...args) => { window.timeouts.push({fn, ms, args}); return window.timeouts.length; };
    // Fake clock: tests move time with window.clock.
    window.clock = 1_000_000;
    window.Date = class extends Date { static now() { return window.clock; } };
    // jsdom does not implement media playback: give <video> the few properties the add-on reads and writes.
    Object.defineProperties(window.HTMLMediaElement.prototype, {
        paused: {get() { return this._paused === undefined ? true : this._paused; }, set(v) { this._paused = v; }, configurable: true},
        duration: {get() { return this._duration || 0; }, set(v) { this._duration = v; }, configurable: true},
        currentTime: {get() { return this._currentTime || 0; }, set(v) { this._currentTime = v; }, configurable: true},
        playbackRate: {get() { return this._rate === undefined ? 1 : this._rate; }, set(v) { this._rate = v; }, configurable: true},
        muted: {get() { return !!this._muted; }, set(v) { this._muted = !!v; }, configurable: true},
    });
    // One eval for both files: top-level let/const of separate evals would not see each other, unlike <script> tags.
    window.eval(SOURCES.join('\n;\n'));
    return window;
}

/** Runs the add-on's periodic check `n` times (several passes are needed for state transitions). */
async function tick(window, n = 1) {
    for (let i = 0; i < n; i++) await window.checkForAds();
}

/** Runs the callbacks that the add-on scheduled with setTimeout. */
function runTimeouts(window) {
    const pending = window.timeouts.splice(0);
    for (const {fn, args} of pending) fn(...args);
}

module.exports = {loadAddon, tick, runTimeouts, LocalStorageMock};
