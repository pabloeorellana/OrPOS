import { TextField, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Campo de texto personalizado con bordes redondeados
export const CustomTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px', // Bordes más redondeados como en tu ejemplo
  },
  marginBottom: '16px', // Espacio uniforme debajo de cada campo
});

// Botón principal personalizado
export const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '10px 20px',
  backgroundColor: '#009688', // Un tono verde azulado similar a tu ejemplo
  color: 'white',
  '&:hover': {
    backgroundColor: '#00796b',
  },
}));

// Botón secundario (Cancelar)
export const SecondaryButton = styled(Button)({
  color: '#666',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline',
  },
});

// Estilo base para el contenedor del modal
export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  borderRadius: '16px', // Bordes del modal más redondeados
  boxShadow: 24,
  p: 4,
  outline: 'none', // Quita el borde azul de enfoque
};