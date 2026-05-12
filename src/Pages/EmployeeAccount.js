import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Box, Typography, Stack, Chip, Paper, Divider,
  CircularProgress,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { Context } from '../Pages/Context';
import { QRCodeSVG } from 'qrcode.react';
import { getEmployeeLogs } from '../api';

export default function EmployeeAccount() {
  const ctx = useContext(Context);
  const navigate = useNavigate();

  const [coords, setCoords] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Acquiring location…');
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const email = ctx.loggedEmployeeEmail || localStorage.getItem('email') || '';

  useEffect(() => {
    ctx.updateUser(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
        );
      },
      () => setLocationLabel('Location unavailable')
    );
  }, []);

  // Fetch this employee's check-in history
  useEffect(() => {
    if (!email) return;
    setLogsLoading(true);
    getEmployeeLogs(email)
      .then(setCheckinLogs)
      .catch(() => setCheckinLogs([]))
      .finally(() => setLogsLoading(false));
  }, [email]);

  // Update timestamp every 5 seconds for a dynamic, secure QR code
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Build QR payload: JSON encoded so admin screen can parse it
  const qrPayload = JSON.stringify({
    email,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    ts: currentTime.toISOString(),
  });
  const qrUrl = `http://localhost:3000/admin/dashboard/${encodeURIComponent(qrPayload)}`;

  const handleLogout = () => {
    ctx.updateUser(1);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h4" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
        My Check-In Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
        Signed in as <strong>{email}</strong>
      </Typography>

      {/* QR Card */}
      <Paper
        className="glass-panel"
        sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <QrCode2Icon sx={{ color: '#FF1493' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>Your Check-In QR Code</Typography>
        </Stack>
        <Alert severity="success" sx={{ width: '100%' }}>
          Present this QR code to your administrator to register your arrival time.
        </Alert>

        {/* Location chip */}
        <Chip
          icon={<LocationOnIcon />}
          label={locationLabel}
          sx={{
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />

        {/* QR Code */}
        <Box sx={{ 
          position: 'relative',
          background: 'white', 
          p: 2.5, 
          borderRadius: 4,
          boxShadow: '0 0 30px rgba(255, 20, 147, 0.4)',
          border: '4px solid transparent',
          backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #8A2BE2, #FF1493)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box',
          overflow: 'hidden'
        }}>
          {/* Scanning line animation */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '5px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.8), transparent)',
              boxShadow: '0px 2px 10px rgba(255, 20, 147, 0.8)',
              animation: 'scan 2.5s infinite linear',
              '@keyframes scan': {
                '0%': { top: '0%' },
                '50%': { top: '100%' },
                '100%': { top: '0%' },
              },
              zIndex: 10
            }}
          />
          <QRCodeSVG
            value={qrUrl}
            size={240}
            bgColor="#ffffff"
            fgColor="#0b0f19"
            level="H"
            includeMargin={false}
            imageSettings={{
              src: '/logo192.png',
              x: undefined,
              y: undefined,
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          QR code is dynamic and refreshes automatically for your security.
        </Typography>
      </Paper>

      {/* Check-In History */}
      <Paper className="glass-panel" sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <AccessTimeIcon sx={{ color: '#8A2BE2' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>My Arrival History</Typography>
        </Stack>

        {logsLoading ? (
          <CircularProgress size={28} sx={{ color: '#FF1493', display: 'block', mx: 'auto' }} />
        ) : checkinLogs.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            No check-ins recorded yet.
          </Typography>
        ) : (
          <Stack spacing={1} divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />}>
            {checkinLogs.map((log) => (
              <Stack key={log.id} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {new Date(log.arrival_time).toLocaleString()}
                </Typography>
                {log.latitude && (
                  <Chip
                    size="small"
                    icon={<LocationOnIcon />}
                    label={`${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`}
                    sx={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                  />
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Button
        className="primary-gradient-btn"
        variant="contained"
        onClick={handleLogout}
        sx={{ mt: 3, px: 4 }}
      >
        Sign Out
      </Button>
    </Box>
  );
}
