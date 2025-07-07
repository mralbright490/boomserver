import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxHeight: '90vh', // NEW: Limit maximum height to 90% of viewport height
  overflowY: 'auto', // NEW: Enable vertical scrolling when content overflows
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function MediaEditor({ mediaFile, open, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [showName, setShowName] = useState('');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');

  useEffect(() => {
    if (mediaFile) {
      setTitle(mediaFile.title || mediaFile.file_name);
      setSummary(mediaFile.summary || '');
      setCategory(mediaFile.category || 'Uncategorized');
      setShowName(mediaFile.showName || '');
      setSeason(mediaFile.season || '');
      setEpisode(mediaFile.episode || '');
    }
  }, [mediaFile]);

  const handleSave = () => {
    onSave(mediaFile.id, { title, summary, category, showName, season, episode });
  };

  if (!mediaFile) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">Edit Media</Typography>
        <Typography sx={{ mt: 2 }} color="text.secondary">{mediaFile.file_name}</Typography>
        
        <TextField
          margin="normal"
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          label="Summary"
          multiline
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="Uncategorized">Uncategorized</MenuItem>
            <MenuItem value="TV Show">TV Show</MenuItem>
            <MenuItem value="Ad Bump">Ad Bump</MenuItem>
          </Select>
        </FormControl>

        {category === 'TV Show' && (
          <>
            <TextField
              margin="normal"
              fullWidth
              label="Show Name"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              type="number"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Episode"
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              type="number"
            />
          </>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default MediaEditor;