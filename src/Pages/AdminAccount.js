import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Box, TextField, Typography, Stack, Paper, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import AddIcon from '@mui/icons-material/Add';

import {
  logCheckIn, getAllLogs, getUsers, deleteUser, getLocations,
  createLocation, registerUser, deleteLocation,
  getFAQs, createFAQ, updateFAQ, deleteFAQ
} from '../api';
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

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingAnswer, setEditingAnswer] = useState('');
  const [faqSuccessMessage, setFaqSuccessMessage] = useState('');

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

  const refreshFAQs = useCallback(() => {
    setFaqsLoading(true);
    getFAQs()
      .then(setFaqs)
      .catch(() => setFaqs([]))
      .finally(() => setFaqsLoading(false));
  }, []);

  useEffect(() => {
    refreshLogs();
    refreshData();
    refreshFAQs();
  }, [refreshLogs, refreshData, refreshFAQs]);

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

  // FAQ CRUD handlers
  const handleAddFAQ = async (e) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) return;
    try {
      const updated = await createFAQ(newQuestion, newAnswer);
      setFaqs(updated);
      setNewQuestion('');
      setNewAnswer('');
      setFaqSuccessMessage('🔥 Chatbot knowledge base hot-upgraded successfully!');
      setTimeout(() => setFaqSuccessMessage(''), 4000);
    } catch (err) {
      setScanError(`Failed to add FAQ: ${err.message}`);
    }
  };

  const handleStartEdit = (faq) => {
    setEditingId(faq.id);
    setEditingQuestion(faq.question);
    setEditingAnswer(faq.answer);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingQuestion('');
    setEditingAnswer('');
  };

  const handleSaveFAQ = async (id) => {
    if (!editingQuestion || !editingAnswer) return;
    try {
      const updated = await updateFAQ(id, editingQuestion, editingAnswer);
      setFaqs(updated);
      setEditingId(null);
      setEditingQuestion('');
      setEditingAnswer('');
      setFaqSuccessMessage('🔥 Chatbot knowledge base hot-updated instantly!');
      setTimeout(() => setFaqSuccessMessage(''), 4000);
    } catch (err) {
      setScanError(`Failed to update FAQ: ${err.message}`);
    }
  };

  const handleDeleteFAQ = async (id) => {
    try {
      const updated = await deleteFAQ(id);
      setFaqs(updated);
      setFaqSuccessMessage('🔥 FAQ deleted and chatbot knowledge base upgraded!');
      setTimeout(() => setFaqSuccessMessage(''), 4000);
    } catch (err) {
      setScanError(`Failed to delete FAQ: ${err.message}`);
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

      {/* ── Statistics Summary ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={3}>
        <Paper className="glass-panel" sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(138, 43, 226, 0.2)', color: '#8A2BE2' }}><PeopleIcon /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">{employees.length}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Employees</Typography>
          </Box>
        </Paper>
        <Paper className="glass-panel" sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255, 20, 147, 0.2)', color: '#FF1493' }}><BusinessIcon /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">{locations.length}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Branches</Typography>
          </Box>
        </Paper>
        <Paper className="glass-panel" sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(0, 255, 127, 0.2)', color: '#00FF7F' }}><AccessTimeIcon /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">{checkinLogs.length}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Check-ins</Typography>
          </Box>
        </Paper>
      </Stack>

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

      {/* ── Chatbot FAQ Manager (Hot Upgrades Portal) ── */}
      <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HelpOutlineIcon sx={{ color: '#FF1493' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>ChatterMax FAQ Knowledge Base</Typography>
          </Stack>
          <Chip
            icon={<BoltIcon sx={{ color: '#00FF7F !important' }} />}
            label="Hot-Reload Ready"
            sx={{
              background: 'rgba(0, 255, 127, 0.1)',
              color: '#00FF7F',
              border: '1px solid rgba(0, 255, 127, 0.3)',
              fontWeight: 'bold',
              fontSize: 12,
            }}
          />
        </Stack>

        {faqSuccessMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {faqSuccessMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleAddFAQ} sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            Add New Q&A Pair (Auto Hot-Upgrade)
          </Typography>
          <Stack spacing={2}>
            <TextField
              className="glass-input"
              size="small"
              fullWidth
              label="Question"
              placeholder="e.g. What are the office hours?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <TextField
              className="glass-input"
              size="small"
              fullWidth
              multiline
              rows={2}
              label="Answer"
              placeholder="e.g. Office hours are 9 AM to 5 PM Monday to Friday."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
            <Button
              type="submit"
              className="primary-gradient-btn"
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!newQuestion || !newAnswer}
              sx={{ alignSelf: 'flex-start', px: 3 }}
            >
              Add & Live Deploy
            </Button>
          </Stack>
        </Box>

        {faqsLoading ? (
          <CircularProgress size={28} sx={{ color: '#FF1493', display: 'block', mx: 'auto' }} />
        ) : faqs.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            No custom FAQs yet. Add one above to hot-upgrade the chatbot's brain!
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)', width: '35%' }}>Question</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)', width: '45%' }}>Answer</TableCell>
                  <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', width: '20%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)', verticalAlign: 'top' }}>
                      {editingId === faq.id ? (
                        <TextField
                          className="glass-input"
                          fullWidth
                          size="small"
                          value={editingQuestion}
                          onChange={(e) => setEditingQuestion(e.target.value)}
                        />
                      ) : (
                        faq.question
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.06)', verticalAlign: 'top' }}>
                      {editingId === faq.id ? (
                        <TextField
                          className="glass-input"
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          value={editingAnswer}
                          onChange={(e) => setEditingAnswer(e.target.value)}
                        />
                      ) : (
                        faq.answer
                      )}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)', verticalAlign: 'top' }}>
                      {editingId === faq.id ? (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" color="success" onClick={() => handleSaveFAQ(faq.id)}>
                            Save
                          </Button>
                          <Button size="small" variant="outlined" color="inherit" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" color="primary" onClick={() => handleStartEdit(faq)}>
                            Edit
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteFAQ(faq.id)}>
                            Delete
                          </Button>
                        </Stack>
                      )}
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
