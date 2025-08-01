import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, List, ListItem, ListItemText, Typography, IconButton, CircularProgress, Divider, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

const API_URL = 'http://localhost:8000';

function LibrarySettings({ onLibraryUpdate }) {
    const [paths, setPaths] = useState([]);
    const [newPath, setNewPath] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [isShuttingDown, setIsShuttingDown] = useState(false);
    const [settings, setSettings] = useState({ publicUrlBase: '' });

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/api/library/paths`).then(res => res.json()),
            fetch(`${API_URL}/api/settings`).then(res => res.json())
        ]).then(([pathsData, settingsData]) => {
            setPaths(pathsData || []);
            setSettings(settingsData || { publicUrlBase: '' });
        }).catch(error => console.error("Failed to fetch initial settings:", error))
        .finally(() => setIsLoading(false));
    }, []);

    const handleSettingsChange = (event) => {
        setSettings({ ...settings, [event.target.name]: event.target.value });
    };

    const handleSaveSettings = () => {
        fetch(`${API_URL}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        })
        .then(res => res.json())
        .then(() => alert('Settings saved successfully!'));
    };
    
    const handleAddPath = () => { if (newPath) { fetch(`${API_URL}/api/library/paths`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: newPath }) }).then(res => res.json()).then(addedPath => { setPaths([...paths, addedPath]); setNewPath(''); }); } };
    const handleDeletePath = (idToDelete) => { fetch(`${API_URL}/api/library/paths/${idToDelete}`, { method: 'DELETE', }).then(() => { setPaths(paths.filter(p => p.id !== idToDelete)); }); };
    const handleAddYouTubeUrl = () => { if (youtubeUrl) { fetch(`${API_URL}/api/youtube`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: youtubeUrl }), }).then(res => { if (!res.ok) { return res.json().then(err => Promise.reject(err)); } return res.json(); }).then(data => { setYoutubeUrl(''); alert(`Successfully added ${data.count} item(s) from the YouTube ${data.type}.`); if (onLibraryUpdate) { onLibraryUpdate(); } }).catch(err => { console.error("Failed to add YouTube URL:", err); alert(`Error: ${err.message || 'An unknown error occurred.'}`); }); } };
    const handleScanLibrary = () => { setIsScanning(true); fetch(`${API_URL}/api/library/scan`, { method: 'POST' }).then(res => res.json()).then(data => { alert(data.message); setIsScanning(false); if (onLibraryUpdate) { onLibraryUpdate(); } }).catch(error => { alert('Error: Could not start library scan.'); setIsScanning(false); }); };
    const handlePurgeLibrary = () => { if (window.confirm('DANGER: Are you sure you want to purge the entire media library?')) { setIsPurging(true); fetch(`${API_URL}/api/library/purge`, { method: 'DELETE' }).then(res => res.json()).then(data => { alert(data.message); setIsPurging(false); if (onLibraryUpdate) { onLibraryUpdate(); } }).catch(error => { alert('Error: Could not purge the library.'); setIsPurging(false); }); } };
    const handleShutdownServer = () => { if (window.confirm('WARNING: Are you sure you want to shut down BoomServer?')) { setIsShuttingDown(true); fetch(`${API_URL}/api/shutdown`, { method: 'POST' }).then(res => res.json()).then(data => { alert(data.message); window.location.href = 'https://wapaccess.org'; }).catch(error => { alert('Error: Could not shut down the server.'); setIsShuttingDown(false); }); } };

    if (isLoading) return <CircularProgress />;

    return (
      <Box>
        <Typography variant="h5" gutterBottom>Network Settings</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Set your public address here to make M3U files work outside your local network. This requires port forwarding on your router.
        </Typography>
        <TextField name="publicUrlBase" label="Public URL Base" value={settings.publicUrlBase} onChange={handleSettingsChange} fullWidth margin="normal" placeholder="e.g., http://your-public-ip:8000" />
        <Button variant="contained" onClick={handleSaveSettings} sx={{mb: 2}}>Save Network Settings</Button>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>Library Paths</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Add the folder paths where your media is stored.</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <TextField label="Copy and paste media path" variant="outlined" value={newPath} onChange={(e) => setNewPath(e.target.value)} fullWidth sx={{ mr: 2 }} />
          <Button variant="contained" onClick={handleAddPath}>Add Path</Button>
        </Box>
        <List>{paths.map((p) => (<ListItem key={p.id} secondaryAction={ <IconButton edge="end" onClick={() => handleDeletePath(p.id)}> <DeleteIcon /> </IconButton> }><ListItemText primary={p.path} /></ListItem>))}</List>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h5" gutterBottom>Add from YouTube</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>Paste a link to a public YouTube video or playlist to add it to the library.</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <TextField label="YouTube Video or Playlist URL" variant="outlined" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} fullWidth sx={{ mr: 2 }} />
            <Button variant="contained" color="secondary" onClick={handleAddYouTubeUrl}>Add Content</Button>
        </Box>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h5" gutterBottom>Library Actions</Typography>
        <Button variant="contained" color="primary" startIcon={<SyncIcon />} onClick={handleScanLibrary} disabled={isScanning}>{isScanning ? 'Scanning In Progress...' : 'Scan Library Files'}</Button>
        <Paper variant="outlined" sx={{ mt: 4, p: 2, borderColor: 'error.main' }}>
            <Typography variant="h6" color="error.main" gutterBottom>Danger Zone</Typography>
            <Button variant="contained" color="error" startIcon={<CleaningServicesIcon />} onClick={handlePurgeLibrary} disabled={isPurging} sx={{ mr: 2 }}>{isPurging ? 'Purging...' : 'Purge Media Library'}</Button>
            <Button variant="contained" color="error" startIcon={<PowerSettingsNewIcon />} onClick={handleShutdownServer} disabled={isShuttingDown}>{isShuttingDown ? 'Shutting Down...' : 'Shutdown BoomServer'}</Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>This will remove all media entries from the database. It will not delete any of your physical files.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>The Shutdown button will stop the backend server and redirect your browser.</Typography>
        </Paper>
      </Box>
    );
}

export default LibrarySettings;