// utils.js is already imported as a background script.
// Debug: in about:debugging#/runtime/this-firefox, click on "Inspect" for the extension.

browser.runtime.onInstalled.addListener(() => {
    console.log('onInstalled');
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('onUpdated');
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
        browser.scripting.executeScript({
            target: {tabId: tabId}, files: ['utils.js', 'content.js']
        }, () => {
            if (browser.runtime.lastError) {
                console.error(`Script injection failed: ${browser.runtime.lastError.message}`);
            }
        });
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
