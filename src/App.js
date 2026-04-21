import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <>
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
    </>
  );
}

export default App;
