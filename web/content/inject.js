// Runs in the MAIN (page) world.
// Intercepts navigator.mediaSession.setPositionState so we can read the real
// per-track duration, which YouTube Music never exposes through video.duration
// (it uses DASH adaptive streaming where video.duration is the buffer end, not
// the track length).
(function () {
    'use strict';
    const ms   = navigator.mediaSession;
    const orig = ms.setPositionState?.bind(ms);
    if (!orig) return;

    ms.setPositionState = function (state) {
        if (state != null) {
            const dur = typeof state.duration === 'number' ? state.duration : null;
            const pos = typeof state.position === 'number' ? state.position : null;
            // Cache on the DOM so the isolated-world content script can read it
            // even if it loads after this fires (document_start vs document_idle).
            if (dur != null) document.documentElement.dataset.ytRpcDur = dur;
            document.dispatchEvent(new CustomEvent('__ytRpcPosition', {
                detail: { duration: dur, position: pos }
            }));
        }
        return orig(state);
    };
})();
