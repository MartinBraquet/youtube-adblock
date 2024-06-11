function getSkipButtonByName(classNames) {
    return document.getElementsByClassName(classNames)[0];
}

function getSkipButtons() {
    return [
        getSkipButtonByName("ytp-skip-ad-button"),
        getSkipButtonByName("ytp-ad-skip-button-modern"),
        getSkipButtonByName("ytp-ad-skip-button-modern ytp-button"),
        getSkipButtonByName("ytp-ad-skip-button ytp-button"),
        getSkipButtonByName("ytp-ad-skip-button-container"),
    ]
}

function isAdPersistentBar(element) {
    let progress_bars = element.getElementsByClassName('ytp-ad-persistent-progress-bar-container');
    if (!progress_bars) {
        return false;
    }
    for (const progress_bar of progress_bars) {
        if (progress_bar.style.display === 'none') {
            return false;
        }
    }
    return true
}

function adExist(element) {
    // console.log("isAdPersistentBar", isAdPersistentBar(element));
    return element.getElementsByClassName("ad-showing").length > 0 || isAdPersistentBar(element);
}

const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
        browser.storage.local.get([key], function (result) {
            resolve(result[key]);
        });
    });
};

let userPlaybackRate = 1;
let userMuted = false;

async function checkForAds() {
    /*
        Check if the video is an ad and skip it.
        An ad is said to be present if one of the following conditions is met:
        - The video has the ad-showing class.
        - The video has the ytp-ad-persistent-progress-bar-container element visible (this is the thin yellow bar
        that stays visible at the bottom of the video even when the cursor is not hovering over the video).
        If an ad element is present, mute the video and set the playback rate to 5x, send adsSkipped message,
        click ad button.
        If the ad element is not present, restore the video settings (mute, hidden, playback rate) if they were changed.

        Possible improvements:
        - change the video time instead of the playback rate: video.currentTime = 99999
     */
    let movie_players = document.getElementsByClassName("html5-video-player");
    for (const player of movie_players) {
        let _adExist = adExist(player);
        let videos = player.getElementsByClassName("video-stream html5-main-video");
        for (const video of videos) {
            if (_adExist) {
                if (video && video.playbackRate <= 2) {
                    userMuted = video.muted;
                    video.muted = video.hidden = true;

                    userPlaybackRate = video.playbackRate;
                    video.playbackRate = await readLocalStorage("adPlaybackRate") || 5;
                    console.log("Ad detected, accelerating video " + video.playbackRate + "x");

                    browser.runtime.sendMessage({adsSkipped: true});
                    setTimeout(function () {
                        video.playbackRate = 100;
                        console.log("Ad detected, boosting to " + video.playbackRate + "x");
                    }, 2000);
                }

                let skipButtons = getSkipButtons();
                for (const skipButton of skipButtons) {
                    if (skipButton) {
                        skipButton.click();
                        skipButton.clicked = true;
                        console.log("Ad detected, clicking skip button (" + skipButton.className + ")");
                    }
                }
            } else {
                if (video && video.playbackRate > 2) {
                    video.muted = userMuted;
                    video.hidden = false;
                    video.playbackRate = userPlaybackRate;
                    console.log("Ad ended, restoring video playback rate");
                }
            }
        }
    }
}

setInterval(checkForAds, 200);
