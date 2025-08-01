const path = require('path');
const fs = require('fs');
const os = require('os');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DATA_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'BoomServer');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'library.db.json');
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

function initialize() {
    db.defaults({
        library_paths: [],
        media_files: [],
        channels: [],
        settings: { publicUrlBase: '' }
    }).write();
    console.log(`[DATABASE] Database ready at: ${DB_PATH}`);
}

const getLibraryPaths = () => db.get('library_paths').value();
const addLibraryPath = (path) => { const newPath = { id: Date.now(), path }; db.get('library_paths').push(newPath).write(); return newPath; };
const deleteLibraryPath = (id) => { db.get('library_paths').remove({ id: parseInt(id) }).write(); return { deleted: 1 }; };
const getMediaByPath = (filePath) => db.get('media_files').find({ path: filePath }).value();
const addMediaFile = (file) => { const newFile = { id: Date.now(), ...file, title: file.title || file.fileName, summary: file.summary || '', category: file.category || 'Uncategorized', showName: file.showName || '', season: file.season || '', episode: file.episode || '', videoId: file.videoId || null, thumbnail: file.thumbnail || null }; db.get('media_files').push(newFile).write(); return newFile; };
const getMediaFiles = () => db.get('media_files').sortBy('file_name').value();
const updateMediaFile = (id, data) => { db.get('media_files').find({ id: parseInt(id) }).assign({ title: data.title, summary: data.summary, category: data.category, showName: data.showName, season: data.season, episode: data.episode }).write(); return { updated: 1 }; };
const deleteMediaFile = (id) => { db.get('media_files').remove({ id: parseInt(id) }).write(); return { message: 'Media file removed from library.' }; };
const purgeMediaStore = async () => { db.set('media_files', []).write(); console.log('[DATABASE] Media store has been purged.'); return { message: 'Media library purged successfully.' }; };
const getAdOptions = () => db.get('media_files').filter({ category: 'Ad Bump' }).value();
const getChannels = () => db.get('channels').value();
const addChannel = (channelData) => { const newChannel = { id: Date.now(), name: channelData.name, number: parseInt(channelData.number), thumbnail: channelData.thumbnail, m3uFileName: `${channelData.name.replace(/[^a-zA-Z0-9]/g, '_')}.m3u`, schedule: [], adSettings: { active: false, rule: 'programCount', programsPerAd: 3, adCount: 1, intervalMinutes: 30 } }; db.get('channels').push(newChannel).write(); return newChannel; };
const deleteChannel = (id) => { db.get('channels').remove({ id: parseInt(id) }).write(); return { deleted: 1 }; };
const updateChannel = (id, data) => { db.get('channels').find({ id: parseInt(id) }).assign({ name: data.name, number: parseInt(data.number), thumbnail: data.thumbnail, adSettings: data.adSettings, m3uFileName: data.m3uFileName }).write(); return { updated: 1 }; };
const updateScheduleForChannel = (channelId, schedule) => { db.get('channels').find({ id: parseInt(channelId) }).assign({ schedule }).write(); return { success: true }; };
const addMediaToChannelSchedule = (channelId, mediaId) => { const channelChain = db.get('channels').find({ id: parseInt(channelId) }); const mediaItem = db.get('media_files').find({ id: parseInt(mediaId) }).value(); if (channelChain.value() && mediaItem) { channelChain.get('schedule').push(mediaItem).write(); return { success: true, item: mediaItem }; } return { success: false, message: 'Channel or Media item not found' }; };
const addMultipleMediaToChannelSchedule = (channelId, mediaIds) => { const channelChain = db.get('channels').find({ id: parseInt(channelId) }); if (!channelChain.value()) { return { success: false, message: 'Channel not found' }; } const mediaItems = db.get('media_files').filter(file => mediaIds.includes(file.id)).value(); if (mediaItems.length > 0) { const currentSchedule = channelChain.get('schedule').value(); const newSchedule = currentSchedule.concat(mediaItems); channelChain.assign({ schedule: newSchedule }).write(); return { success: true, count: mediaItems.length }; } return { success: false, message: 'No valid media items found' }; };
const bulkUpdateCategory = (mediaIds, category) => { db.get('media_files').filter(file => mediaIds.includes(file.id)).forEach(file => { db.get('media_files').find({ id: file.id }).assign({ category: category }).write(); }).value(); return { success: true, updated: mediaIds.length }; };
const getSettings = () => db.get('settings').value();
const updateSettings = (newSettings) => { db.set('settings', newSettings).write(); return db.get('settings').value(); };

module.exports = { initialize, getLibraryPaths, addLibraryPath, deleteLibraryPath, getMediaByPath, addMediaFile, getMediaFiles, updateMediaFile, deleteMediaFile, purgeMediaStore, getAdOptions, getChannels, addChannel, deleteChannel, updateChannel, updateScheduleForChannel, addMediaToChannelSchedule, addMultipleMediaToChannelSchedule, bulkUpdateCategory, getSettings, updateSettings };