import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Layout from './Pages/Layout';
import LoginAdmin from './Pages/LoginAdmin';
import LoginEmployee from './Pages/LoginEmployee';
import AdminAccount from './Pages/AdminAccount';
import EmployeeAccount from './Pages/EmployeeAccount';

import { ContextProvider } from './Pages/Context';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8A2BE2', // BlueViolet
    },
    secondary: {
      main: '#FF1493', // DeepPink
    },
    background: {
      default: 'transparent', // Let the CSS background show through
      paper: 'rgba(20, 20, 35, 0.7)',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(15, 15, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 15, 25, 0.7)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ContextProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LoginAdmin />} />
              <Route path="/admin/login" element={<LoginAdmin />} />
              <Route path="/employee/login" element={<LoginEmployee />} />
              <Route
                path="/admin/dashboard/:emailLink"
                element={<AdminAccount />}
              />
              <Route path="/admin/dashboard" element={<AdminAccount />} />
              <Route
                path="/employee/dashboard"
                element={<EmployeeAccount />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ContextProvider>
    </ThemeProvider>
  );
}

export default App;
