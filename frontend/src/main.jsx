import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from '@mui/material/styles'; // Importar ThemeProvider
import CssBaseline from '@mui/material/CssBaseline'; // Importar CssBaseline para normalizar estilos
import theme from './theme'; // Importar nuestro tema
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}> {/* Envolver la app con el tema */}
          <CssBaseline /> {/* Aplicar estilos base */}
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);