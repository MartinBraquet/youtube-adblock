const {expect} = require('expect');
const {loadAddon, tick, runTimeouts} = require('./harness');

// Markup of the YouTube player as seen in the saved pages under martin/ and in scripts/live_check.py runs.
function player({ad = false, skipButton = null, progressBar = null, playing = true, extra = ''} = {}) {
    return `
    <div id="movie_player" class="html5-video-player ytp-transparent ${ad ? 'ad-showing ad-interrupting' : ''} ${playing ? 'playing-mode' : 'paused-mode'}">
        <div class="html5-video-container">
            <video class="video-stream html5-main-video" data-playing="${playing}"></video>
        </div>
        <div class="video-ads ytp-ad-module">
            ${progressBar !== null ? `<div class="ytp-ad-persistent-progress-bar-container" style="display: ${progressBar}"></div>` : ''}
            ${skipButton ? `<div class="ytp-ad-skip-button-slot"><button class="${skipButton}" style="display: ${skipButton.display || ''}">Skip</button></div>` : ''}
            ${extra}
        </div>
    </div>`;
}

function video(window) {
    const v = window.document.querySelector('video');
    v.paused = v.dataset.playing !== 'true';
    v.currentTime = 1;  // a playing video is never at 0: the add-on reads 0 as "a new ad started"
    return v;
}

function setAd(window, ad) {
    window.document.getElementById('movie_player').classList.toggle('ad-showing', ad);
    window.document.getElementById('movie_player').classList.toggle('ad-interrupting', ad);
}

describe('no ad', function () {
    it('leaves the video untouched and remembers the user playback rate', async function () {
        const window = loadAddon({html: player()});
        const v = video(window);
        v.playbackRate = 1.5;
        await tick(window, 3);
        expect(v.muted).toBe(false);
        expect(v.hidden).toBe(false);
        expect(v.playbackRate).toBe(1.5);
        expect(window.messages).toEqual([]);
        expect(window.intervals.length).toBe(1);
    });

    it('fills the storage with the default options on first read', async function () {
        const window = loadAddon({html: player()});
        await tick(window);
        expect(window.storage.data.hideWanted).toBe(true);
    });
});

describe('ad-showing', function () {
    it('mutes, hides and accelerates the ad once, and counts it', async function () {
        const window = loadAddon({html: player({ad: true})});
        const v = video(window);
        await tick(window, 3);
        expect(v.muted).toBe(true);
        expect(v.hidden).toBe(true);
        expect(v.playbackRate).toBe(5);
        expect(window.messages).toEqual([{adsSkipped: true}]);
    });

    it('respects the options', async function () {
        const window = loadAddon({html: player({ad: true}), storage: {muteWanted: false, hideWanted: false, adPlaybackRate: 1}});
        const v = video(window);
        await tick(window, 2);
        expect(v.muted).toBe(false);
        expect(v.hidden).toBe(false);
        expect(v.playbackRate).toBe(1);
        expect(window.messages.length).toBe(1);
    });

    it('does nothing while the ad is paused', async function () {
        const window = loadAddon({html: player({ad: true, playing: false})});
        const v = video(window);
        await tick(window, 2);
        expect(v.muted).toBe(false);
        expect(window.messages).toEqual([]);
    });

    it('jumps to the end after 2 seconds when boost is wanted', async function () {
        const window = loadAddon({html: player({ad: true}), storage: {boostWanted: true}});
        const v = video(window);
        v.duration = 30;
        await tick(window);
        expect(window.timeouts.length).toBe(1);
        expect(window.timeouts[0].ms).toBe(2000);
        runTimeouts(window);
        expect(v.currentTime).toBe(30);
        expect(v.muted).toBe(false);
        expect(v.hidden).toBe(false);
        expect(v.playbackRate).toBe(1);
    });

    it('restores the user settings when the ad ends', async function () {
        const window = loadAddon({html: player()});
        const v = video(window);
        v.playbackRate = 2;
        await tick(window);
        setAd(window, true);
        await tick(window, 2);
        expect(v.playbackRate).toBe(5);
        expect(v.hidden).toBe(true);
        setAd(window, false);
        await tick(window);
        expect(v.playbackRate).toBe(2);
        expect(v.muted).toBe(false);
        expect(v.hidden).toBe(false);
    });

    it('restores a playback rate of 1 on music.youtube.com', async function () {
        const window = loadAddon({html: player({ad: true}), url: 'https://music.youtube.com/watch?v=abc'});
        const v = video(window);
        await tick(window);
        setAd(window, false);
        await tick(window);
        expect(v.playbackRate).toBe(1);
    });
});

describe('persistent progress bar', function () {
    it('counts as an ad when visible', async function () {
        const window = loadAddon({html: player({progressBar: ''})});
        const v = video(window);
        await tick(window);
        expect(v.muted).toBe(true);
    });

    it('does not count as an ad when hidden', async function () {
        const window = loadAddon({html: player({progressBar: 'none'})});
        const v = video(window);
        await tick(window);
        expect(v.muted).toBe(false);
    });
});

describe('skip button', function () {
    for (const cls of ['ytp-skip-ad-button', 'ytp-ad-skip-button-modern ytp-button', 'ytp-ad-skip-button ytp-button']) {
        it(`jumps to the end of the ad when ${cls} shows up (default behavior)`, async function () {
            const window = loadAddon({html: player({ad: true, skipButton: cls})});
            const v = video(window);
            v.duration = 15;
            await tick(window);
            expect(v.currentTime).toBe(15);
            expect(v.muted).toBe(false);
        });
    }

    it('clicks the button when the skip behavior is "click"', async function () {
        const window = loadAddon({html: player({ad: true, skipButton: 'ytp-skip-ad-button'}), storage: {skipBehavior: 1}});
        const v = video(window);
        const events = [];
        window.document.querySelector('.ytp-skip-ad-button').addEventListener('click', e => events.push(e.type));
        await tick(window, 3);
        expect(events).toEqual(['click']);
        expect(v.currentTime).toBe(1);
    });

    it('does nothing when the skip behavior is "do nothing"', async function () {
        const window = loadAddon({html: player({ad: true, skipButton: 'ytp-skip-ad-button'}), storage: {skipBehavior: 0}});
        const v = video(window);
        v.duration = 15;
        const events = [];
        window.document.querySelector('.ytp-skip-ad-button').addEventListener('click', e => events.push(e.type));
        await tick(window, 2);
        expect(events).toEqual([]);
        expect(v.currentTime).toBe(1);
    });

    it('hides the end-of-ad action slot while hiding ads', async function () {
        const window = loadAddon({html: player({ad: true, extra: '<div class="ytp-ad-action-interstitial-slot">Download</div>'})});
        await tick(window);
        expect(window.document.querySelector('.ytp-ad-action-interstitial-slot').hidden).toBe(true);
    });
});

describe('ad pods and buffering', function () {
    it('counts an ad once while it buffers at time 0', async function () {
        const window = loadAddon({html: player({ad: true})});
        const v = video(window);
        v.currentTime = 0;
        await tick(window, 4);
        expect(window.messages.length).toBe(1);
        v.currentTime = 2;
        await tick(window, 2);
        expect(window.messages.length).toBe(1);
    });

    it('counts a second ad of the same pod when the time goes back to 0', async function () {
        const window = loadAddon({html: player({ad: true})});
        const v = video(window);
        v.currentTime = 3;
        await tick(window, 2);
        expect(window.messages.length).toBe(1);
        v.currentTime = 0;  // next ad of the pod
        await tick(window, 3);
        expect(window.messages.length).toBe(2);
        expect(v.playbackRate).toBe(5);
    });
});

describe('after the ad', function () {
    it('puts the user settings back if the player changes them again within a few seconds (issue #20)', async function () {
        const window = loadAddon({html: player({ad: true})});
        const v = video(window);
        await tick(window);
        setAd(window, false);
        await tick(window);
        expect(v.muted).toBe(false);
        // The player re-applies the muted state it captured during the ad
        v.muted = true;
        v.playbackRate = 5;
        window.clock += 1000;
        await tick(window);
        expect(v.muted).toBe(false);
        expect(v.playbackRate).toBe(1);
        // Later on, a mute is the user's own choice and is kept
        window.clock += 5000;
        await tick(window);
        v.muted = true;
        await tick(window, 2);
        expect(v.muted).toBe(true);
    });

    it('keeps the video muted after the ad when the user had muted it', async function () {
        const window = loadAddon({html: player()});
        const v = video(window);
        v.muted = true;
        await tick(window);
        setAd(window, true);
        await tick(window);
        setAd(window, false);
        await tick(window);
        expect(v.muted).toBe(true);
        expect(v.hidden).toBe(false);
    });
});

describe('shorts (issue #21)', function () {
    const shorts = `
    <ytd-reel-video-renderer>
        <div id="sticker-layer"><div class="some-sticker">sticker</div></div>
        <div class="player-wrapper">${player()}</div>
        <div id="experiment-overlay">
            <yt-overlay-product-sticker><yt-overlay-sticker><a href="https://www.awin1.com/">View product</a></yt-overlay-sticker></yt-overlay-product-sticker>
        </div>
    </ytd-reel-video-renderer>`;

    it('hides the product stickers drawn over the video', async function () {
        const window = loadAddon({html: shorts, url: 'https://www.youtube.com/shorts/XuNcquNT9TM'});
        await tick(window);
        expect(window.document.querySelector('yt-overlay-product-sticker').hidden).toBe(true);
        expect(window.document.querySelector('.some-sticker').hidden).toBe(true);
        expect(video(window).hidden).toBe(false);
    });

    it('leaves them alone when hiding ads is off', async function () {
        const window = loadAddon({html: shorts, url: 'https://www.youtube.com/shorts/XuNcquNT9TM', storage: {hideWanted: false}});
        await tick(window);
        expect(window.document.querySelector('yt-overlay-product-sticker').hidden).toBe(false);
    });
});
