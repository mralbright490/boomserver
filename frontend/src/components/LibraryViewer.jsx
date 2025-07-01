import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Collapse, // Added for collapsible sections
  Hidden, // Added for responsive table headers
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon, // Renamed for clarity
  ExpandMore as ExpandMoreIcon,      // Added for expand/collapse
  ChevronRight as ChevronRightIcon, // Added for expand/collapse
} from '@mui/icons-material'; // Consolidated imports
import MediaEditor from './MediaEditor';

const API_URL = 'http://localhost:8000';

function LibraryViewer({ refreshTrigger }) {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedShows, setExpandedShows] = useState({}); // State for expanding TV shows
  const [expandedSeasons, setExpandedSeasons] = useState({}); // State for expanding seasons

  const fetchMedia = () => {
    setIsLoading(true);
    fetch(`${API_URL}/api/media`)
      .then(res => res.json())
      .then(data => {
        // Sort media to ensure proper grouping order
        const sortedData = data.sort((a, b) => {
          // Primary sort by category
          if (a.category === 'TV Show' && b.category !== 'TV Show') return -1;
          if (a.category !== 'TV Show' && b.category === 'TV Show') return 1;
          if (a.category === 'Ad Bump' && b.category !== 'Ad Bump') return -1;
          if (a.category !== 'Ad Bump' && b.category === 'Ad Bump') return 1;

          // For TV Shows, sort by showName, then season (numeric), then episode (numeric)
          if (a.category === 'TV Show' && b.category === 'TV Show') {
            if (a.showName !== b.showName) return a.showName.localeCompare(b.showName);
            if (parseInt(a.season) !== parseInt(b.season)) return parseInt(a.season) - parseInt(b.season);
            return parseInt(a.episode) - parseInt(b.episode);
          }

          // Default sort for other categories (e.g., Uncategorized, Ad Bump) by title/filename
          return (a.title || a.file_name).localeCompare(b.title || b.file_name);
        });
        setMedia(sortedData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch media:", error);
        setIsLoading(false);
      });
  };

  // Re-fetch media whenever refreshTrigger changes
  useEffect(() => {
    fetchMedia();
  }, [refreshTrigger]);

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

  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null) return 'N/A';
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds();

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));

    return parts.join(':');
  };

  // Grouping logic
  const groupedMedia = media.reduce((acc, file) => {
    if (file.category === 'TV Show') {
      acc.tvShows = acc.tvShows || {};
      acc.tvShows[file.showName] = acc.tvShows[file.showName] || {};
      acc.tvShows[file.showName][file.season] = acc.tvShows[file.showName][file.season] || [];
      acc.tvShows[file.showName][file.season].push(file);
    } else {
      acc.otherCategories = acc.otherCategories || {};
      acc.otherCategories[file.category] = acc.otherCategories[file.category] || [];
      acc.otherCategories[file.category].push(file);
    }
    return acc;
  }, { tvShows: {}, otherCategories: {} });

  // Toggle handlers for expanding/collapsing
  const handleToggleShow = (showName) => {
    setExpandedShows(prev => ({
      ...prev,
      [showName]: !prev[showName],
    }));
  };

  const handleToggleSeason = (showName, season) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [`${showName}-${season}`]: !prev[`${showName}-${season}`],
    }));
  };

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
            {/* Render TV Shows */}
            {Object.entries(groupedMedia.tvShows).sort(([a], [b]) => a.localeCompare(b)).map(([showName, seasons]) => (
              <React.Fragment key={showName}>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={5} onClick={() => handleToggleShow(showName)} sx={{ cursor: 'pointer' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {expandedShows[showName] ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                      <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        {showName}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
                <Collapse in={expandedShows[showName]} timeout="auto" unmountOnExit>
                  {Object.entries(seasons).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([seasonNum, episodes]) => (
                    <React.Fragment key={`${showName}-${seasonNum}`}>
                      <TableRow sx={{ bgcolor: 'action.selected' }}>
                        <TableCell colSpan={5} onClick={() => handleToggleSeason(showName, seasonNum)} sx={{ pl: 4, cursor: 'pointer' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {expandedSeasons[`${showName}-${seasonNum}`] ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                              Season {seasonNum}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <Collapse in={expandedSeasons[`${showName}-${seasonNum}`]} timeout="auto" unmountOnExit>
                        {episodes.sort((a, b) => parseInt(a.episode) - parseInt(b.episode)).map((file) => (
                          <TableRow key={file.id} hover onClick={() => handleRowClick(file)} sx={{ cursor: 'pointer' }}>
                            <TableCell sx={{ pl: 8 }}>{file.title || `Episode ${file.episode}`}</TableCell>
                            <TableCell>{file.category}</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{file.file_name}</TableCell>
                            <TableCell align="right">{formatDuration(file.duration)}</TableCell>
                            <TableCell align="center">
                              <IconButton aria-label="delete" color="secondary" onClick={(e) => handleDeleteMedia(file.id, e)} title="Remove from library">
                                <DeleteForeverIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Collapse>
                    </React.Fragment>
                  ))}
                </Collapse>
              </React.Fragment>
            ))}

            {/* Render Other Categories (Uncategorized, Ad Bump, etc.) */}
            {Object.entries(groupedMedia.otherCategories).sort(([a], [b]) => a.localeCompare(b)).map(([categoryName, files]) => (
                <React.Fragment key={categoryName}>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={5}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {categoryName}
                            </Typography>
                        </TableCell>
                    </TableRow>
                    {files.map((file) => (
                        <TableRow key={file.id} hover onClick={() => handleRowClick(file)} sx={{ cursor: 'pointer' }}>
                            <TableCell sx={{ pl: 4 }}>{file.title || file.file_name}</TableCell>
                            <TableCell>{file.category}</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{file.file_name}</TableCell>
                            <TableCell align="right">{formatDuration(file.duration)}</TableCell>
                            <TableCell align="center">
                                <IconButton aria-label="delete" color="secondary" onClick={(e) => handleDeleteMedia(file.id, e)} title="Remove from library">
                                    <DeleteForeverIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </React.Fragment>
            ))}

            {/* Handle case where no media is found */}
            {media.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} align="center">
                        <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                            No media files found. Add library paths in Settings and scan to index files.
                        </Typography>
                    </TableCell>
                </TableRow>
            )}
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