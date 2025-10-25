import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/axios';
import PlanModal from '../components/PlanModal';

const PlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState(null);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/plans');
            setPlans(response.data);
        } catch (error) {
            alert("No se pudieron cargar los planes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleOpenModal = (plan = null) => { setPlanToEdit(plan); setModalOpen(true); };
    const handleCloseModal = () => { setPlanToEdit(null); setModalOpen(false); };

    const handleSavePlan = async (formData, planId) => {
        try {
            if (planId) {
                await apiClient.put(`/plans/${planId}`, formData);
            } else {
                await apiClient.post('/plans', formData);
            }
            fetchPlans();
        } catch (error) {
            alert("Error al guardar el plan.");
        } finally {
            handleCloseModal();
        }
    };

    const handleDeletePlan = async (planId) => {
        if (window.confirm('¿Seguro que quieres eliminar este plan? Solo podrás hacerlo si ningún negocio lo está usando.')) {
            try {
                await apiClient.delete(`/plans/${planId}`);
                fetchPlans();
            } catch (error) {
                alert(error.response?.data?.message || "Error al eliminar el plan.");
            }
        }
    };

    const columns = [
        { field: 'name', headerName: 'Nombre del Plan', width: 200 },
        { field: 'price', headerName: 'Precio Mensual', width: 150, renderCell: (params) => `$${parseFloat(params.value).toFixed(2)}` },
        { field: 'max_users', headerName: 'Límite Usuarios', type: 'number', width: 150 },
        { field: 'max_products', headerName: 'Límite Productos', type: 'number', width: 150 },
        {
            field: 'actions',
            headerName: 'Acciones',
            sortable: false,
            width: 150,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenModal(params.row)} color="primary"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDeletePlan(params.row.id)} color="error"><DeleteIcon /></IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Planes de Suscripción</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    Nuevo Plan
                </Button>
            </Box>
            <Paper sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={plans}
                    columns={columns}
                    loading={loading}
                    components={{ Toolbar: GridToolbar }}
                />
            </Paper>
            <PlanModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSave={handleSavePlan}
                plan={planToEdit}
            />
        </Box>
    );
};

export default PlansPage;