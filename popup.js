document.addEventListener('DOMContentLoaded', function () {
    browser.storage.local.get('adsSkipped', (data) => {
        document.getElementById('adsSkippedCount').textContent = data.adsSkipped || '0';
    });
});

  