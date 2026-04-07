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
              <Route path="/Pages/LoginAdmin" element={<LoginAdmin />} />
              <Route path="/Pages/LoginEmployee" element={<LoginEmployee />} />
              <Route
                path="/Pages/AdminAccount/:emailLink"
                element={<AdminAccount />}
              />
              <Route path="/Pages/AdminAccount/" element={<AdminAccount />} />
              <Route
                path="/Pages/EmployeeAccount"
                element={<EmployeeAccount />}
              />
              <Route
                path="Pages/LoginEmployee/Pages/EmployeeAccount"
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
