// utils.js is already imported as a content script.
// Debug: ctrl+shift+i on a youtube.com tab, click on the extension's tab.

window.mobileCheck = function () {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
            check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

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
    if (window.mobileCheck()) {
        return false;
    }
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
    return element.classList.contains('ad-showing') || isAdPersistentBar(element);
}

const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
        local.get([key], function (result) {
            let value = result[key];
            if (value === undefined) {
                value = defaultOptions[key];
                local.set({ [key]: value });
            }
            resolve(value);
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
     */
    let movie_players = document.getElementsByClassName("html5-video-player");
    for (const player of movie_players) {
        let _adExist = adExist(player);
        let videos = player.getElementsByClassName("video-stream html5-main-video");
        for (const video of videos) {
            if (_adExist) {
                if (video && !video.paused && !video.detected) {
                    video.detected = true;
                    browser.runtime.sendMessage({ adsSkipped: true });

                    let muteWanted = await readLocalStorage("muteWanted");
                    if (muteWanted) {
                        video.muted = true;
                        console.log("YtAd detected, muting audio");
                    }

                    let hideWanted = await readLocalStorage("hideWanted");
                    if (hideWanted) {
                        video.hidden = true;
                        console.log("YtAd detected, hiding video");
                    }

                    let playbackRate = await readLocalStorage("adPlaybackRate");
                    if (playbackRate > 1) {
                        video.playbackRate = playbackRate;
                        console.log("YtAd detected, accelerating video " + video.playbackRate + "x");
                    }

                    let forceSkip = await readLocalStorage("forceSkip",);
                    if (forceSkip) {
                        setTimeout(skipVideo, 2000);
                    }
                }

                let skipBehavior = await readLocalStorage("skipBehavior");
                if (skipBehavior > 0) {
                    let skipButtons = getSkipButtons();
                    for (const skipButton of skipButtons) {
                        if (skipButton && !skipButton.clicked && skipButton.style.display !== "none") {
                            skipButton.clicked = true;
                            if (skipBehavior == 1) {
                                skipButton.click();
                                console.log("YtAd detected, clicking skip button (" + skipButton.className + ")");
                            } else if (skipBehavior == 2) {
                                skipVideo();
                            }
                        }
                    }
                }

                function skipVideo() {
                    if (video && video.detected) {
                        video.detected = false;
                        video.currentTime = video.duration;
                        console.log("YtAd detected, skipping to the end.");
                    }
                }
            } else {
                if (video.detected) {
                    video.detected = false;
                    video.muted = userMuted;
                    video.hidden = false;
                    if (document.URL.includes("music.youtube.com")) {
                        video.playbackRate = 1;
                    } else {
                        // Only set the user playback rate for www.youtube.com or m.youtube.com, not music.youtube.com
                        video.playbackRate = userPlaybackRate;
                    }
                    console.log("YtAd ended, restoring default. Muted: " + userMuted + ", Playback rate: " + userPlaybackRate + "x");
                } else if (video.playbackRate <= 2) {
                    userPlaybackRate = video.playbackRate;
                }
            }
        }
    }
}

setInterval(checkForAds, 200);
