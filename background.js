browser.runtime.onInstalled.addListener(() => {
    console.log('onInstalled');
    browser.storage.local.set({adsSkipped: 0});
    // browser.action.setBadgeText({text: '0'});
    // browser.action.setBadgeBackgroundColor({color: '#F0FFFF'});
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('onUpdated');
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
        browser.scripting.executeScript({
            target: {tabId: tabId}, files: ['content.js']
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
        browser.storage.local.get('adsSkipped', (data) => {
            let newCount = (data.adsSkipped || 0) + 1;
            browser.storage.local.set({adsSkipped: newCount}, () => {
                // browser.action.setBadgeText({text: newCount.toString()});
                // if (sender.tab.id) {
                //     browser.action.setBadgeBackgroundColor({color: '#F0FFFF', tabId: sender.tab.id});
                // }
            });
        });
    }
});
