document.addEventListener('DOMContentLoaded', function () {
    browser.storage.local.get('adsSkipped', (data) => {
        document.getElementById('adsSkippedCount').textContent = data.adsSkipped || '0';
    });
    browser.storage.local.get('adPlaybackRate', (data) => {
        document.getElementById('adPlaybackRate').value = data.adPlaybackRate || 5;
    });
    document.getElementById('adPlaybackRate').addEventListener('change', (event) => {
        browser.storage.local.set({adPlaybackRate: event.target.value});
    });
});
