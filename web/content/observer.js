let lastHref = location.href;

function waitForVideo(callback) {
    const existing = document.querySelector('video');
    if (existing) {
        callback(existing);
        return;
    }

    const observer = new MutationObserver(() => {
        const video = document.querySelector('video');
        if (video) {
            observer.disconnect();
            callback(video);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function attachVideoListeners(video, onChange) {
    video.addEventListener('play', onChange);
    video.addEventListener('pause', onChange);
    video.addEventListener('ended', onChange);
}

function startUrlWatcher(onChange) {
    setInterval(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            onChange();
        }
    }, 1000);
}
