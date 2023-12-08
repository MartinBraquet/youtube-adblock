function getSkipButtonByName(classNames) {
    return document.getElementsByClassName(classNames)[0];
}

function getSkipButtons() {
    return [
        getSkipButtonByName("ytp-ad-skip-button-modern ytp-button"),
        getSkipButtonByName("ytp-ad-skip-button ytp-button"),
    ]
}

function checkForAds() {
    let adExist = document.getElementsByClassName("ad-showing").length > 0;

    if (adExist) {
        console.log("Ad detected");
        let video = document.getElementsByClassName("video-stream html5-main-video")[0];
        // TODO: try to change the video time instead of playback rate:
        //  video.currentTime = 99999;
        if (video && video.playbackRate === 1) {
            let playbackRate = 1000;
            video.playbackRate = playbackRate;
            console.log("Ad detected, accelerating video " + playbackRate + "x");
            browser.runtime.sendMessage({adsSkipped: true});
        }

        let skipButtons = getSkipButtons();
        for (let i = 0; i < skipButtons.length; i++) {
            let skipButton = skipButtons[i];
            if (skipButton) {
                if (!skipButton.clicked) {
                    skipButton.click();
                    skipButton.clicked = true;
                    console.log("Ad detected, clicking skip button (" + skipButton.className + ")");
                }
            }
        }
    }
}

setInterval(checkForAds, 200);
