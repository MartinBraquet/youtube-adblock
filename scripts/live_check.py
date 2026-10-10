#!/usr/bin/env python3
"""Load the add-on in a throwaway Firefox profile, play YouTube videos and check that ads are still handled.

For each url the script plays the video for WAIT seconds while sampling the player state a few times per
second (ad-showing class, skip buttons, video time / rate / muted / hidden, ad related elements...), then
prints a JSON summary and saves a screenshot + page source under scripts/out/.

    python3 -m venv .venv && .venv/bin/pip install selenium
    .venv/bin/python scripts/live_check.py https://www.youtube.com/watch?v=qj-Mlygkheg

Environment variables:
    EXT=0        run without the add-on (to compare)
    HEADLESS=0   show the browser
    WAIT=<s>     how long to watch each page (default 45)
    MOBILE=1     use a mobile user agent (to test the m.youtube.com site)
    RELOADS=<n>  how many times to reload each url to increase the chance of getting an ad (default 1)
Requires Firefox and geckodriver (paths below are for the snap packages).
"""
import json
import os
import pathlib
import sys
import time
import zipfile

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).parent / "out"
HEADLESS = os.environ.get("HEADLESS", "1") == "1"
WITH_EXT = os.environ.get("EXT", "1") == "1"
MOBILE = os.environ.get("MOBILE", "0") == "1"
WAIT = float(os.environ.get("WAIT", "45"))
RELOADS = int(os.environ.get("RELOADS", "1"))
SAMPLE_PERIOD = 0.5

MOBILE_UA = "Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0"


def build_xpi():
    OUT.mkdir(exist_ok=True)
    xpi = OUT / "youtube-adblock-test.xpi"
    with zipfile.ZipFile(xpi, "w", zipfile.ZIP_DEFLATED) as z:
        for rel in ["manifest.json", "utils.js", "content.js", "background.js", "popup.html", "popup.js"]:
            z.write(REPO / rel, rel)
        for f in os.listdir(REPO / "images"):
            z.write(REPO / "images" / f, "images/" + f)
    return str(xpi)


def make_driver():
    opts = Options()
    opts.binary_location = "/snap/firefox/current/usr/lib/firefox/firefox"
    if HEADLESS:
        opts.add_argument("-headless")
    opts.set_preference("intl.accept_languages", "en-US, en")
    # Let videos start on their own, otherwise nothing plays and no ad is ever shown.
    opts.set_preference("media.autoplay.default", 0)
    opts.set_preference("media.autoplay.blocking_policy", 0)
    opts.set_preference("media.autoplay.block-webaudio", False)
    if MOBILE:
        opts.set_preference("general.useragent.override", MOBILE_UA)
    opts.enable_bidi = True
    driver = webdriver.Firefox(options=opts, service=Service("/snap/bin/geckodriver"))
    driver.set_window_size(500, 900) if MOBILE else driver.set_window_size(1400, 1000)
    return driver


# Clicks through the cookie consent dialog that YouTube shows in some regions, so that the video can play.
CONSENT_JS = r"""
const labels = ["Reject all", "Accept all", "Tout refuser", "Tout accepter"];
for (const b of document.querySelectorAll('button, [role="button"]')) {
    const txt = ((b.getAttribute('aria-label') || '') + ' ' + (b.innerText || '')).trim();
    if (labels.some(l => txt.includes(l))) { b.click(); return txt; }
}
return null;
"""

# One sample of the player state. Everything the add-on relies on is in here, plus the ad related elements
# that currently exist in the page so that a change in YouTube's html can be spotted.
PROBE_JS = r"""
const players = [...document.getElementsByClassName('html5-video-player')];
const adClasses = new Set();
for (const el of document.querySelectorAll('[class*="ytp-ad"], [class*="ad-showing"], [class*="ad-interrupting"], [id*="sticker"]')) {
    for (const c of el.classList) if (c.includes('ad')) adClasses.add(c + (el.offsetParent === null && getComputedStyle(el).display === 'none' ? '(hidden)' : ''));
}
const skip = [...document.querySelectorAll('[class*="skip"]')].map(e => e.className + ' display=' + getComputedStyle(e).display + ' text=' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40));
const out = {
    url: location.href,
    players: players.map(p => {
        const v = p.querySelector('video');
        return {
            cls: [...p.classList].filter(c => c.includes('ad') || c.includes('playing') || c.includes('paused') || c.includes('ended')).join(' '),
            adShowing: p.classList.contains('ad-showing'),
            adInterrupting: p.classList.contains('ad-interrupting'),
            progressBar: [...p.getElementsByClassName('ytp-ad-persistent-progress-bar-container')].map(e => 'display=' + e.style.display),
            adText: [...p.querySelectorAll('.ytp-ad-text, .ytp-ad-simple-ad-badge, .ytp-ad-preview-text-modern, .ytp-ad-duration-remaining, .ytp-ad-preview-container')].map(e => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean),
            video: v ? {
                cls: v.className, t: +v.currentTime.toFixed(1), d: +(v.duration || 0).toFixed(1), rate: v.playbackRate,
                muted: v.muted, hidden: v.hidden, paused: v.paused, detected: v.detected
            } : null,
        };
    }),
    adClasses: [...adClasses].sort(),
    skip,
    stickerLayer: document.querySelectorAll('#sticker-layer').length,
    adSlots: document.querySelectorAll('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-promoted-sparkles-web-renderer').length,
    enforcement: [...document.querySelectorAll('ytd-enforcement-message-view-model, yt-playability-error-supported-renderers')].map(e => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 80)).filter(Boolean),
    // Shorts: what the item currently on screen contains (issue #21)
    reel: [...document.querySelectorAll('ytd-reel-video-renderer[is-active], ytd-reel-video-renderer')].slice(0, 1).map(r => ({
        attrs: [...r.attributes].map(a => a.name).join(' '),
        children: [...r.querySelectorAll('*')].map(e => e.tagName.toLowerCase()).filter((t, i, a) => (t.includes('ad') || t.includes('sticker') || t.includes('badge')) && a.indexOf(t) === i).slice(0, 20),
        text: (r.innerText || '').replace(/\s+/g, ' ').slice(0, 100),
    })),
    bodyTextHead: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
};
return out;
"""


# The mobile site (and the desktop site in some cases) waits for a tap before playing anything.
PLAY_SELECTORS = [".ytp-large-play-button", ".ytp-cued-thumbnail-overlay", "#player-control-overlay", ".player-controls-background",
                  "#player-container-id", ".html5-video-player"]


def start_playback(driver):
    for _ in range(3):
        paused = driver.execute_script("const v = document.querySelector('video'); return !v || v.paused;")
        if not paused:
            return True
        for sel in PLAY_SELECTORS:
            try:
                el = driver.find_element(By.CSS_SELECTOR, sel)
                if el.is_displayed():
                    el.click()  # real click, the page needs a user gesture
                    break
            except WebDriverException:
                continue
        time.sleep(2)
    return not driver.execute_script("const v = document.querySelector('video'); return !v || v.paused;")


def watch(driver, url, logs):
    logs.clear()
    driver.get(url)
    time.sleep(3)
    consent = driver.execute_script(CONSENT_JS)
    if consent:
        print("consent dialog: clicked", repr(consent))
        time.sleep(3)
    if not start_playback(driver):
        print("warning: could not start playback")
    samples = []
    last_key = None
    t0 = time.time()
    while time.time() - t0 < WAIT:
        try:
            s = driver.execute_script(PROBE_JS)
        except Exception as e:
            s = {"error": str(e)}
        # Only keep a sample when something that matters changed, to keep the output readable.
        key = json.dumps({k: v for k, v in s.items() if k != 'players'}) + json.dumps(
            [{**p, 'video': p['video'] and {k: v for k, v in p['video'].items() if k not in ('t',)}} for p in s.get('players', [])])
        if key != last_key:
            s["at"] = round(time.time() - t0, 1)
            samples.append(s)
            last_key = key
        time.sleep(SAMPLE_PERIOD)
    return samples


def main():
    OUT.mkdir(exist_ok=True)
    driver = make_driver()
    logs = []

    def on_console(msg):
        try:
            txt = " ".join(str(a.value) for a in msg.args) if msg.args else msg.text
        except Exception:
            txt = str(getattr(msg, "text", msg))
        logs.append("[%s] %s" % (msg.level, txt))

    driver.script.add_console_message_handler(on_console)
    if WITH_EXT:
        driver.install_addon(build_xpi(), temporary=True)

    summary = []
    for url in sys.argv[1:]:
        for n in range(RELOADS):
            samples = watch(driver, url, logs)
            tag = url.replace("https://", "").replace("/", "_").replace("?", "_")[:80] + ("_ext" if WITH_EXT else "_noext") + ("_%d" % n if RELOADS > 1 else "")
            driver.save_screenshot(str(OUT / (tag + ".png")))
            (OUT / (tag + ".html")).write_text(driver.page_source)
            ext_logs = [l for l in logs if "YtAd" in l]
            ad_seen = any(p.get("adShowing") for s in samples for p in s.get("players", []))
            info = {"url": url, "run": n, "ad_seen": ad_seen, "ext_logs": ext_logs, "samples": samples}
            summary.append({"url": url, "run": n, "ad_seen": ad_seen, "n_ext_logs": len(ext_logs)})
            print(json.dumps(info, indent=1, ensure_ascii=False))
            print("=" * 100)
    print("SUMMARY", json.dumps(summary))
    try:
        driver.quit()
    except Exception:
        pass


if __name__ == "__main__":
    main()
