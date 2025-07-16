import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Avatar } from '@mui/material';

const API_URL = 'http://localhost:8000';
const DAY_WIDTH_PX = 4800;
const HOUR_WIDTH_PX = DAY_WIDTH_PX / 24;

function BomCastScheduler({ refreshTrigger }) {
    const [channels, setChannels] = useState([]);
    const [adPool, setAdPool] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const generateFinalSchedule = (channel) => {
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
    };

    useEffect(() => {
        setIsLoading(true);
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

    const renderTimeMarkers = () => {
        const markers = [];
        for (let i = 0; i < 24; i++) {
            const time = new Date();
            time.setHours(i, 0, 0, 0);
            markers.push(<Box key={i} sx={{ position: 'absolute', left: `${i * HOUR_WIDTH_PX}px`, width: `${HOUR_WIDTH_PX}px`, textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.2)', color: 'text.secondary', height: '100%', pt: 0.5 }}><Typography variant="caption">{time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false })}</Typography></Box>);
        }
        return markers;
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Final Program Guide (with Ads)</Typography>
            <Paper sx={{ height: '75vh', display: 'flex', position: 'relative', overflow: 'auto' }}>
                <Box sx={{ width: '200px', position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>
                    {(channels || []).map((channel) => (
                        <Box key={channel.id} sx={{ height: '80px', display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #333' }}>
                            <Avatar src={channel.thumbnail} variant="rounded" sx={{ mr: 1 }}>{channel.name ? channel.name.charAt(0) : 'C'}</Avatar>
                            <Typography noWrap>{channel.number} - {channel.name}</Typography>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: '200px', width: `${DAY_WIDTH_PX}px`, minHeight: '100%' }}>
                    <Box sx={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>{renderTimeMarkers()}</Box>
                    <Box sx={{ position: 'relative', zIndex: 2 }}>
                        {(channels || []).map((channel) => {
                            const finalSchedule = generateFinalSchedule(channel);
                            let accumulatedDuration = 0;
                            return (
                                <Box key={channel.id} sx={{ height: '80px', position: 'relative', borderBottom: '1px solid #333' }}>
                                    {(finalSchedule || []).map((program, programIndex) => {
                                        const programWidth = ((program.duration || 0) / 3600) * HOUR_WIDTH_PX;
                                        const programOffset = (accumulatedDuration / 3600) * HOUR_WIDTH_PX;
                                        if (program.duration) { accumulatedDuration += program.duration; }
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