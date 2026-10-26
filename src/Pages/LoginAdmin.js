import React from 'react';
import Auth from './Auth';

// Both admin and employee reach the same shared login page.
// The server verifies credentials and routes to the correct dashboard.
export default function LoginAdmin() {
  return <Auth />;
}
