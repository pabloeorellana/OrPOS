import React, { useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, FormHelperText, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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

const UserModal = ({ open, onClose, onSave, roles = [], currentUser = null }) => {
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      role_id: ''
    }
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  useEffect(() => {
    if (open) {
      if (currentUser) {
        setValue('username', currentUser.username);
        setValue('role_id', currentUser.role_id);
        // No pre-rellenar la contraseña por seguridad
      } else {
        reset({
          username: '',
          password: '',
          confirmPassword: '',
          role_id: ''
        });
      }
    }
  }, [open, currentUser, reset, setValue]);

  const onSubmit = (data) => {
    onSave(data, currentUser ? currentUser.id : null);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6">{currentUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Typography>
        
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
                disabled={!!currentUser}
                error={!!errors.username}
                helperText={errors.username?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            rules={{ required: !currentUser, minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.password}
                helperText={errors.password ? errors.password.message : (currentUser ? 'Dejar en blanco para no cambiar' : '' )}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            rules={{ validate: (value, formValues) => value === formValues.password || 'Las contraseñas no coinciden' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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