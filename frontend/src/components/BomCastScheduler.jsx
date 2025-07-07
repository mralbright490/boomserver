import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Modal,
  TextField,
  Switch,
  FormGroup, FormControlLabel
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import EditIcon from '@mui/icons-material/Edit';

const API_URL = 'http://localhost:8000';

const formatTime = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num) => num.toString().padStart(2, '0');

  const displayHours = hours % 12 || 12;
  const ampm = hours < 12 || hours === 24 ? 'AM' : 'PM';

  return `${pad(displayHours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
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

const editModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};


function ScheduledItemEditor({ item, channels, open, onClose, onSave, formatTime }) {
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedChannelId, setEditedChannelId] = useState('');

  useEffect(() => {
    if (item) {
      setEditedStartTime(item.startTime !== undefined ? item.startTime.toString() : '');
      setEditedChannelId(item.channelId || '');
    }
  }, [item]);

  const handleSave = () => {
    const newStartTime = parseInt(editedStartTime);
    if (isNaN(newStartTime) || newStartTime < 0) {
      alert('Please enter a valid start time (seconds from channel start).');
      return;
    }
    onSave(item.id, { startTime: newStartTime, channelId: editedChannelId });
  };

  if (!item) return null;

  const hourlyTimeOptions = [];
  for (let i = 0; i < 24; i++) {
    const seconds = i * 3600;
    hourlyTimeOptions.push({ value: seconds, label: formatTime(seconds).substring(0, 5) + ' ' + formatTime(seconds).substring(9) });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={editModalStyle}>
        <Typography variant="h6" component="h2">Edit Scheduled Item</Typography>
        <Typography sx={{ mt: 2 }} color="text.secondary">{item.title}</Typography>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Start Time</InputLabel>
          <Select
            value={editedStartTime}
            label="Start Time"
            onChange={(e) => setEditedStartTime(e.target.value)}
          >
            {hourlyTimeOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Channel</InputLabel>
          <Select
            value={editedChannelId}
            label="Channel"
            onChange={(e) => setEditedChannelId(e.target.value)}
          >
            {channels.map(channel => (
              <MenuItem key={channel.id} value={channel.id}>{channel.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </Box>
      </Box>
    </Modal>
  );
}


const TimelineDisplay = ({ channels, schedule, formatTime, handleRemoveScheduledItem, handleEditScheduledItemClick }) => {
  const maxChannelDuration = channels.reduce((maxDuration, channel) => {
    const channelItems = schedule.filter(item => item.channelId === channel.id);
    if (channelItems.length === 0) return maxDuration;
    const lastItem = channelItems.sort((a, b) => a.endTime - b.endTime)[channelItems.length - 1];
    return Math.max(maxDuration, lastItem.endTime);
  }, 0);

  const totalTimelineDuration = Math.max(maxChannelDuration, 24 * 3600);
  const scaleFactor = 250 / 3600;

  const timelineMarkers = [];
  for (let i = 0; i <= Math.ceil(totalTimelineDuration / 3600); i++) {
    const timeInSeconds = i * 3600;
    timelineMarkers.push(timeInSeconds);
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      {/* Time Axis (Hours) */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid #444', mb: 1, ml: '150px' }}>
        {timelineMarkers.map(timeInSeconds => (
          <Typography key={timeInSeconds} variant="caption" sx={{ minWidth: `${(1 * 3600) * scaleFactor}px`, textAlign: 'left', px: 1, borderLeft: '1px dashed #333' }}>
            {formatTime(timeInSeconds).substring(0, 5) + ' ' + formatTime(timeInSeconds).substring(9)}
          </Typography>
        ))}
      </Box>

      {channels.map(channel => {
        const channelTotalDuration = schedule
          .filter(item => item.channelId === channel.id)
          .reduce((sum, item) => sum + item.duration, 0);

        return (
          <Box key={channel.id} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #555', py: 1 }}>
              <Typography variant="subtitle2" sx={{ width: '150px', flexShrink: 0, fontWeight: 'bold', color: 'secondary.main', pr: 2, textAlign: 'right' }}>
                {channel.name} ({formatDuration(channelTotalDuration)})
              </Typography>
              <Box sx={{ flexGrow: 1, position: 'relative', height: '40px', bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                {schedule
                  .filter(item => item.channelId === channel.id)
                  .sort((a, b) => a.startTime - b.startTime)
                  .map((item) => (
                    <Button
                      key={item.id}
                      variant="contained"
                      color={item.channelId === 'ads' ? 'secondary' : 'primary'}
                      sx={{
                        position: 'absolute',
                        height: '100%',
                        left: `${item.startTime * scaleFactor}px`,
                        width: `${item.duration * scaleFactor}px`,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        '&:hover': {
                            opacity: 0.8
                        }
                      }}
                      title={`${item.title} (${formatTime(item.startTime)} - ${formatTime(item.endTime)})`}
                      onClick={() => handleEditScheduledItemClick(item)}
                    >
                      {item.title}
                    </Button>
                  ))}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};


function BomCastScheduler({ refreshTrigger }) {
  const [availableMedia, setAvailableMedia] = useState([]);
  const [channels, setChannels] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedChannelToAdd, setSelectedChannelToAdd] = useState('main');
  const [selectedScheduledItem, setSelectedScheduledItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [adOptions, setAdOptions] = useState({ enabled: true, frequency: 1800, duration: 90, publicStreamBaseUrl: 'http://localhost:8000' }); // UPDATED: Default publicStreamBaseUrl

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const mediaResponse = await fetch(`${API_URL}/api/media`);
      let mediaData = await mediaResponse.json();

      const scheduleResponse = await fetch(`${API_URL}/api/bomcast/schedule`);
      const scheduleData = await scheduleResponse.json();
      setChannels(scheduleData.channels);
      setCurrentSchedule(scheduleData.schedule);

      const adOptionsResponse = await fetch(`${API_URL}/api/bomcast/ad-options`);
      const adOptionsData = await adOptionsResponse.json();
      setAdOptions(adOptionsData); // Get updated ad options including publicStreamBaseUrl

      const scheduledMediaIds = new Set(scheduleData.schedule.map(item => item.mediaId));
      mediaData = mediaData.filter(mediaItem => !scheduledMediaIds.has(mediaItem.id));

      const sortedMedia = mediaData.sort((a, b) => {
        const isACategorized = a.category !== 'Uncategorized';
        const isBCategorized = b.category !== 'Uncategorized';

        if (isACategorized && !isBCategorized) return -1;
        if (!isACategorized && isBCategorized) return 1;
        return (a.title || a.file_name).localeCompare(b.title || b.file_name);
      });

      setAvailableMedia(sortedMedia);

      if (scheduleData.channels.length > 0 && (!selectedChannelToAdd || !scheduleData.channels.some(c => c.id === selectedChannelToAdd))) {
        setSelectedChannelToAdd(scheduleData.channels[0].id);
      }

    } catch (error) {
      console.error("[BomCastScheduler] Error fetching data:", error);
      setMessage('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const getSuggestedChannelId = (category) => {
    switch (category) {
      case 'TV Show':
        return 'main';
      case 'Ad Bump':
        return 'ads';
      default:
        return 'main';
    }
  };

  const handleAddMediaToSchedule = async (mediaFile, explicitChannelId = null) => {
    setMessage(`Adding ${mediaFile.title || mediaFile.file_name} to schedule...`);
    try {
      let finalTargetChannelId;
      if (explicitChannelId) {
          finalTargetChannelId = explicitChannelId;
      } else {
          const suggestedChannelId = getSuggestedChannelId(mediaFile.category);
          finalTargetChannelId = selectedChannelToAdd;
          if (!selectedChannelToAdd || selectedChannelToAdd === suggestedChannelId) {
              finalTargetChannelId = suggestedChannelId;
          }
      }

      const newItem = {
        id: Date.now(),
        mediaId: mediaFile.id,
        channelId: finalTargetChannelId,
        duration: mediaFile.duration,
        type: mediaFile.category,
        title: mediaFile.title || mediaFile.file_name,
      };

      setCurrentSchedule(prevSchedule => [...prevSchedule, newItem]);
      setMessage(`Item added to schedule (optimistic update).`);

      const response = await fetch(`${API_URL}/api/bomcast/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        setMessage(`Failed: ${data.message}`);
        setCurrentSchedule(prevSchedule => prevSchedule.filter(item => item.id !== newItem.id));
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error adding item to schedule:", error);
      setMessage('Failed to add item to schedule.');
      setCurrentSchedule(prevSchedule => prevSchedule.filter(item => item.id !== newItem.id));
    }
  };

  const handleRemoveScheduledItem = async (itemId) => {
    setMessage(`Removing item ${itemId} from schedule...`);
    try {
      const prevSchedule = currentSchedule;
      setCurrentSchedule(prevSchedule => prevSchedule.filter(item => item.id !== itemId));
      setMessage(`Item removed from schedule (optimistic update).`);

      const response = await fetch(`${API_URL}/api/bomcast/schedule/${itemId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        setMessage(`Failed: ${data.message}`);
        setCurrentSchedule(prevSchedule);
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error removing item from schedule:", error);
      setMessage('Failed to remove item from schedule.');
      setCurrentSchedule(prevSchedule);
    }
  };

  const handleEditScheduledItem = async (itemId, updatedData) => {
    setMessage(`Updating item ${itemId}...`);
    try {
      setCurrentSchedule(prevSchedule => prevSchedule.map(item =>
        item.id === itemId ? { ...item, ...updatedData } : item
      ));

      const response = await fetch(`${API_URL}/api/bomcast/schedule/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchData();
        handleCloseEditor();
      } else {
        setMessage(`Failed: ${data.message}`);
        fetchData();
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error updating item:", error);
      setMessage('Failed to update item.');
      fetchData();
    }
  };

  const handleEditScheduledItemClick = (item) => {
    setSelectedScheduledItem(item);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedScheduledItem(null);
  };


  const handleGenerateM3U = async () => {
    setMessage('Generating M3U...');
    try {
      const response = await fetch(`${API_URL}/api/bomcast/generate-m3u`, { method: 'POST' });
      const data = await response.json();
      setMessage(`M3U: ${data.message} (URL: ${data.url || 'N/A'})`);
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error generating M3U:", error);
      setMessage('Failed to generate M3U.');
    }
  };

  const handleGenerateEPG = async () => {
    setMessage('Generating EPG...');
    try {
      const response = await fetch(`${API_URL}/api/bomcast/generate-epg`, { method: 'POST' });
      const data = await response.json();
      setMessage(`EPG: ${data.message} (URL: ${data.url || 'N/A'})`);
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error generating EPG:", error);
      setMessage('Failed to generate EPG.');
    }
  };

  const handleAddAllAds = async () => {
      setMessage("Adding all Ad Content...");
      const adsToAdd = availableMedia.filter(file => file.category === 'Ad Bump');
      for (const ad of adsToAdd) {
          await handleAddMediaToSchedule(ad, 'ads');
      }
      setMessage("All Ad Content added (check schedule).");
      fetchData();
  };

  const handleAddAllMainContent = async () => {
      setMessage("Adding all Main Channel content...");
      const mainContentToAdd = availableMedia.filter(file => file.category === 'TV Show' || file.category === 'Movie' || file.category === 'Uncategorized');
      for (const item of mainContentToAdd) {
          await handleAddMediaToSchedule(item, 'main');
      }
      setMessage("All Main Channel content added (check schedule).");
      fetchData();
  };

  const handleShuffleSchedule = async () => {
      setMessage("Shuffling schedule...");
      try {
          const response = await fetch(`${API_URL}/api/bomcast/schedule/shuffle`, { method: 'POST' });
          const data = await response.json();
          if (data.success) {
              setMessage(data.message);
              fetchData();
          } else {
              setMessage(`Failed: ${data.message}`);
          }
      } catch (error) {
          console.error("[BomCastScheduler] Error shuffling schedule:", error);
          setMessage('Failed to shuffle schedule.');
      }
  };

  const handleClearSchedule = async () => {
    if (window.confirm('Are you sure you want to clear the entire schedule? This action cannot be undone.')) {
      setMessage('Clearing schedule...');
      try {
        const response = await fetch(`${API_URL}/api/bomcast/schedule/all`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          setMessage(data.message);
          fetchData();
        } else {
          setMessage(`Failed: ${data.message}`);
        }
      } catch (error) {
        console.error("[BomCastScheduler] Error clearing schedule:", error);
        setMessage('Failed to clear schedule.');
      }
    }
  };

  const handleAdOptionChange = async (option, value) => {
    const newAdOptions = { ...adOptions, [option]: value };
    setAdOptions(newAdOptions);

    setMessage(`Updating ad options...`);
    try {
      const response = await fetch(`${API_URL}/api/bomcast/ad-options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdOptions)
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchData();
      } else {
        setMessage(`Failed: ${data.message}`);
        setAdOptions(adOptions);
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error updating ad options:", error);
      setMessage('Failed to update ad options.');
      setAdOptions(adOptions);
    }
  };

  // NEW: handlePublicStreamUrlChange
  const handlePublicStreamUrlChange = async (e) => {
    const newUrl = e.target.value;
    const newAdOptions = { ...adOptions, publicStreamBaseUrl: newUrl };
    setAdOptions(newAdOptions); // Optimistic UI update

    setMessage(`Updating public stream URL...`);
    try {
      const response = await fetch(`${API_URL}/api/bomcast/ad-options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdOptions)
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchData(); // Refresh to ensure changes are picked up by M3U/EPG generation
      } else {
        setMessage(`Failed: ${data.message}`);
        setAdOptions(adOptions); // Revert on failure
      }
    } catch (error) {
      console.error("[BomCastScheduler] Error updating public stream URL:", error);
      setMessage('Failed to update public stream URL.');
      setAdOptions(adOptions); // Revert on error
    }
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>Loading BomCast data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>BomCast Live Schedule</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Build your live TV-like schedule using media from your library.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Ad Options Section */}
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Ad Options</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={adOptions.enabled}
                      onChange={(e) => handleAdOptionChange('enabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enable Ad Breaks"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Ad Frequency</InputLabel>
                <Select
                  value={adOptions.frequency}
                  label="Ad Frequency"
                  onChange={(e) => handleAdOptionChange('frequency', e.target.value)}
                  disabled={!adOptions.enabled}
                >
                  <MenuItem value={300}>Every 5 min</MenuItem>
                  <MenuItem value={600}>Every 10 min</MenuItem>
                  <MenuItem value={900}>Every 15 min</MenuItem>
                  <MenuItem value={1800}>Every 30 min</MenuItem>
                  <MenuItem value={3600}>Every 1 hour</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Ad Duration</InputLabel>
                <Select
                  value={adOptions.duration}
                  label="Ad Duration"
                  onChange={(e) => handleAdOptionChange('duration', e.target.value)}
                  disabled={!adOptions.enabled}
                >
                  <MenuItem value={30}>30 seconds</MenuItem>
                  <MenuItem value={60}>1 minute</MenuItem>
                  <MenuItem value={90}>1.5 minutes</MenuItem>
                  <MenuItem value={120}>2 minutes</MenuItem>
                  <MenuItem value={180}>3 minutes</MenuItem>
                  <MenuItem value={240}>4 minutes</MenuItem>
                  <MenuItem value={300}>5 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* NEW: Public Stream Base URL Input */}
            <Grid item xs={12}>
              <TextField
                margin="normal"
                fullWidth
                label="Public Stream Base URL (e.g., http://your.public.ip:8000)"
                value={adOptions.publicStreamBaseUrl}
                onChange={handlePublicStreamUrlChange}
                helperText="This URL will be used in generated M3U/EPG files for public access."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Schedule Display Section */}
        <Paper sx={{ p: 2, flex: 1, maxHeight: '600px', overflow: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Current Broadcast Schedule</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
              <Button variant="outlined" startIcon={<ShuffleIcon />} onClick={handleShuffleSchedule}>Shuffle Schedule</Button>
              <Button variant="outlined" color="error" startIcon={<ClearAllIcon />} onClick={handleClearSchedule}>Clear Schedule</Button>
          </Box>
          <TimelineDisplay
            channels={channels}
            schedule={currentSchedule}
            formatTime={formatTime}
            handleRemoveScheduledItem={handleRemoveScheduledItem}
            handleEditScheduledItemClick={handleEditScheduledItemClick}
          />
        </Paper>

        {/* Available Media Section */}
        <Paper sx={{ p: 2, flex: 1, maxHeight: '300px', overflow: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Available Media</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Add to Channel</InputLabel>
            <Select
              value={selectedChannelToAdd}
              label="Add to Channel"
              onChange={(e) => setSelectedChannelToAdd(e.target.value)}
            >
              {channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>{channel.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Button variant="outlined" size="small" onClick={handleAddAllAds} sx={{ flexGrow: 1, mr: 1 }}>Add All Ads</Button>
              <Button variant="outlined" size="small" onClick={handleAddAllMainContent} sx={{ flexGrow: 1 }}>Add All Main</Button>
          </Box>
          <List dense>
            {availableMedia.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No media indexed yet. Scan your library in Settings.</Typography>
            ) : (
              availableMedia.map((file) => (
                <ListItem
                  key={file.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="add" onClick={() => handleAddMediaToSchedule(file)}>
                      <AddCircleOutlineIcon color={file.category === 'Ad Bump' ? 'secondary' : 'primary'} />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={file.title || file.file_name}
                    secondary={`${file.category} | ${formatDuration(file.duration)}`}
                    sx={{ pr: 4 }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={handleGenerateM3U} sx={{ mr: 2 }}>
          Generate M3U Playlist
        </Button>
        <Button variant="contained" color="secondary" onClick={handleGenerateEPG} sx={{ mr: 2 }}>
          Generate EPG Guide
        </Button>
      </Box>

      {message && (
        <Typography color="text.primary" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center' }}>
          {message}
        </Typography>
      )}

      {/* Scheduled Item Editor Modal */}
      <ScheduledItemEditor
        item={selectedScheduledItem}
        channels={channels}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleEditScheduledItem}
        formatTime={formatTime}
      />
    </Box>
  );
}

export default BomCastScheduler;