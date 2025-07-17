const YouTube = require('youtube-sr').default;
const db = require('../database');

// These Regular Expressions will reliably determine the URL type.
const PLAYLIST_REGEX = /[?&]list=([^#\&\?]+)/;
const VIDEO_REGEX = /(?:.be\/|v=)([\w-]{11})/;

async function processYouTubeUrl(url) {
    try {
        const isPlaylist = PLAYLIST_REGEX.test(url);
        const isVideo = VIDEO_REGEX.test(url);

        // THE FIX: We now check for a playlist FIRST. This is the most specific case.
        // A URL can be both a video and part of a playlist, but we want to treat it as a playlist import.
        if (isPlaylist) {
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
        // If it's not a playlist, THEN check if it's a single video.
        else if (isVideo) {
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