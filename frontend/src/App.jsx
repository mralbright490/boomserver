import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Tabs, Tab, Container, Typography } from '@mui/material';
import LibrarySettings from './components/LibrarySettings';
import LibraryViewer from './components/LibraryViewer';
import BomCastScheduler from './components/BomCastScheduler';
import ChannelManager from './components/ChannelManager';
import AdManager from './components/AdManager';

const vaporwaveTheme = createTheme({
  palette: { mode: 'dark', primary: { main: '#00e5ff', }, secondary: { main: '#f50057', }, background: { default: '#1a1a3d', paper: '#2a2a4d', }, text: { primary: '#ffffff', secondary: '#b3b3e6', }, },
  typography: { fontFamily: 'Roboto, sans-serif', h4: { fontFamily: '"Press Start 2P", monospace', color: '#ff79c6', }, h5: { fontFamily: '"Press Start 2P", monospace', color: '#bd93f9', }, },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleLibraryUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ThemeProvider theme={vaporwaveTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1">//-- BoomServer --//</Typography>
            <Typography color="text.secondary">Media Asset Management for Project: <span style={{color: '#ff79c6'}}>Bomcast</span></Typography>
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
          <Box sx={{ pt: 2 }} hidden={currentTab !== 1}><BomCastScheduler refreshTrigger={refreshTrigger} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 2}><LibraryViewer refreshTrigger={refreshTrigger} onUpdate={handleLibraryUpdate} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 3}><AdManager refreshTrigger={refreshTrigger} onUpdate={handleLibraryUpdate} /></Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 4}><LibrarySettings onLibraryUpdate={handleLibraryUpdate} /></Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;