const YouTube = require('youtube-sr').default;
const db = require('../database');

async function processYouTubeUrl(url) {
    try {
        // First, manually check if the URL is a playlist as a fallback.
        if (url.includes('playlist?list=')) {
            console.log('[Importer] Playlist URL pattern detected. Processing as playlist...');
            const playlist = await YouTube.getPlaylist(url, { fetchAll: true });
            
            if (!playlist) {
                return { success: false, message: 'Could not fetch playlist data. The playlist may be private or invalid.' };
            }

            const playlistTitle = playlist.title;
            console.log(`[Importer] Found ${playlist.videoCount} videos in playlist "${playlistTitle}". Adding to library...`);
            
            playlist.videos.forEach((video, index) => {
                if (video.title && video.id && video.duration) {
                    db.addMediaFile({
                        title: video.title,
                        duration: video.duration / 1000,
                        videoId: video.id,
                        thumbnail: video.thumbnail.url,
                        category: 'TV Show',
                        showName: playlistTitle,
                        season: '1',
                        episode: index + 1,
                        path: `https://www.youtube.com/watch?v=${video.id}`,
                        fileName: `yt-${video.id}`,
                    });
                }
            });
            return { success: true, type: 'playlist', count: playlist.videoCount };
        } 
        // If it's not a playlist, check if it's a single video.
        else if (YouTube.validate(url) === 'video') {
            console.log('[Importer] Single video detected.');
            const video = await YouTube.getVideo(url);
            db.addMediaFile({
                title: video.title,
                duration: video.duration / 1000,
                videoId: video.id,
                thumbnail: video.thumbnail.url,
                category: 'YouTube',
                path: `https://www.youtube.com/watch?v=${video.id}`,
                fileName: `yt-${video.id}`,
            });
            return { success: true, type: 'video', count: 1 };
        } 
        // If it's neither, then it's unsupported.
        else {
            return { success: false, message: 'Invalid or unsupported YouTube URL.' };
        }
    } catch (error) {
        console.error('Error processing YouTube URL:', error.message);
        return { success: false, message: error.message };
    }
}

module.exports = { processYouTubeUrl };