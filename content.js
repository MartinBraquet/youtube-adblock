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

function adExist() {
    return document.getElementsByClassName("ad-showing").length > 0;
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
    let video = document.getElementsByClassName("video-stream html5-main-video")[0];
    if (adExist()) {
        // TODO: try to change the video time instead of playback rate:
        //  video.currentTime = 99999;
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
        for (let i = 0; i < skipButtons.length; i++) {
            let skipButton = skipButtons[i];
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

setInterval(checkForAds, 200);
