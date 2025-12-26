import React, { useState, useEffect } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    Paper,
    useTheme,
    Link,
    CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";

export default function VerifyOTPPage() {
    const theme = useTheme();
    const { login, isAuthenticated } = useAuth();
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from navigation state
    const email = location.state?.email || "";

    useEffect(() => {
        if (isAuthenticated) navigate("/");
        if (!email) navigate("/signup");
    }, [isAuthenticated, email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.verifyOtp(email, otp);

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Verification failed' }));
                throw new Error(data.error || "Verification failed");
            }

            const data = await res.json();

            // Update AuthProvider state
            if (data.user) {
                login(data.user);
            }

            setSuccess("Email verified successfully! Redirecting...");
            setTimeout(() => navigate("/"), 1500);
        } catch (err) {
            console.error('Verify OTP error:', err);
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setSuccess("");
        setResending(true);

        try {
            const res = await authAPI.resendOtp(email);

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Failed to resend OTP' }));
                throw new Error(data.error || "Failed to resend OTP");
            }

            setSuccess("New OTP sent to your email!");
        } catch (err) {
            console.error('Resend OTP error:', err);
            setError(err.message || "Failed to resend OTP. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                maxWidth: "100vw",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: 'background.default',
                position: "relative",
                p: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 5,
                    maxWidth: 480,
                    width: "100%",
                    borderRadius: "24px",
                    bgcolor: 'background.paper',
                    backdropFilter: "blur(10px)",
                    border: "1px solid",
                    borderColor: 'divider',
                    boxShadow: theme.shadows[8],
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Header with Icon */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mb: 4,
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "16px",
                            background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 2,
                            boxShadow: `0 8px 20px rgba(8, 145, 178, 0.4)`,
                        }}
                    >
                        <VerifiedUserIcon sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            textAlign: "center",
                            color: "text.primary",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Verify Your Email
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            textAlign: "center",
                            color: "text.secondary",
                            mt: 1,
                        }}
                    >
                        We've sent a 6-digit code to <strong>{email}</strong>
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: "12px",
                            "& .MuiAlert-icon": {
                                fontSize: "24px",
                            },
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
                            borderRadius: "12px",
                            "& .MuiAlert-icon": {
                                fontSize: "24px",
                            },
                        }}
                    >
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* OTP Field */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
                        >
                            Enter OTP Code
                        </Typography>
                        <TextField
                            required
                            fullWidth
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(value);
                            }}
                            inputProps={{
                                maxLength: 6,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '24px',
                                    letterSpacing: '8px',
                                    fontWeight: 600
                                }
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    bgcolor: 'background.elevation1',
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        bgcolor: 'background.paper',
                                        boxShadow: `0 4px 12px rgba(8, 145, 178, 0.14)`,
                                    },
                                    "&.Mui-focused": {
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
                            borderRadius: "12px",
                            textTransform: "none",
                            background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                            boxShadow: `0 8px 20px rgba(8, 145, 178, 0.59)`,
                            transition: "all 0.3s ease",
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background:
                                    "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                                transition: "left 0.5s ease",
                            },
                            "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: `0 12px 30px rgba(8, 145, 178, 0.8)`,
                                "&::before": {
                                    left: "100%",
                                },
                            },
                            "&:active": {
                                transform: "translateY(0px)",
                            },
                            "&:disabled": {
                                background: "rgba(0, 0, 0, 0.12)",
                                boxShadow: "none",
                            },
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Email"}
                    </Button>
                </Box>

                {/* Resend OTP */}
                <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: 'divider', textAlign: 'center' }}>
                    <Typography
                        sx={{
                            color: "text.secondary",
                            fontSize: "0.95rem",
                            mb: 1,
                        }}
                    >
                        Didn't receive the code?
                    </Typography>
                    <Button
                        onClick={handleResend}
                        disabled={resending}
                        sx={{
                            color: "#0891B2",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                                bgcolor: "rgba(8, 145, 178, 0.08)",
                            },
                        }}
                    >
                        {resending ? <CircularProgress size={20} /> : "Resend OTP"}
                    </Button>
                </Box>

                {/* Back to Signup */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Link
                        component="button"
                        type="button"
                        onClick={() => navigate('/signup')}
                        sx={{
                            color: "text.secondary",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            "&:hover": {
                                color: "#0891B2",
                            },
                        }}
                    >
                        ← Back to Signup
                    </Link>
                </Box>
            </Paper>
        </Box>
    );
}
