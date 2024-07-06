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

function addListener(x, value, conversion) {
    let element = document.getElementById(x);
    element.addEventListener('change', (event) => {
        let v = event.target[value];
        if (conversion === "int") {
            v = parseInt(v);
        }
        local.set({[x]: v});
    });
}

function setElementAndListener(x, value, conversion) {
    setElement(x, value);
    addListener(x, value, conversion);
}

function restoreDefaults() {
    for (let x in defaultOptions) {
        local.set({[x]: defaultOptions[x]});
        let element = document.getElementById(x);
        if (typeof defaultOptions[x] === "boolean") {
            element.checked = defaultOptions[x];
        } else {
            element.value = defaultOptions[x];
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setElement("adsSkipped", "textContent");
    setElementAndListener("adPlaybackRate", "value");
    setElementAndListener("muteWanted", "checked");
    setElementAndListener("hideWanted", "checked");
    setElementAndListener("skipBehavior", "value", "int");
    document.getElementById("restoreDefaults").addEventListener('click', restoreDefaults);
});
