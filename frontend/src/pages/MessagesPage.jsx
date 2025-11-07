
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Modal, TextField, Select, MenuItem, FormControl, InputLabel, Paper, Tabs, Tab, IconButton, Badge, Tooltip } from '@mui/material';
import { Delete, MarkEmailRead } from '@mui/icons-material';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
    const { user, refreshUnreadMessages } = useAuth();
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [receiverId, setReceiverId] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [inboxRes, sentRes, usersRes] = await Promise.all([
                apiClient.get('/messages?box=inbox'),
                apiClient.get('/messages?box=sent'),
                apiClient.get('/messages/users')
            ]);
            setInbox(inboxRes.data);
            setSent(sentRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshInbox = async () => {
        try {
            const { data } = await apiClient.get('/messages?box=inbox');
            setInbox(data);
        } catch (e) { console.error(e); }
    };
    const refreshSent = async () => {
        try {
            const { data } = await apiClient.get('/messages?box=sent');
            setSent(data);
        } catch (e) { console.error(e); }
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSendMessage = async () => {
        if (!receiverId || !subject.trim() || !message.trim()) return;
        setSending(true);
        try {
            await apiClient.post('/messages', { receiver_id: receiverId, subject: subject.trim(), message: message.trim() });
            handleClose();
            setReceiverId('');
            setSubject('');
            setMessage('');
            refreshSent();
            refreshInbox();
            refreshUnreadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    const markRead = async (id) => {
        try {
            await apiClient.put(`/messages/${id}/read`);
            refreshInbox();
            refreshUnreadMessages();
        } catch (e) { console.error(e); }
    };

    const deleteMessage = async (id) => {
        try {
            await apiClient.delete(`/messages/${id}`);
            // refrescar según tab activo
            if (tab === 0) refreshInbox(); else refreshSent();
        } catch (e) { console.error(e); }
    };

    const unreadCount = inbox.filter(m => !m.read_at).length;


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Mensajes {unreadCount > 0 && (
                    <Badge color="primary" badgeContent={unreadCount} sx={{ ml: 1 }} />
                )}
            </Typography>
            <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>Nuevo Mensaje</Button>
            
            <Paper>
                <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" centered>
                    <Tab label="Recibidos" />
                    <Tab label="Enviados" />
                </Tabs>
                {tab === 0 && (
                    <Box sx={{ p: 2 }}>
                        {inbox.map(msg => (
                            <Paper key={msg.id} sx={{ p: 2, mb: 1, bgcolor: msg.read_at ? 'white' : 'rgba(0,0,0,0.05)', position:'relative' }}>
                                <Typography variant="subtitle2">De: {msg.sender}</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{msg.subject || '(Sin asunto)'}</Typography>
                                <Typography variant="body1" sx={{ whiteSpace:'pre-wrap' }}>{msg.message}</Typography>
                                <Typography variant="caption" display="block">{new Date(msg.created_at).toLocaleString()}</Typography>
                                <Box sx={{ position:'absolute', top:4, right:4, display:'flex', gap:1 }}>
                                    {!msg.read_at && (
                                        <Tooltip title="Marcar como leída">
                                            <IconButton size="small" onClick={() => markRead(msg.id)}><MarkEmailRead fontSize="inherit" /></IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Eliminar">
                                        <IconButton size="small" onClick={() => deleteMessage(msg.id)}><Delete fontSize="inherit" /></IconButton>
                                    </Tooltip>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
                {tab === 1 && (
                    <Box sx={{ p: 2 }}>
                        {sent.map(msg => (
                            <Paper key={msg.id} sx={{ p: 2, mb: 1, position:'relative' }}>
                                <Typography variant="subtitle2">Para: {users.find(u => u.id === msg.receiver_id)?.username || msg.receiver}</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{msg.subject || '(Sin asunto)'}</Typography>
                                <Typography variant="body1" sx={{ whiteSpace:'pre-wrap' }}>{msg.message}</Typography>
                                <Typography variant="caption" display="block">{new Date(msg.created_at).toLocaleString()}</Typography>
                                <Box sx={{ position:'absolute', top:4, right:4 }}>
                                    <Tooltip title="Eliminar">
                                        <IconButton size="small" onClick={() => deleteMessage(msg.id)}><Delete fontSize="inherit" /></IconButton>
                                    </Tooltip>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Paper>

            <Modal open={open} onClose={handleClose}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 420, bgcolor: 'background.paper', borderRadius:2, boxShadow: 24, p: 4 }}>
                    <Typography variant="h6" component="h2">Nuevo Mensaje</Typography>
                    <FormControl fullWidth sx={{ mt: 2 }} size="small">
                        <InputLabel>Para</InputLabel>
                        <Select
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                            label="Para"
                        >
                            {users.map(u => (
                                <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        multiline
                        rows={5}
                        label="Mensaje"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        sx={{ mt: 2 }}
                        size="small"
                    />
                    <TextField
                        fullWidth
                        label="Asunto"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        sx={{ mt: 2 }}
                        size="small"
                    />
                    <Box sx={{ display:'flex', justifyContent:'flex-end', mt:2, gap:1 }}>
                        <Button onClick={handleClose} disabled={sending}>Cancelar</Button>
                        <Button onClick={handleSendMessage} disabled={sending || !receiverId || !subject.trim() || !message.trim()} variant="contained">
                            {sending ? 'Enviando...' : 'Enviar'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default MessagesPage;
