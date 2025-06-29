import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Tabs, Tab, Container, Typography } from '@mui/material';
import LibrarySettings from './components/LibrarySettings';
import LibraryViewer from './components/LibraryViewer';

// NEW: Vaporwave-inspired theme
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
    fontFamily: 'Roboto, sans-serif', // Modern font for body text
    h4: {
      fontFamily: '"Press Start 2P", monospace', // Retro font for main headers
      color: '#ff79c6', // Light Pink
    },
    h5: {
      fontFamily: '"Press Start 2P", monospace',
      color: '#bd93f9', // Light Purple
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={vaporwaveTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            //-- BoomServer --//
          </Typography>
          <Typography color="text.secondary">
            Media Asset Management for Project: BombCast
          </Typography>
        </Box>

        <Box sx={{ width: '100%', border: '1px solid #333', borderRadius: 2, p: 0.5, bgcolor: 'background.paper' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="navigation tabs">
              <Tab label="Library" />
              <Tab label="Settings" />
            </Tabs>
          </Box>

          <Box sx={{ pt: 2 }} hidden={currentTab !== 0}>
            <LibraryViewer />
          </Box>
          <Box sx={{ pt: 2 }} hidden={currentTab !== 1}>
            <LibrarySettings />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;