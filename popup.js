// utils.js is already imported in the html.
// Debug: in about:debugging#/runtime/this-firefox, click on "Inspect" for the extension, disable popup auto-hide in the
// ••• menu, click on the extension symbol, click on the button to the left of the ••• menu, select "popup.html".

function setElement(x, value) {
    let element = document.getElementById(x);
    local.get(x, (data) => {
        let d = data[x];
        if (d === undefined) {
            d = defaultOptions[x];
            local.set({[x]: d});
        }
        element[value] = d;
    });
}

function addListener(x, value) {
    let element = document.getElementById(x);
    element.addEventListener('change', (event) => {
        local.set({[x]: event.target[value]});
    });
}

function setElementAndListener(x, value) {
    setElement(x, value);
    addListener(x, value);
}

document.addEventListener('DOMContentLoaded', function () {
    setElement("adsSkipped", "textContent");
    setElementAndListener("adPlaybackRate", "value");
    setElementAndListener("muteWanted", "checked");
    // setElementAndListener("boostWanted", "checked");
});
