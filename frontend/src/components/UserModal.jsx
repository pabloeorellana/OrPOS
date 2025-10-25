import React, { useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, FormHelperText } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};

const UserModal = ({ open, onClose, onSave, roles = [] }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: '',
      role_id: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        username: '',
        password: '',
        role_id: ''
      });
    }
  }, [open, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6">Nuevo Usuario</Typography>
        
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="username"
            control={control}
            rules={{ required: 'El nombre de usuario es obligatorio' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nombre de Usuario *"
                fullWidth
                autoFocus
                error={!!errors.username}
                helperText={errors.username?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            rules={{ required: 'La contraseña es obligatoria' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contraseña *"
                type="password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />
          <Controller
            name="role_id"
            control={control}
            rules={{ required: 'El rol es obligatorio' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.role_id}>
                <InputLabel id="role-select-label">Rol *</InputLabel>
                <Select
                  {...field}
                  labelId="role-select-label"
                  label="Rol *"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role_id && <FormHelperText>{errors.role_id.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserModal;