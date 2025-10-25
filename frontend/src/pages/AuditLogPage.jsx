import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AuditLogPage = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/audit')
            .then(res => setLogs(res.data))
            .catch(err => {
                if (err.response?.status === 403) alert("No tienes permiso para ver esta sección.");
                else console.error("Error fetching audit log:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    const isSuperAdmin = user?.isSuperAdmin;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {isSuperAdmin ? "Registro de Auditoría Global" : "Registro de Auditoría del Sistema"}
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
                                        {/* --- CORRECCIÓN --- */}
                                        {/* 'log.details' ya es un objeto, solo necesitamos 'stringify' para mostrarlo bonito */}
                                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                            {JSON.stringify(log.details || {}, null, 2)}
                                        </pre>
                                        {/* --- FIN DE LA CORRECCIÓN --- */}
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