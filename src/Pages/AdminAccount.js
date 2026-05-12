import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Box, TextField, Typography, Stack, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { logCheckIn, getAllLogs, getUsers, deleteUser, getLocations, createLocation, registerUser, deleteLocation } from '../api';
import { Context } from './Context';

export default function AdminAccount() {
  const ctx = useContext(Context);
  const navigate = useNavigate();
  const { emailLink } = useParams(); // contains the encoded QR JSON payload

  // Form state

  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newIdLocation, setNewIdLocation] = useState('');

  // Data state
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);

  // Check-in logs
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [scanAlert, setScanAlert] = useState('');
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    ctx.updateUser(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all check-in logs
  const refreshLogs = useCallback(() => {
    setLogsLoading(true);
    getAllLogs()
      .then(setCheckinLogs)
      .catch(() => setCheckinLogs([]))
      .finally(() => setLogsLoading(false));
  }, []);

  const refreshData = useCallback(() => {
    getUsers()
      .then(data => setEmployees(data.filter(u => u.role === 'employee')))
      .catch(console.error);
    getLocations()
      .then(setLocations)
      .catch(console.error);
  }, []);

  useEffect(() => {
    refreshLogs();
    refreshData();
  }, [refreshLogs, refreshData]);

  // When admin scans QR — emailLink holds encoded JSON payload
  useEffect(() => {
    if (!emailLink) return;
    let payload;
    try {
      payload = JSON.parse(decodeURIComponent(emailLink));
    } catch {
      setScanError('Invalid QR payload format.');
      return;
    }
    if (!payload.email) {
      setScanError('QR code is missing employee email.');
      return;
    }
    // Auto-log the check-in
    logCheckIn(payload.email, payload.lat, payload.lng)
      .then(() => {
        setScanAlert(
          `✅ Check-in recorded for ${payload.email} at ${new Date(payload.ts || Date.now()).toLocaleString()}`
        );
        refreshLogs();
      })
      .catch((err) => setScanError(`Check-in failed: ${err.message}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailLink]);

  const handleLogout = () => {
    ctx.updateUser(1);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    navigate('/');
  };

  const employeeHandler = async (e) => {
    e.preventDefault();
    if (!newEmployeeEmail || !newEmployeePassword) return;
    try {
      await registerUser(newEmployeeEmail, newEmployeePassword, 'employee');
      setNewEmployeeEmail('');
      setNewEmployeePassword('');
      refreshData();
    } catch (err) {
      setScanError(err.message);
    }
  };

  const removeEmployee = async (id) => {
    try {
      await deleteUser(id);
      refreshData();
    } catch (err) {
      setScanError(err.message);
    }
  };

  const officeLocationHandler = async (e) => {
    e.preventDefault();
    if (!newLocationName || !newIdLocation) return;
    try {
      await createLocation(newLocationName, newIdLocation);
      setNewLocationName('');
      setNewIdLocation('');
      refreshData();
    } catch (err) {
      setScanError(err.message);
    }
  };

  const removeLocation = async (id) => {
    try {
      await deleteLocation(id);
      refreshData();
    } catch (err) {
      setScanError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
        Manage employees, locations, and check-in records
      </Typography>

      {/* QR Scan Feedback */}
      {scanAlert && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setScanAlert('')}>
          {scanAlert}
        </Alert>
      )}
      {scanError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScanError('')}>
          {scanError}
        </Alert>
      )}

      {/* ── Employees ── */}
      <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <PeopleIcon sx={{ color: '#8A2BE2' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>Employee List</Typography>
        </Stack>

        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <TextField
            className="glass-input"
            size="small"
            label="Email"
            value={newEmployeeEmail}
            onChange={(e) => setNewEmployeeEmail(e.target.value)}
          />
          <TextField
            className="glass-input"
            size="small"
            label="Password"
            type="password"
            value={newEmployeePassword}
            onChange={(e) => setNewEmployeePassword(e.target.value)}
          />
          <Button
            className="primary-gradient-btn"
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={employeeHandler}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Employee
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>ID</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Email</TableCell>
                <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}>{emp.id}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>{emp.email}</TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Button size="small" color="error" variant="outlined" onClick={() => removeEmployee(emp.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Branches ── */}
      <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <BusinessIcon sx={{ color: '#8A2BE2' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>Branch Locations</Typography>
        </Stack>

        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <TextField
            className="glass-input"
            size="small"
            label="Branch Name"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
          />
          <TextField
            className="glass-input"
            size="small"
            label="Branch ID"
            value={newIdLocation}
            onChange={(e) => setNewIdLocation(e.target.value)}
          />
          <Button className="primary-gradient-btn" variant="contained" onClick={officeLocationHandler}>
            Add Branch
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Branch</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>ID</TableCell>
                <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((office) => (
                <TableRow key={office.id}>
                  <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}>{office.name}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>{office.branch_id}</TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Button size="small" color="error" variant="outlined" onClick={() => removeLocation(office.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>



      {/* ── Arrival Log ── */}
      <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccessTimeIcon sx={{ color: '#FF1493' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>Arrival Check-In Log</Typography>
          </Stack>
          <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={refreshLogs}>
            Refresh
          </Button>
        </Stack>

        {logsLoading ? (
          <CircularProgress size={28} sx={{ color: '#FF1493', display: 'block', mx: 'auto' }} />
        ) : checkinLogs.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            No check-ins yet. Scan an employee's QR code to register their arrival.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Employee</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Arrival Time</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checkinLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}>{log.employee_email}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      {new Date(log.arrival_time).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {log.latitude ? (
                        <Chip
                          size="small"
                          icon={<LocationOnIcon />}
                          label={`${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`}
                          sx={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Button className="primary-gradient-btn" variant="contained" onClick={handleLogout} sx={{ px: 4 }}>
        Sign Out
      </Button>
    </Box>
  );
}
