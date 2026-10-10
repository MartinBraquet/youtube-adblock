// utils.js is already imported as a background script.
// Debug: in about:debugging#/runtime/this-firefox, click on "Inspect" for the extension.

// The content script is declared in manifest.json and runs on every youtube.com page; it keeps running across
// YouTube's in-page navigations. Only the tabs that were already open when the add-on got installed or updated
// need it injected by hand.
browser.runtime.onInstalled.addListener(async () => {
    console.log('onInstalled');
    const tabs = await browser.tabs.query({url: '*://*.youtube.com/*'});
    for (const tab of tabs) {
        try {
            await browser.scripting.executeScript({target: {tabId: tab.id}, files: ['utils.js', 'content.js']});
        } catch (e) {
            console.error(`Script injection failed in tab ${tab.id}: ${e.message}`);
        }
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('onMessage');
    if (request.adsSkipped !== undefined) {
        local.get('adsSkipped', (data) => {
            let newCount = (data.adsSkipped || 0) + 1;
            local.set({adsSkipped: newCount});
        });
    }
});
