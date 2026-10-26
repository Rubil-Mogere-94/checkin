import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'var(--canvas)' }}>
      <Outlet />
    </div>
  );
}
