import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Box, TextField, Typography, Stack, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Autocomplete, CircularProgress, Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Context } from '../Pages/Context';
import { logCheckIn, getAllLogs } from '../api';

export default function AdminAccount() {
  const ctx = useContext(Context);
  const navigate = useNavigate();
  const { emailLink } = useParams(); // contains the encoded QR JSON payload

  // Form state
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newIdLocation, setNewIdLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(ctx.officeLocationList[0] || null);
  const [selectedEmployee, setSelectedEmployee] = useState(ctx.employeeList[0] || null);

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

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

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

  const employeeHandler = (e) => {
    e.preventDefault();
    if (!newEmployeeName || !newEmployeeEmail) return;
    ctx.addNewEmployee(newEmployeeName, newEmployeeEmail);
    setNewEmployeeName('');
    setNewEmployeeEmail('');
  };

  const officeLocationHandler = (e) => {
    e.preventDefault();
    if (!newLocationName || !newIdLocation) return;
    ctx.addNewOfficeLocation(newLocationName, newIdLocation);
    setNewLocationName('');
    setNewIdLocation('');
  };

  const officeLocationPerEmployeeHandler = (e) => {
    e.preventDefault();
    if (!selectedLocation || !selectedEmployee) return;
    ctx.addNewemployeePerOffice(selectedLocation.name, selectedEmployee.email);
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
            label="Name"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
          />
          <TextField
            className="glass-input"
            size="small"
            label="Email"
            value={newEmployeeEmail}
            onChange={(e) => setNewEmployeeEmail(e.target.value)}
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
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Name</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Email</TableCell>
                <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {ctx.employeeList.map((emp) => (
                <TableRow key={emp.email}>
                  <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}>{emp.name}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>{emp.email}</TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Button size="small" color="error" variant="outlined" onClick={() => ctx.deleteEmployee(emp)}>
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
              {ctx.officeLocationList.map((office) => (
                <TableRow key={office.id}>
                  <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}>{office.name}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>{office.id}</TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Button size="small" color="error" variant="outlined" onClick={() => ctx.deleteLocation(office)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Assign Employee to Branch ── */}
      <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <QrCodeScannerIcon sx={{ color: '#8A2BE2' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>Assign Employee to Branch</Typography>
        </Stack>
        <form onSubmit={officeLocationPerEmployeeHandler}>
          <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
            <Autocomplete
              disablePortal
              options={ctx.officeLocationList}
              getOptionLabel={(b) => b.name}
              value={selectedLocation}
              onChange={(_, v) => setSelectedLocation(v)}
              sx={{ width: 220 }}
              renderInput={(params) => <TextField {...params} className="glass-input" size="small" label="Branch" />}
            />
            <Autocomplete
              disablePortal
              options={ctx.employeeList}
              getOptionLabel={(e) => `${e.name} (${e.email})`}
              value={selectedEmployee}
              onChange={(_, v) => setSelectedEmployee(v)}
              sx={{ width: 280 }}
              renderInput={(params) => <TextField {...params} className="glass-input" size="small" label="Employee" />}
            />
            <Button className="primary-gradient-btn" variant="contained" type="submit">
              Assign
            </Button>
          </Stack>
        </form>

        {ctx.employeePerOfficeList.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Branch</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Employee</TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {ctx.employeePerOfficeList.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}>{row.office}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>{row.employee}</TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Button size="small" color="error" variant="outlined" onClick={() => ctx.deleteLocationPerEmployee(row)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
