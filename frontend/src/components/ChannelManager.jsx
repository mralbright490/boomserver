import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, TextField, Button, Avatar, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ChannelEditor from './ChannelEditor';

const API_URL = 'http://localhost:8000';

function ChannelManager({ refreshTrigger, onManageSchedule }) {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [newThumbnail, setNewThumbnail] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);

    const fetchChannels = () => {
        setIsLoading(true);
        fetch(`${API_URL}/api/channels`)
            .then(res => res.json())
            .then(data => setChannels(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error("Failed to fetch channels:", err);
                setChannels([]);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchChannels(); }, [refreshTrigger]);

    const handleOpenEditor = (channel) => { setSelectedChannel(channel); setIsEditorOpen(true); };
    const handleCloseEditor = () => { setSelectedChannel(null); setIsEditorOpen(false); };
    const handleSaveChannel = (id, data) => { fetch(`${API_URL}/api/channels/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(() => { handleCloseEditor(); fetchChannels(); }); };
    const handleAddChannel = () => { if (!newName || !newNumber) { alert('Channel Name and Number are required.'); return; } fetch(`${API_URL}/api/channels`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, number: newNumber, thumbnail: newThumbnail }), }).then(() => { setNewName(''); setNewNumber(''); setNewThumbnail(''); fetchChannels(); }); };
    const handleDeleteChannel = (id, event) => { event.stopPropagation(); if (window.confirm('Are you sure you want to delete this channel and its schedule?')) { fetch(`${API_URL}/api/channels/${id}`, { method: 'DELETE' }).then(() => fetchChannels()); } };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Channel Management</Typography>
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6">Existing Channels</Typography>
                <List>
                    {channels.map(channel => (
                        <ListItem key={channel.id}
                            secondaryAction={
                                <>
                                    <Button variant="outlined" sx={{mr: 1}} onClick={() => onManageSchedule(channel.id)}>Manage Schedule</Button>
                                    <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditor(channel)}><EditIcon /></IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={(e) => handleDeleteChannel(channel.id, e)}><DeleteIcon /></IconButton>
                                </>
                            }>
                            <Avatar src={channel.thumbnail} sx={{ mr: 2 }} variant="rounded">{!channel.thumbnail && channel.name.charAt(0)}</Avatar>
                            <ListItemText primary={`${channel.number} - ${channel.name}`} secondary={`Items in schedule: ${channel.schedule.length}`} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Create New Channel</Typography>
                <TextField label="Channel Name" value={newName} onChange={e => setNewName(e.target.value)} fullWidth margin="normal" />
                <TextField label="Channel Number" type="number" value={newNumber} onChange={e => setNewNumber(e.target.value)} fullWidth margin="normal" />
                <TextField label="Thumbnail URL (Optional)" value={newThumbnail} onChange={e => setNewThumbnail(e.target.value)} fullWidth margin="normal" />
                <Button variant="contained" onClick={handleAddChannel} sx={{ mt: 1 }}>Add Channel</Button>
            </Paper>
            <ChannelEditor open={isEditorOpen} onClose={handleCloseEditor} onSave={handleSaveChannel} channel={selectedChannel} />
        </Box>
    );
}

export default ChannelManager;