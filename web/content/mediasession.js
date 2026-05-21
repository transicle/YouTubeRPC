function getTrackInfo() {
    const meta  = navigator.mediaSession.metadata;
    let   state = navigator.mediaSession.playbackState;

    if (state === 'none') {
        const video = document.querySelector('video');
        if (video) state = video.paused ? 'paused' : 'playing';
    }

    if (!meta) return null;

    const video   = document.querySelector('video');
    const elapsed = video ? Math.floor(video.currentTime) : null;
    const dur     = video ? Math.floor(video.duration)    : null;
    const duration = (dur && isFinite(dur) && dur > 0) ? dur : null;

    return {
        title:     meta.title   || null,
        artist:    meta.artist  || null,
        state,
        elapsed,
        duration
    };
}
