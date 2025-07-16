import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const style = { /* ... modal style ... */ };

function ChannelEditor({ channel, open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setNumber(channel.number);
      setThumbnail(channel.thumbnail || '');
    }
  }, [channel]);

  const handleSave = () => {
    // Keep existing adSettings when saving
    const updatedChannelData = { ...channel, name, number, thumbnail };
    onSave(channel.id, updatedChannelData);
  };

  if (!channel) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">Edit Channel</Typography>
        <TextField label="Channel Name" value={name} onChange={e => setName(e.target.value)} fullWidth margin="normal" />
        <TextField label="Channel Number" type="number" value={number} onChange={e => setNumber(e.target.value)} fullWidth margin="normal" />
        <TextField label="Thumbnail URL" value={thumbnail} onChange={e => setThumbnail(e.target.value)} fullWidth margin="normal" />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save Changes</Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default ChannelEditor;