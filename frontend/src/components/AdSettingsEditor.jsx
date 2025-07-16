import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, FormGroup, FormControlLabel, Switch, TextField, RadioGroup, Radio, FormControl } from '@mui/material';

const style = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, };

function AdSettingsEditor({ channel, open, onClose, onSave }) {
  const [adSettings, setAdSettings] = useState({ active: false, rule: 'programCount', programsPerAd: 3, adCount: 1, intervalMinutes: 30 });

  useEffect(() => {
    if (channel) {
      setAdSettings(channel.adSettings || { active: false, rule: 'programCount', programsPerAd: 3, adCount: 1, intervalMinutes: 30 });
    }
  }, [channel]);

  const handleSave = () => {
    const updatedChannelData = { ...channel, adSettings };
    onSave(channel.id, updatedChannelData);
  };

  const handleAdSettingChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAdSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (name === 'rule' ? value : parseInt(value))
    }));
  };

  if (!channel) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">Ad Settings for: {channel.name}</Typography>
        <FormGroup sx={{mt: 2}}>
            <FormControlLabel control={<Switch checked={adSettings.active} onChange={handleAdSettingChange} name="active" />} label="Enable Automatic Ads" />
        </FormGroup>
        
        {adSettings.active && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
                <RadioGroup name="rule" value={adSettings.rule} onChange={handleAdSettingChange}>
                    <FormControlLabel value="programCount" control={<Radio />} label="Insert ads after a set number of programs" />
                    {adSettings.rule === 'programCount' && (
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pl: 4 }}>
                            <Typography>Insert</Typography>
                            <TextField name="adCount" type="number" value={adSettings.adCount} onChange={handleAdSettingChange} sx={{ width: '80px' }} size="small" />
                            <Typography>Ad(s) after every</Typography>
                            <TextField name="programsPerAd" type="number" value={adSettings.programsPerAd} onChange={handleAdSettingChange} sx={{ width: '80px' }} size="small" />
                            <Typography>program(s).</Typography>
                        </Box>
                    )}
                    <FormControlLabel value="timedInterval" control={<Radio />} label="Insert ads at a timed interval" />
                     {adSettings.rule === 'timedInterval' && (
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pl: 4 }}>
                            <Typography>Insert</Typography>
                            <TextField name="adCount" type="number" value={adSettings.adCount} onChange={handleAdSettingChange} sx={{ width: '80px' }} size="small" />
                            <Typography>Ad(s) approximately every</Typography>
                            <TextField name="intervalMinutes" type="number" value={adSettings.intervalMinutes} onChange={handleAdSettingChange} sx={{ width: '80px' }} size="small" />
                            <Typography>minutes.</Typography>
                        </Box>
                    )}
                </RadioGroup>
            </FormControl>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save Changes</Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default AdSettingsEditor;