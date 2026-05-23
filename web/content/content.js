const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const LOG  = (...a) => { console.log ('[YT-RPC]', ...a); browserAPI.runtime.sendMessage({ _log: true, level: 'log',  text: a.join(' ') }).catch(() => {}); };
const WARN = (...a) => { console.warn('[YT-RPC]', ...a); browserAPI.runtime.sendMessage({ _log: true, level: 'warn', text: a.join(' ') }).catch(() => {}); };

let lastTitle    = null;
let lastState    = null;
let lastElapsed  = null;
let lastDuration = null;
let songChanging = false;
let waitReadyId  = 0;
let songTimer    = null;

function sendUpdate(force = false) {
    if (songChanging) {
        LOG('sendUpdate blocked — songChanging=true');
        return;
    }

    if (location.hostname === 'www.youtube.com') {
        const { pathname } = location;
        if (pathname === '/' || pathname.startsWith('/feed/')) {
            LOG('sendUpdate → Browsing YouTube');
            lastTitle = lastState = lastElapsed = lastDuration = null;
            browserAPI.runtime.sendMessage({
                service: 'youtube', state: 'playing',
                title: 'Browsing YouTube', artist: null,
                elapsed: null, duration: null, thumbnail: null, pageUrl: null
            });
            return;
        }
        if (pathname === '/results') {
            const q = new URLSearchParams(location.search).get('search_query') || '';
            LOG(`sendUpdate → Searching YouTube for "${q}"`);
            lastTitle = lastState = lastElapsed = lastDuration = null;
            browserAPI.runtime.sendMessage({
                service: 'youtube', state: 'playing',
                title: `Searching YouTube for "${q}"`, artist: null,
                elapsed: null, duration: null, thumbnail: null, pageUrl: null
            });
            return;
        }
    }

    const info = getTrackInfo();

    if (!info) {
        LOG('sendUpdate → stopped (no track info)');
        lastTitle = lastState = lastElapsed = lastDuration = null;
        browserAPI.runtime.sendMessage({
            service: getService(), state: 'stopped',
            title: null, artist: null, elapsed: null, duration: null,
            thumbnail: null, pageUrl: null
        });
        return;
    }

    const durationChanged = info.duration !== lastDuration;

    if (!force && !durationChanged && info.title === lastTitle && info.state === lastState) return;

    const reason = force ? 'force' : durationChanged ? `duration(${lastDuration}→${info.duration})` : 'title/state';
    LOG(`sendUpdate → [${reason}] "${info.title}" | ${info.state} | elapsed=${info.elapsed} dur=${info.duration} rs=${document.querySelector('video')?.readyState}`);

    lastTitle    = info.title;
    lastState    = info.state;
    lastElapsed  = info.elapsed;
    lastDuration = info.duration;

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

function waitForReady(video, fromTitle, callback) {
    let attempts = 0;
    LOG(`waitForReady started — fromTitle="${fromTitle}"`);
    (function poll() {
        const info = getTrackInfo();
        const ready = info && info.title && info.title !== fromTitle && info.duration > 1 && video.readyState >= 2;
        LOG(`waitForReady poll #${attempts+1} — title="${info?.title}" dur=${info?.duration} rs=${video.readyState} ready=${ready}`);
        if (ready) {
            LOG(`waitForReady complete — "${info?.title}"`);
            callback();
        } else if (++attempts > 25) {
            WARN('waitForReady timed out — safety timer will unblock');
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
        const myId      = ++waitReadyId;
        LOG(`emptied fired — fromTitle="${fromTitle}" myId=${myId}`);
        lastTitle = lastState = lastElapsed = lastDuration = null;
        resetRpcDuration();
        songChanging = true;
        clearTimeout(songTimer);
        songTimer = setTimeout(() => {
            if (songChanging) {
                WARN('songTimer safety fired — song never loaded, unblocking');
                songChanging = false;
                sendUpdate(true);
            }
        }, 5000);
        waitForReady(video, fromTitle, () => {
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
    video.addEventListener('seeked', () => { LOG('seeked event'); sendUpdate(true); });
    setInterval(() => sendUpdate(false), 250);
});

startUrlWatcher(() => {
    const h = location.hostname;
    const p = location.pathname;
    const onVideoPage = (h === 'music.youtube.com' && p.startsWith('/watch')) ||
                        (h === 'www.youtube.com'   && (p.startsWith('/watch') || p.startsWith('/shorts/'))) ||
                        h === 'tv.youtube.com';
    LOG(`urlWatcher fired — onVideoPage=${onVideoPage} path=${p}`);
    if (!onVideoPage) {
        ++waitReadyId;
        clearTimeout(songTimer);
        songChanging = false;
        lastTitle = lastState = lastElapsed = lastDuration = null;
        sendUpdate(true);
    }
});

browserAPI.runtime.connect({ name: 'lifecycle' });
