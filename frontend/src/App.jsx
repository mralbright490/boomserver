import React, { useState, useCallback } from 'react'; // CORRECTED: Removed "=> 'useCallback';" and unused useEffect
import { ThemeProvider, createTheme, CssBaseline, Box, Tabs, Tab, Container, Typography } from '@mui/material';
import LibrarySettings from './components/LibrarySettings';
import LibraryViewer from './components/LibraryViewer';
import BomCastScheduler from './components/BomCastScheduler';

const vaporwaveTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // Neon Cyan
    },
    secondary: {
      main: '#f50057', // Neon Pink/Magenta
    },
    background: {
      default: '#1a1a3d', // Dark Purple/Blue
      paper: '#2a2a4d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3e6',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontFamily: '"Press Start 2P", monospace',
      color: '#ff79c6',
    },
    h5: {
      fontFamily: '"Press Start 2P", monospace',
      color: '#bd93f9',
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [libraryRefreshTrigger, setLibraryRefreshTrigger] = useState(0);
  const [schedulerRefreshTrigger, setSchedulerRefreshTrigger] = useState(0); // State for scheduler refresh

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 0) { // Library tab
      setLibraryRefreshTrigger(prev => prev + 1);
    } else if (newValue === 1) { // Scheduler tab
      setSchedulerRefreshTrigger(prev => prev + 1); // Trigger refresh for scheduler
    } else if (newValue === 2) { // Settings tab
      // For Settings, data is typically fetched on mount or triggered by explicit actions
      // However, if there are data-driven displays that need refreshing on tab switch,
      // a similar trigger can be added here and passed to LibrarySettings.
      // For now, no direct refreshTrigger for Settings needed unless specific components within require it.
    }
  };

  const handleLibraryUpdate = useCallback(() => {
    setLibraryRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ThemeProvider theme={vaporwaveTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            //-- BoomServer --//
          </Typography>
        </Box>

        <Box sx={{ width: '100%', border: '1px solid #333', borderRadius: 2, p: 0.5, bgcolor: 'background.paper' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="navigation tabs">
              <Tab label="Library" />
              <Tab label="Scheduler" />
              <Tab label="Settings" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ pt: 2 }} hidden={currentTab !== 0}>
            <LibraryViewer refreshTrigger={libraryRefreshTrigger} />
          </Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 1}>
            <BomCastScheduler refreshTrigger={schedulerRefreshTrigger} /> {/* Pass refreshTrigger to scheduler */}
          </Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 2}>
            <LibrarySettings onLibraryUpdate={handleLibraryUpdate} />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;