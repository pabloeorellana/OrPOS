import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './index.css';

// If the user lands on '/' with a tenant query param, rewrite the URL
// immediately to '/tenant-login?tenant=...' so React Router mounts the
// correct route before any app-level redirects run.
try {
  const params = new URLSearchParams(window.location.search);
  const tenant = params.get('tenant');
  if (tenant && window.location.pathname === '/') {
    const newUrl = `/tenant-login${window.location.search}`;
    window.history.replaceState({}, '', newUrl);
    // Also log so devs can see the automatic rewrite
    console.debug('main: rewrote URL to', newUrl);
  }
} catch (e) {
  // ignore in case of SSR or restricted environments
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
         <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <CssBaseline />
            <App />
          </LocalizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);