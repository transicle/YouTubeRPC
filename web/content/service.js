function getService() {
    const { hostname, pathname } = location;
    if (hostname === 'music.youtube.com') return 'ytmusic';
    if (hostname === 'tv.youtube.com') return 'yttv';
    if (pathname.startsWith('/shorts/')) return 'ytshorts';
    if (document.querySelector('.ytp-live-badge')) return 'ytlive';
    return 'youtube';
}
