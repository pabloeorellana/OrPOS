import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Grid, MenuItem } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const UserModal = ({ open, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'empleado' });

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username, password: '', role: user.role });
    } else {
      setFormData({ username: '', password: '', role: 'empleado' });
    }
  }, [user, open]);

  const handleChange = (e) => {
    setFormData(prevState => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, user ? user.id : null);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField name="username" label="Nombre de Usuario" value={formData.username} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField name="password" label="Contraseña" type="password" value={formData.password} onChange={handleChange} fullWidth required={!user} helperText={user ? "Dejar en blanco para no cambiar" : ""} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="role" label="Rol" value={formData.role} onChange={handleChange} fullWidth select required>
              <MenuItem value="empleado">Empleado</MenuItem>
              <MenuItem value="propietario">Propietario</MenuItem>
              <MenuItem value="administrador">Administrador</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserModal;