const { create } = require('xmlbuilder2');
const db = require('../database');
const { getAdOptions } = require('../database'); // Correctly import the function

// Helper to generate the final schedule with ads injected
function generateFinalSchedule(channel, adPool) {
    if (!channel || !channel.adSettings || !channel.adSettings.active || adPool.length === 0) {
        return channel ? channel.schedule || [] : [];
    }
    const finalSchedule = [];
    const adSettings = channel.adSettings;
    let programCount = 0;
    let timeSinceLastAd = 0;
    (channel.schedule || []).forEach(program => {
        finalSchedule.push(program);
        programCount++;
        if (program.duration) timeSinceLastAd += program.duration;
        let shouldInsertAds = false;
        if (adSettings.rule === 'programCount' && programCount >= adSettings.programsPerAd) {
            shouldInsertAds = true;
            programCount = 0;
        } else if (adSettings.rule === 'timedInterval' && timeSinceLastAd >= adSettings.intervalMinutes * 60) {
            shouldInsertAds = true;
            timeSinceLastAd = 0;
        }
        if (shouldInsertAds) {
            for (let i = 0; i < adSettings.adCount; i++) {
                finalSchedule.push(adPool[Math.floor(Math.random() * adPool.length)]);
            }
        }
    });
    return finalSchedule;
}

function generateM3U(serverUrl, channelId) {
    const channel = db.getChannels().find(c => c.id === parseInt(channelId));
    if (!channel) return '#EXTM3U\n#EXTINF:-1,Error\nChannel not found';
    
    const adPool = getAdOptions(); // This will now work
    const finalSchedule = generateFinalSchedule(channel, adPool);
    
    let m3uContent = '#EXTM3U\n';
    
    finalSchedule.forEach(program => {
        m3uContent += `#EXTINF:${program.duration || -1}, tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.thumbnail}",${program.title}\n`;
        m3uContent += `${serverUrl}/stream/${program.id}\n`;
    });
    return m3uContent;
}

// ... the rest of the file is unchanged ...
module.exports = { generateM3U /*, generateXMLTV */ }; // Temporarily remove XMLTV if it's not being used yet