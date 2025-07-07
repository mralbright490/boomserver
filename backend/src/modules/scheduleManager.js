/**
 * @file scheduleManager.js
 * @description Manages BomCast's scheduling logic, including creating and managing broadcast schedules.
 * @author Buzz for AP DreamStudios
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const axios = require('axios');

// BomCast's dedicated data directory (different from BoomServer's library.db)
const BOMCAST_DATA_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'BomCast');
if (!fs.existsSync(BOMCAST_DATA_DIR)) {
    fs.mkdirSync(BOMCAST_DATA_DIR, { recursive: true });
}

const BOMCAST_DB_PATH = path.join(BOMCAST_DATA_DIR, 'bomcast.db.json');
const adapter = new FileSync(BOMCAST_DB_PATH);
const db = low(adapter);

// Helper functions (defined before they are used in db.defaults or exported)
async function getAdOptionsInternal() {
    return db.get('adOptions').value();
}

async function updateAdOptionsInternal(options) {
    db.get('adOptions').assign(options).write();
    return { success: true, message: 'Ad options updated.', adOptions: db.get('adOptions').value() };
}

async function fetchMediaFromBoomServerInternal() {
    try {
        const response = await axios.get(`http://localhost:8000/api/media`);
        return response.data;
    } catch (error) {
        console.error('[BomCast ScheduleManager] Error fetching media from BoomServer (internal):', error.message);
        return [];
    }
}

function getNextAvailableStartTimeInternal(channelId) {
    const channelSchedule = db.get('schedule')
        .filter({ channelId: channelId })
        .sortBy('endTime')
        .value();

    if (channelSchedule.length === 0) {
        return 0;
    } else {
        const lastItem = channelSchedule[channelSchedule.length - 1];
        return lastItem.endTime;
    }
}

function recalculateChannelScheduleInternal(channelId) {
    let currentChannelItems = db.get('schedule')
        .filter({ channelId: channelId })
        .sortBy('startTime')
        .value();

    let currentTime = 0;

    currentChannelItems.forEach((item, index) => {
        if (index === 0) {
            item.startTime = (item.startTime !== undefined && item.startTime !== null) ? item.startTime : 0;
            currentTime = item.startTime;
        } else {
            const previousItem = currentChannelItems[index - 1];
            if (item.startTime < previousItem.endTime || item.startTime === undefined || item.startTime === null) {
                item.startTime = previousItem.endTime;
            }
            currentTime = item.startTime;
        }
        item.endTime = currentTime + item.duration;
        currentTime = item.endTime;
    });

    currentChannelItems.forEach(updatedItem => {
        db.get('schedule').find({ id: updatedItem.id }).assign(updatedItem).write();
    });
}

function shuffleArrayInternal(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Ensure default structure for BomCast's schedule
db.defaults({
    channels: [
        { id: 'main', name: 'Main Channel', description: 'Primary broadcast channel' },
        { id: 'ads', name: 'Ad Content', description: 'Dedicated channel for commercial breaks' }
    ],
    schedule: [],
    adOptions: {
        enabled: true,
        frequency: 1800,
        duration: 90,
        publicStreamBaseUrl: 'http://localhost:8000'
    }
}).write();

console.log(`[BomCast DB] Database ready at: ${BOMCAST_DB_PATH}`);

// Define the maximum duration to generate (REDUCED FOR TESTING CRASH)
const MAX_GENERATE_DURATION = 1 * 3600; // Currently 1 hour (was 15 mins for previous debugging)


// --- Exported Functions ---
module.exports = {
    getSchedule: async function() {
        console.log('[BomCast ScheduleManager] Fetching schedule...');
        return {
            channels: db.get('channels').value(),
            schedule: db.get('schedule').value(),
            message: 'Current schedule loaded.'
        };
    },

    addScheduledItem: async function(item) {
        console.log('[BomCast ScheduleManager] Adding item to schedule:', item);
        
        const startTime = getNextAvailableStartTimeInternal(item.channelId);

        const newItem = {
            id: Date.now(),
            ...item,
            startTime: startTime,
            endTime: startTime + item.duration
        };
        db.get('schedule').push(newItem).write();
        recalculateChannelScheduleInternal(newItem.channelId);
        return { success: true, message: 'Item added to schedule.', item: newItem };
    },

    removeScheduledItem: async function(itemId) {
        console.log('[BomCast ScheduleManager] Removing item from schedule:', itemId);
        const itemToRemove = db.get('schedule').find({ id: parseInt(itemId) }).value();
        if (!itemToRemove) {
            return { success: false, message: 'Item not found in schedule.' };
        }
        db.get('schedule').remove({ id: parseInt(itemId) }).write();
        recalculateChannelScheduleInternal(itemToRemove.channelId);
        return { success: true, message: 'Item removed from schedule.' };
    },

    updateScheduledItem: async function(itemId, updatedData) {
        console.log('[BomCast ScheduleManager] Updating scheduled item:', itemId, updatedData);
        
        const item = db.get('schedule').find({ id: parseInt(itemId) }).value();
        if (!item) {
            return { success: false, message: 'Scheduled item not found.' };
        }

        const oldChannelId = item.channelId;
        const newChannelId = updatedData.channelId || oldChannelId;

        db.get('schedule').find({ id: parseInt(itemId) }).assign(updatedData).write();

        if (oldChannelId !== newChannelId) {
            recalculateChannelScheduleInternal(oldChannelId);
        }
        recalculateChannelScheduleInternal(newChannelId);

        return { success: true, message: 'Scheduled item updated.', item: db.get('schedule').find({ id: parseInt(itemId) }).value() };
    },

    clearSchedule: async function() {
        console.log('[BomCast ScheduleManager] Clearing entire schedule...');
        db.set('schedule', []).write();
        return { success: true, message: 'Schedule cleared successfully.' };
    },

    shuffleSchedule: async function() {
        console.log('[BomCast ScheduleManager] Shuffling entire schedule...');
        const channels = db.get('channels').value();
        for (const channel of channels) {
            let channelItems = db.get('schedule').filter({ channelId: channel.id }).value();
            if (channelItems.length > 1) {
                channelItems = shuffleArrayInternal(channelItems);
                let currentStartTime = 0;
                for (const item of channelItems) {
                    db.get('schedule')
                        .find({ id: item.id })
                        .assign({ startTime: currentStartTime, endTime: currentStartTime + item.duration })
                        .write();
                    currentStartTime += item.duration;
                }
                recalculateChannelScheduleInternal(channel.id);
            }
        }
        return { success: true, message: 'Schedule shuffled successfully.' };
    },

    getAdOptions: getAdOptionsInternal,
    updateAdOptions: updateAdOptionsInternal,

    generateM3U: async function() {
        console.log('[BomCast ScheduleManager] Generating M3U playlist...');
        const schedule = db.get('schedule').value();
        const adOptions = await getAdOptionsInternal();
        const publicStreamBaseUrl = adOptions.publicStreamBaseUrl || 'http://localhost:8000';
        const allMedia = await fetchMediaFromBoomServerInternal();
        
        let mainChannelSchedule = schedule.filter(item => item.channelId === 'main').sort((a, b) => a.startTime - b.startTime);
        mainChannelSchedule = mainChannelSchedule.filter(item => item.startTime < MAX_GENERATE_DURATION);

        const adContentPool = schedule.filter(item => item.channelId === 'ads').sort((a, b) => a.id - b.id);
        
        let finalPlaylistItems = [];
        let currentGeneratedTime = 0;
        let nextAdBreakTime = adOptions.frequency;
        let adIndex = 0;

        for (const originalMainItem of mainChannelSchedule) { // Renamed loop variable to originalMainItem for clarity
            let remainingDurationInCurrentMainItem = originalMainItem.duration; // MODIFIED: Track remaining duration separately
            
            // If the start of this main item is beyond max generation duration, skip
            if (currentGeneratedTime >= MAX_GENERATE_DURATION) break;

            while (adOptions.enabled && adContentPool.length > 0 && remainingDurationInCurrentMainItem > 0 && currentGeneratedTime + remainingDurationInCurrentMainItem > nextAdBreakTime) {
                const timeUntilBreak = nextAdBreakTime - currentGeneratedTime;

                if (timeUntilBreak > 0) {
                    finalPlaylistItems.push({
                        ...originalMainItem, // Use original item properties
                        duration: timeUntilBreak,
                        isAdBreak: false
                    });
                }
                currentGeneratedTime += timeUntilBreak;
                remainingDurationInCurrentMainItem -= timeUntilBreak; // Consume time from this segment

                // Stop if we've consumed all of the original main item or exceeded max gen duration
                if (remainingDurationInCurrentMainItem <= 0 || currentGeneratedTime >= MAX_GENERATE_DURATION) break;


                // Insert ad break
                const adsForBreak = [];
                let currentAdBreakDuration = 0;
                let adCounter = 0;

                while (currentAdBreakDuration < adOptions.duration && adCounter < adContentPool.length * 2) {
                    const adToPlay = adContentPool[adIndex % adContentPool.length];
                    const mediaFileUrl = allMedia.find(m => m.id === adToPlay.mediaId)?.path;
                    
                    if (mediaFileUrl && adToPlay.duration > 0 && currentAdBreakDuration + adToPlay.duration <= adOptions.duration) {
                        adsForBreak.push({
                            ...adToPlay,
                            url: mediaFileUrl,
                            isAdBreak: true
                        });
                        currentAdBreakDuration += adToPlay.duration;
                        adIndex++;
                    } else if (mediaFileUrl && adToPlay.duration > 0) {
                        adsForBreak.push({
                            ...adToPlay,
                            duration: adOptions.duration - currentAdBreakDuration,
                            url: mediaFileUrl,
                            isAdBreak: true
                        });
                        currentAdBreakDuration = adOptions.duration;
                        adIndex++;
                    } else {
                        adIndex++; // Skip ad if URL not found or duration is zero
                    }
                    adCounter++;
                }
                finalPlaylistItems.push(...adsForBreak);
                currentGeneratedTime += adOptions.duration; // Advance time past ad break
                nextAdBreakTime = currentGeneratedTime + adOptions.frequency; // Schedule next ad break
            }
            
            // Add the remaining part of the original main item after all potential ad breaks
            if (remainingDurationInCurrentMainItem > 0 && currentGeneratedTime < MAX_GENERATE_DURATION) {
                finalPlaylistItems.push({
                    ...originalMainItem, // Use original item properties
                    duration: remainingDurationInCurrentMainItem, // Add the remaining duration
                    isAdBreak: false
                });
                currentGeneratedTime += remainingDurationInCurrentMainItem;
            }
        }

        let m3uContent = '#EXTM3U\n';
        finalPlaylistItems.forEach(item => {
            const itemMedia = allMedia.find(m => m.id === item.mediaId);
            if (itemMedia && itemMedia.path) {
                const mediaUrl = `${publicStreamBaseUrl}/media/${path.basename(itemMedia.path)}`;
                const durationTag = item.duration; // Use the actual segment duration

                m3uContent += `#EXTINF:${durationTag},${item.title}\n`;
                m3uContent += `${mediaUrl}\n`;
            } else {
                console.warn(`[BomCast M3U] Media URL not found for item: ${item.title}`);
            }
        });

        const m3uFileName = `bomcast_playlist_${Date.now()}.m3u`;
        const m3uFilePath = path.join(BOMCAST_DATA_DIR, m3uFileName);
        await fs.promises.writeFile(m3uFilePath, m3uContent);

        return {
            success: true,
            url: `${publicStreamBaseUrl}/bomcast_playlists/${m3uFileName}`,
            message: 'M3U playlist generated.'
        };
    },

    generateEPG: async function() {
        console.log('[BomCast ScheduleManager] Generating EPG file...');
        const schedule = db.get('schedule').value();
        const adOptions = await getAdOptionsInternal();
        const publicStreamBaseUrl = adOptions.publicStreamBaseUrl || 'http://localhost:8000';
        const allMedia = await fetchMediaFromBoomServerInternal();

        let mainChannelSchedule = schedule.filter(item => item.channelId === 'main').sort((a, b) => a.startTime - b.startTime);
        mainChannelSchedule = mainChannelSchedule.filter(item => item.startTime < MAX_GENERATE_DURATION);

        const adContentPool = schedule.filter(item => item.channelId === 'ads').sort((a, b) => a.id - b.id);
        
        let finalProgramList = [];
        let currentGeneratedTime = 0;
        let nextAdBreakTime = adOptions.frequency;
        let adIndex = 0;

        const startDateTime = new Date();
        startDateTime.setHours(0, 0, 0, 0);

        for (const originalMainItem of mainChannelSchedule) { // Renamed loop variable
            let remainingDurationInCurrentMainItem = originalMainItem.duration; // Track remaining duration
            
            if (currentGeneratedTime >= MAX_GENERATE_DURATION) break;

            while (adOptions.enabled && adContentPool.length > 0 && remainingDurationInCurrentMainItem > 0 && currentGeneratedTime + remainingDurationInCurrentMainItem > nextAdBreakTime) {
                const timeUntilBreak = nextAdBreakTime - currentGeneratedTime;

                if (timeUntilBreak > 0) {
                    finalProgramList.push({
                        ...originalMainItem,
                        displayDuration: timeUntilBreak,
                        absoluteStartTime: new Date(startDateTime.getTime() + currentGeneratedTime * 1000),
                        isAdBreak: false
                    });
                }
                currentGeneratedTime += timeUntilBreak;
                remainingDurationInCurrentMainItem -= timeUntilBreak;

                if (remainingDurationInCurrentMainItem <= 0 || currentGeneratedTime >= MAX_GENERATE_DURATION) break;

                let currentAdBreakDuration = 0;
                let adsInBreakCounter = 0;
                let adsContentTitles = [];

                while (currentAdBreakDuration < adOptions.duration && adsInBreakCounter < adContentPool.length * 2) {
                    const adToInclude = adContentPool[adIndex % adContentPool.length];
                    if (currentAdBreakDuration + adToInclude.duration <= adOptions.duration) {
                        currentAdBreakDuration += adToInclude.duration;
                        adsContentTitles.push(adToInclude.title);
                        adIndex++;
                    } else if (adToInclude.duration > 0) {
                        currentAdBreakDuration = adOptions.duration;
                        adsContentTitles.push(adToInclude.title);
                        adIndex++;
                    } else {
                        adIndex++;
                    }
                    adsInBreakCounter++;
                }

                finalProgramList.push({
                    title: 'Commercial Break',
                    description: `Ads: ${adsContentTitles.join(', ')}`,
                    displayDuration: adOptions.duration,
                    absoluteStartTime: new Date(startDateTime.getTime() + currentGeneratedTime * 1000),
                    isAdBreak: true
                });
                currentGeneratedTime += adOptions.duration;
                nextAdBreakTime = currentGeneratedTime + adOptions.frequency;

                // Do not deduct from originalMainItem.duration here, as we are using remainingDurationInCurrentMainItem
            }

            const remainingDuration = remainingDurationInCurrentMainItem; // Use remaining duration after splits
            if (remainingDuration > 0 && currentGeneratedTime < MAX_GENERATE_DURATION) {
                finalProgramList.push({
                    ...originalMainItem,
                    displayDuration: remainingDuration,
                    absoluteStartTime: new Date(startDateTime.getTime() + currentGeneratedTime * 1000),
                    isAdBreak: false
                });
                currentGeneratedTime += remainingDuration;
            }
        }

        let epgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<tv date="${new Date().toISOString().split('T')[0].replace(/-/g, '')}" generator-info-name="BomCast EPG Generator">\n`;
        epgContent += `  <channel id="main.bomcasttv">\n    <display-name>Main Channel</display-name>\n  </channel>\n`;

        finalProgramList.forEach(program => {
            const startIso = program.absoluteStartTime.toISOString();
            const endIso = new Date(program.absoluteStartTime.getTime() + program.displayDuration * 1000).toISOString();

            epgContent += `  <programme start="${startIso.replace(/[-:]|\..*$/g, '')} +0000" stop="${endIso.replace(/[-:]|\..*$/g, '')} +0000" channel="main.bomcasttv">\n`;
            epgContent += `    <title lang="en">${program.title}</title>\n`;
            epgContent += `    <desc lang="en">${program.description || 'No description available.'}</desc>\n`;
            epgContent += `  </programme>\n`;
        });

        epgContent += `</tv>`;

        const epgFileName = `bomcast_epg_${Date.now()}.xml`;
        const epgFilePath = path.join(BOMCAST_DATA_DIR, epgFileName);
        await fs.promises.writeFile(epgFilePath, epgContent);

        return {
            success: true,
            url: `${publicStreamBaseUrl}/bomcast_epgs/${epgFileName}`,
            message: 'EPG file generated.'
        };
    },

    fetchMediaFromBoomServer: fetchMediaFromBoomServerInternal
};