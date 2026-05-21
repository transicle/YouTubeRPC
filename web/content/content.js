const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let lastTitle   = null;
let lastState   = null;
let lastElapsed = null;

function sendUpdate(force = false) {
    const info = getTrackInfo();

    if (!info) {
        lastTitle = lastState = lastElapsed = null;
        browserAPI.runtime.sendMessage({
            service: getService(), state: 'stopped',
            title: null, artist: null, elapsed: null, duration: null,
            thumbnail: null, pageUrl: null
        });
        return;
    }

    const elapsedDrift = Math.abs((info.elapsed ?? 0) - (lastElapsed ?? 0));
    const seeked = elapsedDrift > 3 && info.state === lastState;

    if (!force && !seeked && info.title === lastTitle && info.state === lastState) return;

    lastTitle   = info.title;
    lastState   = info.state;
    lastElapsed = info.elapsed;

    browserAPI.runtime.sendMessage({
        title:     info.title,
        artist:    info.artist,
        service:   getService(),
        state:     info.state,
        elapsed:   info.elapsed,
        duration:  info.duration,
        thumbnail: getThumbnailUrl(),
        pageUrl:   location.href
    });
}

waitForVideo(video => {
    sendUpdate(true);
    attachVideoListeners(video, () => sendUpdate(false));
    video.addEventListener('seeked', () => sendUpdate(true));
    setInterval(() => sendUpdate(true), 5000);
});

startUrlWatcher(() => {
    lastTitle = lastState = lastElapsed = null;
    waitForVideo(video => {
        attachVideoListeners(video, () => sendUpdate(false));
        video.addEventListener('seeked', () => sendUpdate(true));
    });
    sendUpdate(true);
});
