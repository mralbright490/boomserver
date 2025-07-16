import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdSettingsEditor from './AdSettingsEditor';

const API_URL = 'http://localhost:8000';

function AdManager({ refreshTrigger, onUpdate }) {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);

    const fetchChannels = () => {
        setIsLoading(true);
        fetch(`${API_URL}/api/channels`)
            .then(res => res.json())
            .then(data => setChannels(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to fetch channels:", err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchChannels(); }, [refreshTrigger]);

    const handleOpenEditor = (channel) => {
        setSelectedChannel(channel);
        setIsEditorOpen(true);
    };

    const handleCloseEditor = () => {
        setSelectedChannel(null);
        setIsEditorOpen(false);
    };

    const handleSaveSettings = (id, data) => {
        fetch(`${API_URL}/api/channels/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => {
            handleCloseEditor();
            onUpdate();
        });
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Automatic Ad Insertion</Typography>
            <Typography color="text.secondary" sx={{mb: 2}}>Configure automatic ad insertion for each channel. This will be used later to generate the final EPG.</Typography>
            <Paper>
                <List>
                    {channels.map(channel => {
                        const adSettings = channel.adSettings || { active: false };
                        const ruleText = adSettings.active
                            ? `Insert ${adSettings.adCount || 1} ad(s) after every ${adSettings.programsPerAd || 3} program(s).`
                            : 'Automatic ads are currently disabled for this channel.';

                        return (
                            <ListItem key={channel.id}
                                secondaryAction={
                                    <Tooltip title="Edit Ad Settings">
                                        <IconButton edge="end" onClick={() => handleOpenEditor(channel)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                }>
                                <ListItemText primary={`${channel.number} - ${channel.name}`} secondary={ruleText} />
                            </ListItem>
                        );
                    })}
                </List>
            </Paper>
            <AdSettingsEditor
                open={isEditorOpen}
                onClose={handleCloseEditor}
                onSave={handleSaveSettings}
                channel={selectedChannel}
            />
        </Box>
    );
}

export default AdManager;