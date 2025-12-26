import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import LockResetIcon from '@mui/icons-material/LockReset';
import EmailIcon from '@mui/icons-material/Email';

export default function ForgotPasswordPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);

        try {
            const res = await authAPI.forgotPassword(email);

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(data.error || 'Failed to send reset code');
            }

            const data = await res.json();

            // Navigate to verify OTP page
            navigate('/verify-reset-otp', {
                state: {
                    email,
                    consoleFallback: data.consoleFallback
                }
            });

        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err.message || 'An error occurred. Please try again.');
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
                        <LockResetIcon sx={{ fontSize: 32, color: 'white' }} />
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
                        Forgot Password?
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: 'center',
                            color: 'text.secondary',
                            mt: 1,
                        }}
                    >
                        Enter your email to receive a reset code
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

                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            borderRadius: '12px',
                        }}
                    >
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                        >
                            Email Address
                        </Typography>
                        <TextField
                            required
                            fullWidth
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <EmailIcon
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
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
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
