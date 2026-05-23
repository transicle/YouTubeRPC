function getService() {
    const { hostname, pathname } = location;
    if (hostname === 'music.youtube.com') return 'ytmusic';
    if (hostname === 'tv.youtube.com') return 'yttv';
    if (pathname.startsWith('/shorts/')) return 'ytshorts';
    const liveBadge = document.querySelector('.ytp-live-badge');
    if (liveBadge && liveBadge.offsetParent !== null) return 'ytlive';
    return 'youtube';
}

function getVideoId() {
    const service = getService();
    if (service === 'ytmusic') {
        const u = new URL(location.href);
        return u.searchParams.get('v') ?? null;
    }
    if (service === 'ytshorts') {
        const m = location.pathname.match(/^\/shorts\/([^/?]+)/);
        return m ? m[1] : null;
    }
    const u = new URL(location.href);
    return u.searchParams.get('v') ?? null;
}

function getThumbnailUrl() {
    const service = getService();
    if (service === 'ytmusic') {
        const art = navigator.mediaSession?.metadata?.artwork;
        if (art && art.length > 0) {
            const sorted = [...art].sort((a, b) => {
                const [aw] = (a.sizes || '0x0').split('x').map(Number);
                const [bw] = (b.sizes || '0x0').split('x').map(Number);
                return bw - aw;
            });
            return sorted[0].src;
        }
    }
    const id = getVideoId();
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
