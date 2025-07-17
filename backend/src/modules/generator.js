const { create } = require('xmlbuilder2');
const db = require('../database');

// This helper function is now self-contained
function getBaseUrl(req) {
    const settings = db.getSettings();
    if (settings && settings.publicUrlBase) {
        return settings.publicUrlBase;
    }
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${req.protocol}://${host}`;
}


function generateFinalSchedule(channel, adPool) {
    if (!channel || !channel.adSettings || !channel.adSettings.active || !adPool || adPool.length === 0) {
        return channel ? channel.schedule || [] : [];
    }
    const finalSchedule = [];
    const adSettings = channel.adSettings;
    let programCount = 0;
    let timeSinceLastAd = 0;
    (channel.schedule || []).forEach(program => {
        finalSchedule.push(program);
        programCount++;
        if(program.duration) timeSinceLastAd += program.duration;
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

function generateM3U(baseUrl, channelId) {
    const channel = db.getChannels().find(c => c.id === parseInt(channelId));
    if (!channel) return '#EXTM3U\n#EXTINF:-1,Error\nChannel not found';
    
    const adPool = db.getAdOptions();
    const finalSchedule = generateFinalSchedule(channel, adPool);
    
    let m3uContent = '#EXTM3U\n';
    
    finalSchedule.forEach(program => {
        m3uContent += `#EXTINF:${program.duration || -1}, tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.thumbnail}",${program.title}\n`;
        m3uContent += `${baseUrl}/stream/${program.id}\n`;
    });

    return m3uContent;
}

function generateXMLTV(baseUrl) {
    const channels = db.getChannels();
    const adPool = db.getAdOptions();
    
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('tv');

    channels.forEach(channel => {
        root.ele('channel', { id: channel.id })
            .ele('display-name').txt(channel.name).up()
            .ele('icon', { src: channel.thumbnail }).up();
    });

    channels.forEach(channel => {
        const finalSchedule = generateFinalSchedule(channel, adPool);
        let currentTime = new Date();
        currentTime.setHours(0,0,0,0);
        
        finalSchedule.forEach(program => {
            const start = new Date(currentTime);
            const stop = new Date(start.getTime() + (program.duration || 0) * 1000);
            
            const progElement = root.ele('programme', {
                start: formatDate(start),
                stop: formatDate(stop),
                channel: channel.id
            });
            
            progElement.ele('title', { lang: 'en' }).txt(program.title || 'Untitled').up();
            progElement.ele('desc', { lang: 'en' }).txt(program.summary || 'No description available.').up();
            progElement.ele('category', { lang: 'en' }).txt(program.category || 'General').up();

            if (program.thumbnail) {
                 progElement.ele('icon', { src: program.thumbnail }).up();
            }

            currentTime = stop;
        });
    });

    return root.end({ prettyPrint: true });
}

function formatDate(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
           `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())} +0000`;
}

module.exports = { generateM3U, generateXMLTV, getBaseUrl };