import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SuperAdminProvider } from './contexts/SuperAdminContext';
import { SettingsProvider } from './contexts/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider org="admin-portal">
      <AuthProvider org="admin-portal">
        <SuperAdminProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SuperAdminProvider>
      </AuthProvider>
    </SettingsProvider>
  </React.StrictMode>
);
