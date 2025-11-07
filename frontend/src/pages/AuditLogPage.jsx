import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';

const AuditLogPage = () => {
    const { user } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.debug('[AuditLogPage] Mount: fetching /audit');
        apiClient.get('/audit')
            .then(res => {
                console.debug('[AuditLogPage] /audit response rows:', Array.isArray(res.data) ? res.data.length : typeof res.data);
                setLogs(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => {
                console.error('[AuditLogPage] error:', err?.response?.status, err?.response?.data || err.message);
                if (err.response?.status === 403) showSnackbar('No tienes permiso para ver esta sección.', 'error');
            })
            .finally(() => setLoading(false));
    }, []);

    const isSuperAdmin = user?.isSuperAdmin;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {isSuperAdmin ? 'Registro de Auditoría Global' : 'Registro de Auditoría del Sistema'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Estado: {loading ? 'cargando' : 'cargado'} | Registros: {logs?.length ?? 0}
            </Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha y Hora</TableCell>
                            {isSuperAdmin && <TableCell>Negocio (Tenant)</TableCell>}
                            <TableCell>Usuario</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Acción</TableCell>
                            <TableCell>Detalles</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={isSuperAdmin ? 6 : 5} align="center">Cargando...</TableCell></TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow><TableCell colSpan={isSuperAdmin ? 6 : 5} align="center">Sin registros de auditoría</TableCell></TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell>{new Date(log.timestamp).toLocaleString('es-AR')}</TableCell>
                                    {isSuperAdmin && <TableCell>{log.tenant_name || <Chip label="Global" size="small" variant="outlined" />}</TableCell>}
                                    <TableCell>{log.username || 'Sistema'}</TableCell>
                                    <TableCell>
                                        {log.user_role ? <Chip label={log.user_role} size="small" /> : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {log.action}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                            {JSON.stringify(log.details || {}, null, 2)}
                                        </pre>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AuditLogPage;