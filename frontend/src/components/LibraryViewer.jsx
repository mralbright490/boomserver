import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MediaEditor from './MediaEditor';

const API_URL = 'http://localhost:8000'; // THE FIX: Changed port to 8000

function LibraryViewer() {
  // ... rest of the code is identical to what you have ...
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchMedia = () => {
    setIsLoading(true);
    fetch(`${API_URL}/api/media`)
      .then(res => res.json())
      .then(data => {
        setMedia(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch media:", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleRowClick = (file) => {
    setSelectedMedia(file);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedMedia(null);
  };

  const handleSaveMedia = (id, data) => {
    fetch(`${API_URL}/api/media/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
      fetchMedia(); 
      handleCloseEditor();
    });
  };

  const handleDeleteMedia = (id, event) => {
    event.stopPropagation(); 
    if (window.confirm('Are you sure you want to remove this file from the library?')) {
      fetch(`${API_URL}/api/media/${id}`, { method: 'DELETE' })
      .then(() => {
        fetchMedia(); 
      });
    }
  };
  
  const formatDuration = (seconds) => new Date(seconds * 1000).toISOString().slice(11, 19);
  
  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Indexed Media</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Duration</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {media.map((file) => (
              <TableRow key={file.id} hover onClick={() => handleRowClick(file)} sx={{ cursor: 'pointer' }}>
                <TableCell>{file.title || file.file_name}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{file.file_name}</TableCell>
                <TableCell align="right">{formatDuration(file.duration)}</TableCell>
                <TableCell align="center">
                  <IconButton aria-label="delete" color="secondary" onClick={(e) => handleDeleteMedia(file.id, e)} title="Remove from library">
                    <DeleteForeverIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <MediaEditor
        mediaFile={selectedMedia}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveMedia}
      />
    </Box>
  );
}

export default LibraryViewer;