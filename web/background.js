const tabStates = new Map();
let port = null;

const PRIORITY = {
    ytmusic: 0,
    youtube: 1,
    ytshorts: 2,
    ytlive: 3,
    yttv: 4
};

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('pages/install.html') });
    }
});

function getPort() {
    if (!port) {
        port = chrome.runtime.connectNative('com.youtuberpc.host');
        port.onDisconnect.addListener(() => { port = null; });
    }
    return port;
}

function getBestState() {
    let best = null;

    for (const state of tabStates.values()) {
        if (!best) { best = state; continue; }

        const bestPlaying = best.state === 'playing';
        const thisPlaying = state.state === 'playing';

        if (thisPlaying && !bestPlaying) { best = state; continue; }
        if (!thisPlaying && bestPlaying) continue;

        if ((PRIORITY[state.service] ?? 99) < (PRIORITY[best.service] ?? 99)) {
            best = state;
        }
    }

    return best;
}

function pushUpdate() {
    const best = getBestState();
    try {
        getPort().postMessage(best ?? { state: 'stopped' });
    } catch {
        port = null;
    }
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (!sender.tab) return;

    if (!message.title && message.state === 'stopped') {
        tabStates.delete(sender.tab.id);
    } else {
        tabStates.set(sender.tab.id, message);
    }

    pushUpdate();
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabStates.delete(tabId)) pushUpdate();
});
