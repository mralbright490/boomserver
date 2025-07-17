import React, { useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Button, Avatar, IconButton, Tooltip, TextField } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Link as LinkIcon } from '@mui/icons-material';
import ChannelEditor from './ChannelEditor';

const API_URL = 'http://localhost:8000';

function ChannelManager({ channels, onUpdate }) {
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [newThumbnail, setNewThumbnail] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);

    const handleOpenEditor = (channel) => { setSelectedChannel(channel); setIsEditorOpen(true); };
    const handleCloseEditor = () => { setSelectedChannel(null); setIsEditorOpen(false); };
    const handleSaveChannel = (id, data) => { fetch(`${API_URL}/api/channels/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(() => { handleCloseEditor(); onUpdate(); }); };
    const handleAddChannel = () => { if (!newName || !newNumber) { alert('Channel Name and Number are required.'); return; } fetch(`${API_URL}/api/channels`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, number: newNumber, thumbnail: newThumbnail }), }).then(() => { setNewName(''); setNewNumber(''); setNewThumbnail(''); onUpdate(); }); };
    const handleDeleteChannel = (id) => { if (window.confirm('Are you sure you want to delete this channel and its schedule?')) { fetch(`${API_URL}/api/channels/${id}`, { method: 'DELETE' }).then(() => onUpdate()); } };
    
    const handleGenerateM3U = (channel) => {
        const filename = channel.m3uFileName || 'playlist.m3u';
        const url = `${API_URL}/m3u/${channel.id}/${filename}`;
        window.open(url, '_blank');
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Channel Management</Typography>
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6">Existing Channels</Typography>
                <List>
                    {(channels || []).map(channel => (
                        <ListItem key={channel.id}
                            secondaryAction={
                                <>
                                    <Tooltip title="Generate & Open M3U File"><Button variant="outlined" startIcon={<LinkIcon />} onClick={() => handleGenerateM3U(channel)}>{channel.m3uFileName || 'playlist.m3u'}</Button></Tooltip>
                                    <IconButton edge="end" aria-label="edit" sx={{ ml: 1 }} onClick={() => handleOpenEditor(channel)}><EditIcon /></IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteChannel(channel.id)}><DeleteIcon /></IconButton>
                                </>
                            }>
                            <Avatar src={channel.thumbnail} sx={{ mr: 2 }} variant="rounded">{!channel.thumbnail && channel.name.charAt(0)}</Avatar>
                            <ListItemText primary={`${channel.number} - ${channel.name}`} secondary={`Items in schedule: ${(channel.schedule || []).length}`} />
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