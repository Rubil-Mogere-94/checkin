import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Layout from './Pages/Layout';
import Auth from './Pages/Auth';
import LoginAdmin from './Pages/LoginAdmin';
import LoginEmployee from './Pages/LoginEmployee';
import AdminAccount from './Pages/AdminAccount';
import EmployeeAccount from './Pages/EmployeeAccount';

import { ContextProvider } from './Pages/Context';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const v2Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#14251f',
    },
    secondary: {
      main: '#b9d746',
    },
    background: {
      default: '#f4f6f1',
      paper: '#ffffff',
    },
    text: {
      primary: '#192720',
      secondary: '#77837b',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  return (
    <ThemeProvider theme={v2Theme}>
      <CssBaseline />
      <ContextProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Canonical shared login — everyone uses this single page */}
              <Route path="/login" element={<Auth />} />

              {/* Legacy / convenience paths redirect to /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/employee/login" element={<Navigate to="/login" replace />} />

              {/* Protected dashboards */}
              <Route path="/admin/dashboard/:emailLink" element={<AdminAccount />} />
              <Route path="/admin/dashboard" element={<AdminAccount />} />
              <Route path="/employee/dashboard" element={<EmployeeAccount />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ContextProvider>
    </ThemeProvider>
  );
}

export default App;
