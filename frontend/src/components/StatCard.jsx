import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const StatCard = ({ title, value, icon: Icon, color = 'primary.main' }) => {
    return (
        <Paper elevation={2} sx={{ display: 'flex', alignItems: 'center', p: 2.5, borderRadius: 2 }}>
            <Box sx={{ flexGrow: 1, mr: 3 }}>
                <Typography color="text.secondary">{title}</Typography>
                <Typography variant="h5" fontWeight="600">{value}</Typography>
            </Box>
            <Box
                sx={{
                    width: 56, height: 56, borderRadius: '50%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    bgcolor: color, color: '#fff',
                }}
            >
                <Icon sx={{ fontSize: 28 }} />
            </Box>
        </Paper>
    );
};

export default StatCard;