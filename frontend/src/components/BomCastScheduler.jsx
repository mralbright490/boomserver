import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Avatar, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Shuffle as ShuffleIcon, ClearAll as ClearAllIcon, Delete as DeleteItemIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';
const DAY_WIDTH_PX = 4800;
const HOUR_WIDTH_PX = DAY_WIDTH_PX / 24;

function BomCastScheduler({ allChannels, onUpdate }) {
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [adPool, setAdPool] = useState([]);
    
    const currentChannel = allChannels.find(c => c.id === selectedChannelId);

    useEffect(() => {
        if (allChannels.length > 0 && !allChannels.some(c => c.id === selectedChannelId)) {
            setSelectedChannelId(allChannels[0].id);
        }
        fetch(`${API_URL}/api/bomcast/ad-options`).then(res => res.json()).then(data => setAdPool(data || []));
    }, [allChannels, selectedChannelId]);

    const handleSaveSchedule = (newSchedule) => {
        if (!selectedChannelId) return;
        fetch(`${API_URL}/api/channels/${selectedChannelId}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: newSchedule })
        }).then(() => onUpdate && onUpdate());
    };

    const handleShuffle = () => { if (!currentChannel) return; const schedule = [...currentChannel.schedule]; for (let i = schedule.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [schedule[i], schedule[j]] = [schedule[j], schedule[i]]; } handleSaveSchedule(schedule); };
    const handleClearSchedule = () => { if (window.confirm(`Are you sure you want to clear the entire schedule for "${currentChannel.name}"?`)) { handleSaveSchedule([]); } };
    const handleDeleteItem = (programIndex) => { if (!currentChannel || !currentChannel.schedule) return; const newSchedule = currentChannel.schedule.filter((_, index) => index !== programIndex); handleSaveSchedule(newSchedule); };
    
    const generateFinalSchedule = () => {
        if (!currentChannel) return [];
        const adSettings = currentChannel.adSettings;
        if (!adSettings || !adSettings.active || !adPool || adPool.length === 0) {
            return currentChannel.schedule || [];
        }
        const finalSchedule = [];
        let programCount = 0;
        let timeSinceLastAd = 0;
        (currentChannel.schedule || []).forEach(program => {
            finalSchedule.push(program);
            programCount++;
            if (program.duration) timeSinceLastAd += program.duration;
            let shouldInsertAds = false;
            if (adSettings.rule === 'programCount' && programCount >= adSettings.programsPerAd) { shouldInsertAds = true; programCount = 0; }
            else if (adSettings.rule === 'timedInterval' && timeSinceLastAd >= adSettings.intervalMinutes * 60) { shouldInsertAds = true; timeSinceLastAd = 0; }
            if (shouldInsertAds) {
                for (let i = 0; i < adSettings.adCount; i++) { finalSchedule.push(adPool[Math.floor(Math.random() * adPool.length)]); }
            }
        });
        return finalSchedule;
    };

    const renderTimeMarkers = () => { const markers = []; for (let i = 0; i < 48; i++) { const time = new Date(); const minutes = (i % 2) * 30; time.setHours(Math.floor(i / 2), minutes, 0, 0); const label = minutes === 0 ? time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(' ', '') : `:${time.getMinutes()}`; markers.push(<Box key={i} sx={{ position: 'absolute', left: `${i * (HOUR_WIDTH_PX / 2)}px`, width: `${HOUR_WIDTH_PX / 2}px`, textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', color: 'text.secondary', height: '100%', pt: 0.5 }}><Typography variant="caption">{label}</Typography></Box>); } return markers; };
    
    if (!allChannels.length) return <Typography sx={{p:3, textAlign: 'center'}}>Create a channel on the "Channels" tab to get started.</Typography>;
    
    const finalSchedule = generateFinalSchedule();

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5">Program Guide</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl sx={{ minWidth: 250 }} size="small">
                        <InputLabel>Edit Channel</InputLabel>
                        <Select value={selectedChannelId} label="Edit Channel" onChange={(e) => setSelectedChannelId(e.target.value)}>
                            {allChannels.map(channel => <MenuItem key={channel.id} value={channel.id}>{channel.number} - {channel.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Tooltip title="Shuffle Schedule"><Button variant="contained" color="secondary" onClick={handleShuffle} disabled={!currentChannel || !currentChannel.schedule || currentChannel.schedule.length < 2}><ShuffleIcon /></Button></Tooltip>
                    <Tooltip title="Clear Entire Schedule"><Button variant="contained" color="error" onClick={handleClearSchedule} disabled={!currentChannel || !currentChannel.schedule || currentChannel.schedule.length === 0}><ClearAllIcon /></Button></Tooltip>
                </Box>
            </Box>

            <Paper sx={{ height: '75vh', display: 'flex', position: 'relative', overflow: 'auto' }}>
                <Box sx={{ width: '200px', position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>
                    {currentChannel ? (<Box sx={{ height: '80px', display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #333' }}><Avatar src={currentChannel.thumbnail} variant="rounded" sx={{ mr: 1 }}>{currentChannel.name.charAt(0)}</Avatar><Typography noWrap>{currentChannel.number} - {currentChannel.name}</Typography></Box>) : <Box sx={{height: '80px'}} />}
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: '200px', width: `${DAY_WIDTH_PX}px`, minHeight: '100%' }}>
                    <Box sx={{ position: 'sticky', top: 0, zIndex: 1, height: '30px', bgcolor: 'background.paper' }}>{renderTimeMarkers()}</Box>
                    {currentChannel ? (
                        <Box sx={{ height: '80px', position: 'relative' }}>
                            {finalSchedule.reduce((acc, program, programIndex) => {
                                const isAd = program.category === 'Ad Bump';
                                const originalIndex = (currentChannel.schedule || []).findIndex(p => p.id === program.id && p.title === program.title);
                                const programWidth = ((program.duration || 0) / 3600) * HOUR_WIDTH_PX;
                                const programOffset = (acc.duration / 3600) * HOUR_WIDTH_PX;
                                if (program.duration) { acc.duration += program.duration; }
                                const bgColor = isAd ? 'linear-gradient(45deg, #f50057 30%, #ff8a80 90%)' : 'linear-gradient(45deg, #00e5ff 30%, #1a1a3d 90%)';
                                acc.elements.push(
                                    <Paper key={`${program.id}-${programIndex}`} sx={{ position: 'absolute', left: `${programOffset}px`, top: '5px', width: `${programWidth}px`, height: '70px', background: bgColor, color: 'primary.contrastText', p: 1, overflow: 'hidden', border: '1px solid #000', boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)', '&:hover .delete-btn': { opacity: 1 } }}>
                                        <Typography noWrap variant="body2" sx={{ fontWeight: 'bold' }}>{program.title}</Typography>
                                        <Typography noWrap variant="caption">{program.category}</Typography>
                                        {!isAd && ( <IconButton size="small" className="delete-btn" onClick={() => handleDeleteItem(originalIndex)} sx={{ position: 'absolute', top: 0, right: 0, zIndex: 4, opacity: 0, transition: 'opacity 0.2s', color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}><DeleteItemIcon fontSize="small" /></IconButton> )}
                                    </Paper>
                                );
                                return acc;
                            }, { duration: 0, elements: [] }).elements}
                        </Box>
                    ) : null }
                </Box>
            </Paper>
        </Box>
    );
}

export default BomCastScheduler;