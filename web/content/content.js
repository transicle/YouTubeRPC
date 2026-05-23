const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const LOG = (...a) => { console.log('[YT-RPC]', ...a); browserAPI.runtime.sendMessage({ _log: true, level: 'log', text: a.join(' ') }).catch(() => { }); };
const WARN = (...a) => { console.warn('[YT-RPC]', ...a); browserAPI.runtime.sendMessage({ _log: true, level: 'warn', text: a.join(' ') }).catch(() => { }); };

let lastTitle = null;
let lastState = null;
let songStartTime = null;
let songChanging = false;
let waitReadyId = 0;
let songTimer = null;

function sendUpdate(force = false) {
    if (songChanging) {
        LOG('sendUpdate blocked — songChanging=true');
        return;
    }

    if (location.hostname === 'www.youtube.com') {
        const { pathname } = location;
        if (pathname === '/' || pathname.startsWith('/feed/')) {
            LOG('sendUpdate → Browsing YouTube');
            lastTitle = lastState = songStartTime = null;
            browserAPI.runtime.sendMessage({
                service: 'youtube', state: 'playing',
                title: 'Browsing YouTube', artist: null,
                startTime: null, thumbnail: null, pageUrl: null
            });
            return;
        }
        if (pathname === '/results') {
            const q = new URLSearchParams(location.search).get('search_query') || '';
            LOG(`sendUpdate → Searching YouTube for "${q}"`);
            lastTitle = lastState = songStartTime = null;
            browserAPI.runtime.sendMessage({
                service: 'youtube', state: 'playing',
                title: `Searching YouTube for "${q}"`, artist: null,
                startTime: null, thumbnail: null, pageUrl: null
            });
            return;
        }
    }

    const info = getTrackInfo();

    if (!info) {
        LOG('sendUpdate → stopped (no track info)');
        lastTitle = lastState = songStartTime = null;
        browserAPI.runtime.sendMessage({
            service: getService(), state: 'stopped',
            title: null, artist: null, startTime: null,
            thumbnail: null, pageUrl: null
        });
        return;
    }

    if (!force && info.title === lastTitle && info.state === lastState) return;

    const reason = force ? 'force' : 'title/state';
    LOG(`sendUpdate → [${reason}] "${info.title}" | ${info.state}`);

    if (info.title !== lastTitle) songStartTime = Date.now();
    lastTitle = info.title;
    lastState = info.state;

    browserAPI.runtime.sendMessage({
        title: info.title,
        artist: info.artist,
        service: getService(),
        state: info.state,
        startTime: songStartTime,
        thumbnail: getThumbnailUrl(),
        pageUrl: location.href
    });
}

function waitForReady(video, fromTitle, cancelId, callback) {
    let attempts = 0;
    LOG(`waitForReady started — fromTitle="${fromTitle}" id=${cancelId}`);
    (function poll() {
        if (cancelId !== waitReadyId) {
            LOG(`waitForReady [id=${cancelId}] cancelled — superseded`);
            return;
        }
        const info = getTrackInfo();
        const ready = Boolean(info && info.title && info.title !== fromTitle && video.readyState >= 2);
        LOG(`waitForReady [id=${cancelId}] poll #${attempts + 1} — title="${info?.title}" rs=${video.readyState} ready=${ready}`);
        if (ready) {
            LOG(`waitForReady [id=${cancelId}] complete — "${info?.title}"`);
            callback();
        } else if (++attempts > 25) {
            WARN(`waitForReady [id=${cancelId}] timed out — safety timer will unblock`);
        } else {
            setTimeout(poll, 200);
        }
    })();
}

waitForVideo(video => {
    LOG('waitForVideo — video element found, sending initial update');
    sendUpdate(true);

    video.addEventListener('emptied', () => {
        const fromTitle = lastTitle;
        const myId = ++waitReadyId;
        LOG(`emptied fired — fromTitle="${fromTitle}" myId=${myId}`);
        lastTitle = lastState = songStartTime = null;
        songChanging = true;
        clearTimeout(songTimer);
        songTimer = setTimeout(() => {
            if (songChanging) {
                WARN('songTimer safety fired — song never loaded, unblocking');
                songChanging = false;
                sendUpdate(true);
            }
        }, 5000);
        waitForReady(video, fromTitle, myId, () => {
            if (myId !== waitReadyId) {
                LOG(`waitForReady callback ignored — superseded (myId=${myId} waitReadyId=${waitReadyId})`);
                return;
            }
            LOG(`waitForReady callback accepted — myId=${myId}, unblocking`);
            clearTimeout(songTimer);
            songChanging = false;
            sendUpdate(true);
        });
    });

    attachVideoListeners(video, () => sendUpdate(false));
    setInterval(() => sendUpdate(false), 250);
});

startUrlWatcher(() => {
    const h = location.hostname;
    const p = location.pathname;
    const onVideoPage = (h === 'music.youtube.com' && p.startsWith('/watch')) ||
        (h === 'www.youtube.com' && (p.startsWith('/watch') || p.startsWith('/shorts/'))) ||
        h === 'tv.youtube.com';
    LOG(`urlWatcher fired — onVideoPage=${onVideoPage} path=${p}`);
    if (!onVideoPage) {
        ++waitReadyId;
        clearTimeout(songTimer);
        songChanging = false;
        lastTitle = lastState = songStartTime = null;
        sendUpdate(true);
    }
});

browserAPI.runtime.connect({ name: 'lifecycle' });
