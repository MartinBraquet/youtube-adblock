function getSkipButtonByName(classNames) {
    return document.getElementsByClassName(classNames)[0];
}

function getSkipButtons() {
    return [
        getSkipButtonByName("ytp-ad-skip-button ytp-button"),
        getSkipButtonByName("ytp-ad-skip-button-modern ytp-button"),
    ]
}

function checkForAds() {
    let adExist = document.getElementsByClassName("ad-showing").length > 0;

    if (adExist) {
        console.log("Ad detected");
        let video = document.getElementsByClassName("video-stream html5-main-video")[0];
        if (video && video.playbackRate === 1) {
            let playbackRate = 1000;
            console.log("Ad detected, accelerating video " + playbackRate + "x");
            video.playbackRate = playbackRate;
        }

        let skipButtons = getSkipButtons();
        for (let i = 0; i < skipButtons.length; i++) {
            let skipButton = skipButtons[i];
            if (skipButton) {
                if (!skipButton.clicked) {
                    console.log("Ad detected, clicking skip button (" + skipButton.className + ")");
                    skipButton.click();
                    skipButton.clicked = true;
                    browser.runtime.sendMessage({adsSkipped: true});
                    // } else if (!adExist) {
                    //     skipButton.clicked = false;
                }
            }
        }
    }
}

setInterval(checkForAds, 200);
