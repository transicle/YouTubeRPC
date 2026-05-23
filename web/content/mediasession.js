function getTrackInfo() {
    const meta = navigator.mediaSession.metadata;
    let state = navigator.mediaSession.playbackState;

    if (state === 'none') {
        const video = document.querySelector('video');
        if (video) state = video.paused ? 'paused' : 'playing';
    }

    if (!meta) return null;

    return {
        title: meta.title || null,
        artist: meta.artist || null,
        state
    };
}
