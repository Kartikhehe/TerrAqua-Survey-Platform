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
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PinIcon from '@mui/icons-material/Pin';

export default function VerifyResetOTPPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [email, setEmail] = useState('');

    const [consoleFallback, setConsoleFallback] = useState(location.state?.consoleFallback || false);

    useEffect(() => {
        // Get email and fallback status from navigation state
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            // If no email in state, redirect to forgot password
            navigate('/forgot-password');
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!otp) {
            setError('Please enter the OTP code');
            return;
        }

        if (otp.length !== 6) {
            setError('OTP must be 6 digits');
            return;
        }

        setLoading(true);

        try {
            const res = await authAPI.verifyResetOtp(email, otp);

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Verification failed' }));
                throw new Error(data.error || 'Invalid OTP');
            }

            const data = await res.json();

            // Navigate to reset password page with reset token
            navigate('/reset-password', {
                state: {
                    resetToken: data.resetToken,
                    email
                }
            });

        } catch (err) {
            console.error('Verify OTP error:', err);
            setError(err.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setResending(true);

        try {
            const res = await authAPI.forgotPassword(email);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || 'Failed to resend OTP');
            }

            if (data.consoleFallback !== undefined) {
                setConsoleFallback(data.consoleFallback);
            }

            alert(data.message || 'A new OTP has been sent to your email');

        } catch (err) {
            console.error('Resend OTP error:', err);
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
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
                        <VerifiedUserIcon sx={{ fontSize: 32, color: 'white' }} />
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
                        Verify OTP
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: 'center',
                            color: 'text.secondary',
                            mt: 1,
                        }}
                    >
                        Enter the 6-digit code sent to
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: 'center',
                            color: 'primary.main',
                            fontWeight: 600,
                        }}
                    >
                        {email}
                    </Typography>
                </Box>

                {consoleFallback && (
                    <Alert
                        severity="info"
                        sx={{
                            mb: 3,
                            borderRadius: "12px",
                            "& .MuiAlert-icon": {
                                fontSize: "24px",
                            },
                        }}
                    >
                        <strong>Development Mode:</strong> The email service is not configured.
                        Please check the server console/logs for your password reset code.
                    </Alert>
                )}

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
                    {/* OTP Field */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                        >
                            OTP Code
                        </Typography>
                        <TextField
                            required
                            fullWidth
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(value);
                            }}
                            disabled={loading}
                            inputProps={{
                                maxLength: 6,
                                pattern: '[0-9]*',
                                inputMode: 'numeric',
                            }}
                            InputProps={{
                                startAdornment: (
                                    <PinIcon
                                        sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }}
                                    />
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    bgcolor: 'background.elevation1',
                                    fontSize: '1.5rem',
                                    letterSpacing: '0.5rem',
                                    textAlign: 'center',
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
                        disabled={loading || otp.length !== 6}
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
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                    </Button>

                    {/* Resend OTP */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', mb: 1 }}
                        >
                            Didn't receive the code?
                        </Typography>
                        <Button
                            onClick={handleResendOTP}
                            disabled={resending}
                            sx={{
                                color: '#0891B2',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    bgcolor: 'rgba(8, 145, 178, 0.08)',
                                },
                            }}
                        >
                            {resending ? 'Sending...' : 'Resend OTP'}
                        </Button>
                    </Box>
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
