import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Tabs, Tab, Container, Typography } from '@mui/material';
import LibrarySettings from './components/LibrarySettings';
import LibraryViewer from './components/LibraryViewer';
import BomCastScheduler from './components/BomCastScheduler';
import ChannelManager from './components/ChannelManager';
import AdManager from './components/AdManager'; // Import the new Ad Manager

const vaporwaveTheme = createTheme({ /* ... theme object ... */ });

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    handleLibraryUpdate();
  };

  const handleLibraryUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ThemeProvider theme={vaporwaveTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* ... header ... */}
        </Box>
        <Box sx={{ width: '100%', border: '1px solid #333', borderRadius: 2, p: 0.5, bgcolor: 'background.paper' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="navigation tabs" variant="scrollable" scrollButtons="auto">
              <Tab label="Channels" />
              <Tab label="Scheduler" />
              <Tab label="Library" />
              <Tab label="Ad Settings" />
              <Tab label="Settings" />
            </Tabs>
          </Box>

          <Box sx={{ pt: 2 }} hidden={currentTab !== 0}><ChannelManager refreshTrigger={refreshTrigger} onUpdate={handleLibraryUpdate} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 1}><BomCastScheduler refreshTrigger={refreshTrigger} onUpdate={handleLibraryUpdate} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 2}><LibraryViewer refreshTrigger={refreshTrigger} onUpdate={handleLibraryUpdate} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 3}><AdManager refreshTrigger={refreshTrigger} onUpdate={handleLibraryUpdate} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 4}><LibrarySettings onLibraryUpdate={handleLibraryUpdate} /></Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;