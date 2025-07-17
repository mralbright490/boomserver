import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const style = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, };

function ChannelEditor({ channel, open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [m3uFileName, setM3uFileName] = useState('');

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setNumber(channel.number);
      setThumbnail(channel.thumbnail || '');
      setM3uFileName(channel.m3uFileName || `${channel.name.replace(/[^a-zA-Z0-9]/g, '_')}.m3u`);
    }
  }, [channel]);

  const handleSave = () => {
    const updatedChannelData = { ...channel, name, number, thumbnail, m3uFileName };
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
        <TextField label="M3U Filename" value={m3uFileName} onChange={e => setM3uFileName(e.target.value)} fullWidth margin="normal" helperText="The name of the .m3u file to be generated."/>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save Changes</Button>
        </Box>
      </Box>
    </Modal>
  );
}
export default ChannelEditor;