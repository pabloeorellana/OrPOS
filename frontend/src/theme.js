import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1d84a7', // Un azul similar al de la barra superior del modelo
        },
        secondary: {
            main: '#2db0a2', // El verde/teal para los botones de acción
        },
        background: {
            default: '#f5f7fa', // Un fondo gris muy claro
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h4: {
            fontWeight: 500,
        },
    },
    components: {
        // Estilo para el AppBar (barra superior)
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#23282d', // Un gris/azul oscuro
                    color: '#e0e0e0',
                },
            },
        },
        // Estilo para el Drawer (menú lateral)
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#23282d',
                    color: '#e0e0e0',
                    '& .MuiListItemIcon-root': {
                        color: '#e0e0e0',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
    },
});

export default theme;