const YouTube = require('youtube-sr').default;
const db = require('../database');

async function processYouTubeUrl(url) {
    try {
        if (url.includes('playlist?list=')) {
            const playlist = await YouTube.getPlaylist(url, { fetchAll: true });
            if (!playlist) { return { success: false, message: 'Could not fetch playlist data. The playlist may be private or invalid.' }; }
            const playlistTitle = playlist.title;
            playlist.videos.forEach((video, index) => { if (video.title && video.id && video.duration) { db.addMediaFile({ title: video.title, duration: video.duration / 1000, videoId: video.id, thumbnail: video.thumbnail.url, category: 'TV Show', showName: playlistTitle, season: '1', episode: index + 1, path: `https://www.youtube.com/watch?v=${video.id}`, fileName: `yt-${video.id}`, }); } });
            return { success: true, type: 'playlist', count: playlist.videoCount };
        } 
        else if (YouTube.validate(url) === 'video') {
            const video = await YouTube.getVideo(url);
            db.addMediaFile({ title: video.title, duration: video.duration / 1000, videoId: video.id, thumbnail: video.thumbnail.url, category: 'YouTube', path: `https://www.youtube.com/watch?v=${video.id}`, fileName: `yt-${video.id}`, });
            return { success: true, type: 'video', count: 1 };
        } 
        else { return { success: false, message: 'Invalid or unsupported YouTube URL.' }; }
    } catch (error) { console.error('Error processing YouTube URL:', error.message); return { success: false, message: error.message }; }
}
module.exports = { processYouTubeUrl };