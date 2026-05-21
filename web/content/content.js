const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let lastTitle = null;
let lastState = null;

function sendUpdate() {
    const info = getTrackInfo();

    if (!info) {
        browserAPI.runtime.sendMessage({ service: getService(), state: 'stopped', title: null, artist: null });
        return;
    }

    if (info.title === lastTitle && info.state === lastState) return;

    lastTitle = info.title;
    lastState = info.state;

    browserAPI.runtime.sendMessage({
        title: info.title,
        artist: info.artist,
        service: getService(),
        state: info.state
    });
}

waitForVideo(video => {
    attachVideoListeners(video, sendUpdate);
    setInterval(sendUpdate, 2000);
});

startUrlWatcher(() => {
    lastTitle = null;
    lastState = null;
    waitForVideo(video => attachVideoListeners(video, sendUpdate));
    sendUpdate();
});
