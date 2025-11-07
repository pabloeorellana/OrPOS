import React from 'react';
import { Modal, Box, Typography, TextField, Button, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2
};

const PasswordChangeModal = ({ open, onClose, onSave, userName, requireCurrentPassword = false }) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = React.useState(false);

  const handleClickShowCurrentPassword = () => setShowCurrentPassword((show) => !show);
  const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
  const handleClickShowConfirmNewPassword = () => setShowConfirmNewPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  const newPassword = watch('newPassword');

  const onSubmit = (data) => {
    if (requireCurrentPassword) {
      onSave(data.currentPassword, data.newPassword);
    } else {
      onSave(data.newPassword);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6">Cambiar Contraseña {userName ? `para ${userName}` : ''}</Typography>
        
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {requireCurrentPassword && (
            <Controller
              name="currentPassword"
              control={control}
              rules={{ required: 'La contraseña actual es obligatoria' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Contraseña Actual"
                  type={showCurrentPassword ? 'text' : 'password'}
                  fullWidth
                  autoFocus
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowCurrentPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          )}
          <Controller
            name="newPassword"
            control={control}
            rules={{ required: 'La nueva contraseña es obligatoria', minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nueva Contraseña"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                {...(!requireCurrentPassword && { autoFocus: true })} // Auto-focus if current password is not required
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowNewPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="confirmNewPassword"
            control={control}
            rules={{
              required: 'Confirma la nueva contraseña',
              validate: value => value === newPassword || 'Las contraseñas no coinciden'
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Confirmar Nueva Contraseña"
                type={showConfirmNewPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.confirmNewPassword}
                helperText={errors.confirmNewPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmNewPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
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

export default PasswordChangeModal;
