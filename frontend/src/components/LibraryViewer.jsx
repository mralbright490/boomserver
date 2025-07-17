import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton, Collapse } from '@mui/material';
import { DeleteForever as DeleteForeverIcon, ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import MediaEditor from './MediaEditor';

const API_URL = 'http://localhost:8000';

function LibraryViewer({ refreshTrigger }) {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedShows, setExpandedShows] = useState({});
  const [expandedSeasons, setExpandedSeasons] = useState({});

  const fetchMedia = () => {
    setIsLoading(true);
    fetch(`${API_URL}/api/media`)
      .then(res => res.json())
      .then(data => {
        const sortedData = (data || []).sort((a, b) => {
          if (a.category === 'TV Show' && b.category !== 'TV Show') return -1;
          if (a.category !== 'TV Show' && b.category === 'TV Show') return 1;
          if (a.category === 'Ad Bump' && b.category !== 'Ad Bump') return 1;
          if (a.category !== 'Ad Bump' && b.category === 'Ad Bump') return -1;
          if (a.category === 'TV Show' && b.category === 'TV Show') {
            if (a.showName !== b.showName) return a.showName.localeCompare(b.showName);
            if (parseInt(a.season) !== parseInt(b.season)) return parseInt(a.season) - parseInt(b.season);
            return parseInt(a.episode) - parseInt(b.episode);
          }
          return (a.title || a.file_name).localeCompare(b.title || b.file_name);
        });
        setMedia(sortedData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch media:", error);
        setMedia([]); // On error, ensure it's a safe empty array
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMedia();
  }, [refreshTrigger]);

  const handleRowClick = (file) => { setSelectedMedia(file); setIsEditorOpen(true); };
  const handleCloseEditor = () => { setIsEditorOpen(false); setSelectedMedia(null); };
  const handleSaveMedia = (id, data) => { fetch(`${API_URL}/api/media/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(() => { fetchMedia(); handleCloseEditor(); }); };
  const handleDeleteMedia = (id, event) => { event.stopPropagation(); if (window.confirm('Are you sure?')) { fetch(`${API_URL}/api/media/${id}`, { method: 'DELETE' }).then(() => { fetchMedia(); }); } };
  const formatDuration = (seconds) => { if (isNaN(seconds) || seconds === null) return 'N/A'; const date = new Date(seconds * 1000); const h = date.getUTCHours(); const m = date.getUTCMinutes(); const s = date.getUTCSeconds(); const parts = []; if (h > 0) parts.push(h.toString().padStart(2, '0')); parts.push(m.toString().padStart(2, '0')); parts.push(s.toString().padStart(2, '0')); return parts.join(':'); };

  const groupedMedia = (media || []).reduce((acc, file) => {
    if (file.category === 'TV Show' && file.showName) {
      acc.tvShows = acc.tvShows || {};
      acc.tvShows[file.showName] = acc.tvShows[file.showName] || {};
      acc.tvShows[file.showName][file.season] = acc.tvShows[file.showName][file.season] || [];
      acc.tvShows[file.showName][file.season].push(file);
    } else {
      const category = file.category || 'Uncategorized';
      acc.otherCategories = acc.otherCategories || {};
      acc.otherCategories[category] = acc.otherCategories[category] || [];
      acc.otherCategories[category].push(file);
    }
    return acc;
  }, { tvShows: {}, otherCategories: {} });

  const handleToggleShow = (showName) => setExpandedShows(prev => ({ ...prev, [showName]: !prev[showName] }));
  const handleToggleSeason = (showName, season) => setExpandedSeasons(prev => ({ ...prev, [`${showName}-${season}`]: !prev[`${showName}-${season}`] }));

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Indexed Media</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Duration</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(groupedMedia.tvShows).sort(([a], [b]) => a.localeCompare(b)).map(([showName, seasons]) => (
              <React.Fragment key={showName}>
                <TableRow sx={{ bgcolor: 'action.hover' }}><TableCell colSpan={5} onClick={() => handleToggleShow(showName)} sx={{ cursor: 'pointer' }}><Box sx={{ display: 'flex', alignItems: 'center' }}>{expandedShows[showName] ? <ExpandMoreIcon /> : <ChevronRightIcon />}<Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold', color: 'primary.main' }}>{showName}</Typography></Box></TableCell></TableRow>
                <Collapse in={expandedShows[showName]} timeout="auto" unmountOnExit>{Object.entries(seasons).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([seasonNum, episodes]) => (
                    <React.Fragment key={`${showName}-${seasonNum}`}>
                      <TableRow sx={{ bgcolor: 'action.selected' }}><TableCell colSpan={5} onClick={() => handleToggleSeason(showName, seasonNum)} sx={{ pl: 4, cursor: 'pointer' }}><Box sx={{ display: 'flex', alignItems: 'center' }}>{expandedSeasons[`${showName}-${seasonNum}`] ? <ExpandMoreIcon /> : <ChevronRightIcon />}<Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold', color: 'secondary.main' }}>Season {seasonNum}</Typography></Box></TableCell></TableRow>
                      <Collapse in={expandedSeasons[`${showName}-${seasonNum}`]} timeout="auto" unmountOnExit>{episodes.sort((a, b) => parseInt(a.episode) - parseInt(b.episode)).map((file) => (<TableRow key={file.id} hover onClick={() => handleRowClick(file)} sx={{ cursor: 'pointer' }}> <TableCell sx={{ pl: 8 }}>{file.title || `Episode ${file.episode}`}</TableCell> <TableCell>{file.category}</TableCell> <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{file.fileName}</TableCell> <TableCell align="right">{formatDuration(file.duration)}</TableCell> <TableCell align="center"> <IconButton aria-label="delete" color="secondary" onClick={(e) => handleDeleteMedia(file.id, e)} title="Remove from library"><DeleteForeverIcon /></IconButton> </TableCell> </TableRow>))}</Collapse>
                    </React.Fragment>
                ))}</Collapse>
              </React.Fragment>
            ))}
            {Object.entries(groupedMedia.otherCategories).sort(([a], [b]) => a.localeCompare(b)).map(([categoryName, files]) => (
                <React.Fragment key={categoryName}>
                    <TableRow sx={{ bgcolor: 'action.hover' }}><TableCell colSpan={5}><Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{categoryName}</Typography></TableCell></TableRow>
                    {files.map((file) => (<TableRow key={file.id} hover onClick={() => handleRowClick(file)} sx={{ cursor: 'pointer' }}> <TableCell sx={{ pl: 4 }}>{file.title || file.fileName}</TableCell> <TableCell>{file.category}</TableCell> <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{file.fileName}</TableCell> <TableCell align="right">{formatDuration(file.duration)}</TableCell> <TableCell align="center"> <IconButton aria-label="delete" color="secondary" onClick={(e) => handleDeleteMedia(file.id, e)} title="Remove from library"><DeleteForeverIcon /></IconButton> </TableCell> </TableRow>))}
                </React.Fragment>
            ))}
            {media.length === 0 && (<TableRow><TableCell colSpan={5} align="center"><Typography sx={{ py: 3 }}>No media files found.</Typography></TableCell></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
      <MediaEditor mediaFile={selectedMedia} open={isEditorOpen} onClose={handleCloseEditor} onSave={handleSaveMedia} />
    </Box>
  );
}

export default LibraryViewer;