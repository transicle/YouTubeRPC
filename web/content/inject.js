(function () {
    'use strict';
    const ms = navigator.mediaSession;
    const orig = ms.setPositionState?.bind(ms);
    if (!orig) return;

    ms.setPositionState = function (state) {
        if (state != null) {
            const dur = typeof state.duration === 'number' ? state.duration : null;
            const pos = typeof state.position === 'number' ? state.position : null;
            if (dur != null) document.documentElement.dataset.ytRpcDur = dur;
            if (pos != null) document.documentElement.dataset.ytRpcPos = pos;
            document.dispatchEvent(new CustomEvent('__ytRpcPosition', {
                detail: { duration: dur, position: pos }
            }));
        }
        return orig(state);
    };
})();
