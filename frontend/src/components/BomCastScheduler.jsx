import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Avatar } from '@mui/material';

const API_URL = 'http://localhost:8000';
const DAY_WIDTH_PX = 4800; // Represents 24 hours
const HOUR_WIDTH_PX = DAY_WIDTH_PX / 24;

// --- Helper function to generate the final schedule with ads ---
const generateFinalSchedule = (channel, adPool) => {
    if (!channel || !channel.adSettings || !channel.adSettings.active) {
        return channel ? channel.schedule || [] : [];
    }

    const finalSchedule = [];
    const adSettings = channel.adSettings;
    let programCount = 0;
    let timeSinceLastAd = 0; // in seconds

    channel.schedule.forEach(program => {
        finalSchedule.push(program);
        programCount++;
        timeSinceLastAd += program.duration;

        let shouldInsertAds = false;
        if (adSettings.rule === 'programCount' && programCount >= adSettings.programsPerAd) {
            shouldInsertAds = true;
            programCount = 0;
        } else if (adSettings.rule === 'timedInterval' && timeSinceLastAd >= adSettings.intervalMinutes * 60) {
            shouldInsertAds = true;
            timeSinceLastAd = 0;
        }

        if (shouldInsertAds && adPool.length > 0) {
            for (let i = 0; i < adSettings.adCount; i++) {
                // Get a random ad from the pool
                const randomAd = adPool[Math.floor(Math.random() * adPool.length)];
                finalSchedule.push(randomAd);
            }
        }
    });

    return finalSchedule;
};


function BomCastScheduler({ refreshTrigger }) {
    const [channels, setChannels] = useState([]);
    const [adPool, setAdPool] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Fetch both channels and the ad options at the same time
        Promise.all([
            fetch(`${API_URL}/api/channels`),
            fetch(`${API_URL}/api/bomcast/ad-options`)
        ])
        .then(async ([channelsRes, adsRes]) => {
            if (!channelsRes.ok || !adsRes.ok) throw new Error("Failed to fetch data");
            const channelsData = await channelsRes.json();
            const adsData = await adsRes.json();
            setChannels(Array.isArray(channelsData) ? channelsData : []);
            setAdPool(Array.isArray(adsData) ? adsData : []);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }, [refreshTrigger]);

    const renderTimeMarkers = () => { /* ... unchanged ... */ };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Final Program Guide (with Ads)</Typography>
            <Paper sx={{ height: '75vh', display: 'flex', position: 'relative', overflow: 'auto' }}>
                <Box sx={{ width: '200px', position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>
                    {channels.map((channel) => (
                        <Box key={channel.id} sx={{ height: '80px', display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #333' }}>
                            <Avatar src={channel.thumbnail} variant="rounded" sx={{ mr: 1 }}>{channel.name.charAt(0)}</Avatar>
                            <Typography noWrap>{channel.number} - {channel.name}</Typography>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: '200px', width: `${DAY_WIDTH_PX}px`, minHeight: '100%' }}>
                    <Box sx={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>{renderTimeMarkers()}</Box>
                    <Box sx={{ position: 'relative', zIndex: 2 }}>
                        {channels.map((channel) => {
                            // Generate the final schedule with ads injected
                            const finalSchedule = generateFinalSchedule(channel, adPool);
                            let accumulatedDuration = 0;
                            return (
                                <Box key={channel.id} sx={{ height: '80px', position: 'relative', borderBottom: '1px solid #333' }}>
                                    {finalSchedule.map((program, programIndex) => {
                                        const programWidth = (program.duration / 3600) * HOUR_WIDTH_PX;
                                        const programOffset = (accumulatedDuration / 3600) * HOUR_WIDTH_PX;
                                        if (program.duration) { accumulatedDuration += program.duration; }
                                        
                                        // Use a different color for Ad Bumps to distinguish them
                                        const bgColor = program.category === 'Ad Bump' ? 'secondary.main' : 'primary.main';

                                        return (
                                            <Paper key={`${program.id}-${programIndex}`} sx={{ position: 'absolute', left: `${programOffset}px`, top: '5px', width: `${programWidth}px`, height: '70px', bgcolor: bgColor, color: 'primary.contrastText', p: 1, overflow: 'hidden', border: '1px solid #000' }}>
                                                <Typography noWrap variant="body2" sx={{ fontWeight: 'bold' }}>{program.title}</Typography>
                                                <Typography noWrap variant="caption">{program.category}</Typography>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

export default BomCastScheduler;