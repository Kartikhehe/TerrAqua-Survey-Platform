import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Alert,
    Paper,
    useTheme,
    Link,
    CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ResetPasswordPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetToken, setResetToken] = useState('');

    useEffect(() => {
        // Get reset token from navigation state
        if (location.state?.resetToken) {
            setResetToken(location.state.resetToken);
        } else {
            // If no reset token, redirect to forgot password
            navigate('/forgot-password');
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await authAPI.resetPassword(resetToken, password);

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Reset failed' }));
                throw new Error(data.error || 'Failed to reset password');
            }

            // Show success and redirect to login
            alert('Password reset successfully! You can now login with your new password.');
            navigate('/login');

        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.default',
                p: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 5,
                    maxWidth: 480,
                    width: '100%',
                    borderRadius: '24px',
                    bgcolor: 'background.paper',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: theme.shadows[8],
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4,
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            boxShadow: `0 8px 20px rgba(8, 145, 178, 0.4)`,
                        }}
                    >
                        <CheckCircleIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            color: 'text.primary',
                            letterSpacing: '-0.5px',
                        }}
                    >
                        Reset Password
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: 'center',
                            color: 'text.secondary',
                            mt: 1,
                        }}
                    >
                        Enter your new password
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: '12px',
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Password Field */}
                    <Box sx={{ mb: 2.5 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                        >
                            New Password
                        </Typography>
                        <TextField
                            required
                            fullWidth
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <LockIcon
                                        sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }}
                                    />
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    bgcolor: 'background.elevation1',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        bgcolor: 'background.paper',
                                        boxShadow: `0 4px 12px rgba(8, 145, 178, 0.14)`,
                                    },
                                    '&.Mui-focused': {
                                        bgcolor: 'background.paper',
                                        boxShadow: `0 4px 12px rgba(8, 145, 178, 0.26)`,
                                    },
                                },
                            }}
                        />
                    </Box>

                    {/* Confirm Password Field */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                        >
                            Confirm Password
                        </Typography>
                        <TextField
                            required
                            fullWidth
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <LockIcon
                                        sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }}
                                    />
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    bgcolor: 'background.elevation1',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        bgcolor: 'background.paper',
                                        boxShadow: `0 4px 12px rgba(8, 145, 178, 0.14)`,
                                    },
                                    '&.Mui-focused': {
                                        bgcolor: 'background.paper',
                                        boxShadow: `0 4px 12px rgba(8, 145, 178, 0.26)`,
                                    },
                                },
                            }}
                        />
                    </Box>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            py: 1.8,
                            fontWeight: 700,
                            fontSize: 16,
                            borderRadius: '12px',
                            textTransform: 'none',
                            background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                            boxShadow: `0 8px 20px rgba(8, 145, 178, 0.59)`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 12px 30px rgba(8, 145, 178, 0.8)`,
                            },
                            '&:active': {
                                transform: 'translateY(0px)',
                            },
                            '&.Mui-disabled': {
                                background: theme.palette.action.disabledBackground,
                                color: theme.palette.action.disabled,
                            },
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                    </Button>
                </Box>

                {/* Back to Login Link */}
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography
                        sx={{
                            textAlign: 'center',
                            color: 'text.secondary',
                            fontSize: '0.95rem',
                        }}
                    >
                        Remember your password?{' '}
                        <Link
                            component="a"
                            href="/login"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}
                            sx={{
                                color: '#0891B2',
                                textDecoration: 'none',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    color: '#0E7490',
                                },
                            }}
                        >
                            Sign In
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
