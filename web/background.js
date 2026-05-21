const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const tabStates   = new Map();
let   port        = null;
let   lastSent    = null;
let   keepAliveId = null;

const PRIORITY = { ytmusic: 0, youtube: 1, ytshorts: 2, ytlive: 3, yttv: 4 };

browserAPI.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install')
        browserAPI.tabs.create({ url: browserAPI.runtime.getURL('pages/install.html') });
});

function getPort() {
    if (!port) {
        try {
            port = browserAPI.runtime.connectNative('com.youtuberpc.host');
        } catch (e) {
            console.warn('[YouTubeRPC] connectNative failed:', e?.message);
            port = null;
            return null;
        }

        port.onMessage.addListener((msg) => {
            if (msg?.action === 'pong') return;
        });

        port.onDisconnect.addListener(() => {
            port      = null;
            lastSent  = null;
            stopKeepAlive();
        });

        pingHost();
        startKeepAlive();
    }
    return port;
}

function pingHost() {
    try { port?.postMessage({ action: 'ping' }); } catch { port = null; }
}

function startKeepAlive() {
    stopKeepAlive();
    keepAliveId = setInterval(() => {
        if (port) pushUpdate(true);
    }, 10_000);
}

function stopKeepAlive() {
    if (keepAliveId !== null) { clearInterval(keepAliveId); keepAliveId = null; }
}

function getBestState() {
    let best = null;
    for (const state of tabStates.values()) {
        if (!best) { best = state; continue; }
        const bPlay = best.state  === 'playing';
        const tPlay = state.state === 'playing';
        if (tPlay && !bPlay) { best = state; continue; }
        if (!tPlay && bPlay) continue;
        if ((PRIORITY[state.service] ?? 99) < (PRIORITY[best.service] ?? 99)) best = state;
    }
    return best;
}

function pushUpdate(force = false) {
    const best    = getBestState();
    const payload = best ?? { state: 'stopped' };
    const json    = JSON.stringify(payload);

    if (!force && json === lastSent) return;
    lastSent = json;

    const p = getPort();
    if (!p) return;
    try {
        p.postMessage(payload);
    } catch {
        port = null; lastSent = null;
    }
}

browserAPI.runtime.onMessage.addListener((message, sender) => {
    if (!sender.tab) return;

    const { id: tabId } = sender.tab;
    const isStop = !message.title && message.state === 'stopped';

    if (isStop) tabStates.delete(tabId);
    else        tabStates.set(tabId, message);

    pushUpdate();
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
    if (tabStates.delete(tabId)) pushUpdate(true);
});

