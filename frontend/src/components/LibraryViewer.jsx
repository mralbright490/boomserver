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
  Collapse,
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import MediaEditor from './MediaEditor';

const API_URL = 'http://localhost:8000';

function LibraryViewer({ refreshTrigger }) {
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({}); // NEW: State for expanding/collapsing any category
  const [expandedShows, setExpandedShows] = useState({}); // Still needed for nested TV Show seasons
  const [expandedSeasons, setExpandedSeasons] = useState({}); // Still needed for nested TV Show seasons

  const fetchMedia = () => {
    setIsLoading(true);
    fetch(`${API_URL}/api/media`)
      .then(res => res.json())
      .then(data => {
        // No pre-sorting here, sorting for display will happen after grouping
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

  // NEW: Group media by category
  const groupedByCategory = media.reduce((acc, file) => {
    acc[file.category] = acc[file.category] || [];
    acc[file.category].push(file);
    return acc;
  }, {});

  // NEW: Define custom order for categories
  const categoryDisplayOrder = ['Uncategorized', 'Ad Bump', 'TV Show']; // Uncategorized first, then Ad Bump, then TV Show
  const otherCategories = Object.keys(groupedByCategory).filter(cat => !categoryDisplayOrder.includes(cat)).sort(); // Sort others alphabetically
  const orderedCategoryNames = [...categoryDisplayOrder.filter(cat => groupedByCategory[cat]), ...otherCategories.filter(cat => groupedByCategory[cat])];

  // Toggle handlers for expanding/collapsing categories
  const handleToggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // Toggle handlers for expanding/collapsing TV Show seasons (existing logic)
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
            {orderedCategoryNames.length === 0 && media.length > 0 ? (
                // Fallback for uncategorized if no explicit categories are found
                <TableRow>
                    <TableCell colSpan={5} align="center">
                        <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                            No categorized media found. Ensure files are categorized in their editor.
                        </Typography>
                    </TableCell>
                </TableRow>
            ) : orderedCategoryNames.length === 0 && media.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} align="center">
                        <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                            No media files found. Add library paths in Settings and scan to index files.
                        </Typography>
                    </TableCell>
                </TableRow>
            ) : (
                orderedCategoryNames.map(categoryName => {
                    const categoryFiles = groupedByCategory[categoryName].sort((a, b) => (a.title || a.file_name).localeCompare(b.title || b.file_name)); // Sort files within category alphabetically
                    const isCategoryExpanded = expandedCategories[categoryName];

                    if (categoryName === 'TV Show') {
                        // Special handling for TV Shows (nested grouping by showName/season)
                        const tvShowsGrouped = categoryFiles.reduce((acc, file) => {
                            acc[file.showName] = acc[file.showName] || {};
                            acc[file.showName][file.season] = acc[file.showName][file.season] || [];
                            acc[file.showName][file.season].push(file);
                            return acc;
                        }, {});

                        return (
                            <React.Fragment key={categoryName}>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell colSpan={5} onClick={() => handleToggleCategory(categoryName)} sx={{ cursor: 'pointer' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {isCategoryExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                            <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold', color: 'primary.main' }}>
                                                {categoryName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <Collapse in={isCategoryExpanded} timeout="auto" unmountOnExit>
                                    {Object.entries(tvShowsGrouped).sort(([a], [b]) => a.localeCompare(b)).map(([showName, seasons]) => (
                                        <React.Fragment key={showName}>
                                            <TableRow sx={{ bgcolor: 'action.selected' }}>
                                                <TableCell colSpan={5} onClick={() => handleToggleShow(showName)} sx={{ pl: 4, cursor: 'pointer' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {expandedShows[showName] ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                                        <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                                                            {showName}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            <Collapse in={expandedShows[showName]} timeout="auto" unmountOnExit>
                                                {Object.entries(seasons).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([seasonNum, episodes]) => (
                                                    <React.Fragment key={`${showName}-${seasonNum}`}>
                                                        <TableRow sx={{ bgcolor: 'action.hover', opacity: 0.8 }}>
                                                            <TableCell colSpan={5} onClick={() => handleToggleSeason(showName, seasonNum)} sx={{ pl: 8, cursor: 'pointer' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    {expandedSeasons[`${showName}-${seasonNum}`] ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                                                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', color: 'text.primary' }}>
                                                                        Season {seasonNum}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                        <Collapse in={expandedSeasons[`${showName}-${seasonNum}`]} timeout="auto" unmountOnExit>
                                                            {episodes.sort((a, b) => parseInt(a.episode) - parseInt(b.episode)).map((file) => (
                                                                <TableRow key={file.id} hover onClick={() => handleRowClick(file)} sx={{ cursor: 'pointer' }}>
                                                                    <TableCell sx={{ pl: 12 }}>{file.title || `Episode ${file.episode}`}</TableCell>
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
                                </Collapse>
                            </React.Fragment>
                        );
                    } else {
                        // Generic handling for other categories (Ad Bump, Uncategorized, etc.)
                        return (
                            <React.Fragment key={categoryName}>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell colSpan={5} onClick={() => handleToggleCategory(categoryName)} sx={{ cursor: 'pointer' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {isCategoryExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                            <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold', color: 'primary.main' }}>
                                                {categoryName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <Collapse in={isCategoryExpanded} timeout="auto" unmountOnExit>
                                    {categoryFiles.map((file) => (
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
                                </Collapse>
                            </React.Fragment>
                        );
                    }
                })
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