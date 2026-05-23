// Duration captured from the page via inject.js (MAIN world).
// inject.js caches the value in document.documentElement.dataset.ytRpcDur so
// we can read it even if all setPositionState calls happened before this
// isolated-world script loaded (document_start vs document_idle gap).
let _ytRpcDuration = null;

(function () {
    const cached = document.documentElement.dataset.ytRpcDur;
    if (cached != null) _ytRpcDuration = Math.round(Number(cached));
})();

document.addEventListener('__ytRpcPosition', (e) => {
    if (e.detail.duration != null) _ytRpcDuration = Math.round(e.detail.duration);
});

function resetRpcDuration() {
    _ytRpcDuration = null;
}

function getTrackInfo() {
    const meta  = navigator.mediaSession.metadata;
    let   state = navigator.mediaSession.playbackState;

    if (state === 'none') {
        const video = document.querySelector('video');
        if (video) state = video.paused ? 'paused' : 'playing';
    }

    if (!meta) return null;

    const video    = document.querySelector('video');
    const elapsed  = video ? Math.floor(video.currentTime) : null;
    // Prefer setPositionState duration; fall back to video.duration (less accurate)
    const raw      = _ytRpcDuration ?? (video ? Math.floor(video.duration) : null);
    const duration = (raw && isFinite(raw) && raw > 0) ? raw : null;

    return {
        title:     meta.title   || null,
        artist:    meta.artist  || null,
        state,
        elapsed,
        duration
    };
}
