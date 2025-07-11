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
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [isShuttingDown, setIsShuttingDown] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/library/paths`)
          .then(res => res.json())
          .then(data => {
            setPaths(data);
            setIsLoading(false);
          })
          .catch(error => console.error("Failed to fetch library paths:", error));
      }, []);
      
      const handleAddPath = () => {
        if (newPath) {
          fetch(`${API_URL}/api/library/paths`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: newPath })
          })
          .then(res => res.json())
          .then(addedPath => {
            setPaths([...paths, addedPath]);
            setNewPath('');
          });
        }
      };
      
      const handleDeletePath = (idToDelete) => {
        fetch(`${API_URL}/api/library/paths/${idToDelete}`, {
          method: 'DELETE',
        })
        .then(() => {
          setPaths(paths.filter(p => p.id !== idToDelete));
        });
      };
      
    const handleScanLibrary = () => {
      setIsScanning(true);
      fetch(`${API_URL}/api/library/scan`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          alert(data.message); 
          setIsScanning(false);
          if (onLibraryUpdate) {
            onLibraryUpdate();
          }
        })
        .catch(error => {
          alert('Error: Could not start library scan.');
          setIsScanning(false);
        });
    };

    const handlePurgeLibrary = () => {
        const isConfirmed = window.confirm(
            'DANGER: Are you sure you want to purge the entire media library?\n\nThis will remove all media records from the database but will NOT delete your actual files. This action cannot be undone.'
        );

        if (isConfirmed) {
            setIsPurging(true);
            fetch(`${API_URL}/api/library/purge`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    alert(data.message);
                    setIsPurging(false);
                    if (onLibraryUpdate) {
                        onLibraryUpdate();
                    }
                })
                .catch(error => {
                    alert('Error: Could not purge the library.');
                    setIsPurging(false);
                });
        }
    };

    const handleShutdownServer = () => {
        const isConfirmed = window.confirm(
            'WARNING: Are you sure you want to shut down BoomServer?\n\nThis will stop the backend server and redirect your browser.'
        );

        if (isConfirmed) {
            setIsShuttingDown(true);
            fetch(`${API_URL}/api/shutdown`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    alert(data.message);
                    // NEW: Redirect the browser after successful shutdown message
                    window.location.href = 'https://wapaccess.org'; 
                })
                .catch(error => {
                    alert('Error: Could not shut down the server. It might already be stopped.');
                    setIsShuttingDown(false);
                });
        }
    };
    
    if (isLoading) return <CircularProgress />;
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Library Paths</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Add the folder paths where your media is stored.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <TextField
            label="Copy and paste media path"
            variant="outlined"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            fullWidth
            sx={{ mr: 2 }}
          />
          <Button variant="contained" onClick={handleAddPath}>Add Path</Button>
        </Box>
    
        <List>
          {paths.map((p) => (
            <ListItem key={p.id} secondaryAction={ <IconButton edge="end" onClick={() => handleDeletePath(p.id)}> <DeleteIcon /> </IconButton> }>
              <ListItemText primary={p.path} />
            </ListItem>
          ))}
        </List>
    
        <Divider sx={{ my: 4 }} />
    
        <Typography variant="h5" gutterBottom>Library Actions</Typography>
        <Button variant="contained" color="secondary" startIcon={<SyncIcon />} onClick={handleScanLibrary} disabled={isScanning}>
          {isScanning ? 'Scanning In Progress...' : 'Scan Library Files'}
        </Button>

        <Paper variant="outlined" sx={{ mt: 4, p: 2, borderColor: 'error.main' }}>
            <Typography variant="h6" color="error.main" gutterBottom>Danger Zone</Typography>
            <Button variant="contained" color="error" startIcon={<CleaningServicesIcon />} onClick={handlePurgeLibrary} disabled={isPurging} sx={{ mr: 2 }}>
                {isPurging ? 'Purging...' : 'Purge Media Library'}
            </Button>
            <Button variant="contained" color="error" startIcon={<PowerSettingsNewIcon />} onClick={handleShutdownServer} disabled={isShuttingDown}>
                {isShuttingDown ? 'Shutting Down...' : 'Shutdown BoomServer'}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will remove all media entries from the database. It will not delete any of your physical files.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The Shutdown button will stop the backend server and redirect your browser.
            </Typography>
        </Paper>
      </Box>
    );
}

export default LibrarySettings;