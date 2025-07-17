import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Divider } from '@mui/material';
import { Shuffle as ShuffleIcon, ClearAll as ClearAllIcon, Delete as DeleteItemIcon, ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function BomCastScheduler({ allChannels, onUpdate, refreshTrigger }) {
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [isLoading, setIsLoading] = useState(false); // No initial loading, parent handles that.

    // Memoize the current channel to avoid recalculating on every render
    const currentChannel = React.useMemo(() => 
        allChannels.find(c => c.id === selectedChannelId),
        [allChannels, selectedChannelId]
    );

    // This hook simply sets a default selection when the component first gets the channel list
    useEffect(() => {
        if (allChannels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(allChannels[0].id);
        }
    }, [allChannels]);

    const handleSaveSchedule = (newSchedule) => {
        if (!selectedChannelId) return;
        fetch(`${API_URL}/api/channels/${selectedChannelId}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: newSchedule })
        }).then(() => {
            onUpdate && onUpdate(); // Trigger a global refresh
        });
    };

    const handleShuffle = () => { if (!currentChannel) return; const schedule = [...currentChannel.schedule]; for (let i = schedule.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [schedule[i], schedule[j]] = [schedule[j], schedule[i]]; } handleSaveSchedule(schedule); };
    const handleClearSchedule = () => { if (window.confirm(`Are you sure you want to clear the entire schedule for "${currentChannel.name}"?`)) { handleSaveSchedule([]); } };
    const handleDeleteItem = (programIndex) => { if (!currentChannel || !currentChannel.schedule) return; const newSchedule = currentChannel.schedule.filter((_, index) => index !== programIndex); handleSaveSchedule(newSchedule); };
    const handleMoveItem = (index, direction) => { if (!currentChannel || !currentChannel.schedule) return; const schedule = [...currentChannel.schedule]; const item = schedule.splice(index, 1)[0]; const newIndex = direction === 'up' ? index - 1 : index + 1; schedule.splice(newIndex, 0, item); handleSaveSchedule(schedule); };
    const formatDuration = (seconds) => { if (isNaN(seconds) || seconds === null) return 'N/A'; const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = Math.floor(seconds % 60); return [h,m,s].map(v => v < 10 ? '0' + v : v).join(':'); };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5">Scheduler</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl sx={{ minWidth: 250 }} size="small">
                        <InputLabel id="channel-select-label">Edit Channel</InputLabel>
                        <Select
                            labelId="channel-select-label"
                            value={selectedChannelId}
                            label="Edit Channel"
                            onChange={(e) => setSelectedChannelId(e.target.value)}
                            disabled={allChannels.length === 0}
                        >
                            {allChannels.map(channel => <MenuItem key={channel.id} value={channel.id}>{channel.number} - {channel.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Tooltip title="Randomize Schedule"><Button variant="contained" color="secondary" onClick={handleShuffle} disabled={!currentChannel || !currentChannel.schedule || currentChannel.schedule.length < 2}><ShuffleIcon /></Button></Tooltip>
                    <Tooltip title="Clear Entire Schedule"><Button variant="contained" color="error" onClick={handleClearSchedule} disabled={!currentChannel || !currentChannel.schedule || currentChannel.schedule.length === 0}><ClearAllIcon /></Button></Tooltip>
                </Box>
            </Box>

            <Paper>
                <List>
                    {(currentChannel?.schedule || []).map((program, index) => (
                        <React.Fragment key={`${program.id}-${index}`}>
                            <ListItem
                                secondaryAction={
                                    <>
                                        <Tooltip title="Move Up"><IconButton edge="end" disabled={index === 0} onClick={() => handleMoveItem(index, 'up')}><ArrowUpwardIcon /></IconButton></Tooltip>
                                        <Tooltip title="Move Down"><IconButton edge="end" disabled={index === (currentChannel.schedule.length - 1)} onClick={() => handleMoveItem(index, 'down')}><ArrowDownwardIcon /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton edge="end" onClick={() => handleDeleteItem(index)}><DeleteItemIcon /></IconButton></Tooltip>
                                    </>
                                }>
                                <ListItemText
                                    primary={program.title}
                                    secondary={`Duration: ${formatDuration(program.duration)}`}
                                />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>
                {(!currentChannel || !currentChannel.schedule || currentChannel.schedule.length === 0) && (
                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        This schedule is empty. Select a channel and add media from the Library tab.
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}

export default BomCastScheduler;