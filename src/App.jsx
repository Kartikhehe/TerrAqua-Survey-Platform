import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import VerifyOTPPage from './pages/VerifyOTP';
import ForgotPasswordPage from './pages/ForgotPassword';
import VerifyResetOTPPage from './pages/VerifyResetOTP';
import ResetPasswordPage from './pages/ResetPassword';
import MapApp from './pages/MapApp';
import UserGuide from './pages/UserGuide';
import { Box, CircularProgress } from '@mui/material';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/verify-otp"
        element={isAuthenticated ? <Navigate to="/" replace /> : <VerifyOTPPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/verify-reset-otp"
        element={isAuthenticated ? <Navigate to="/" replace /> : <VerifyResetOTPPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />}
      />
      <Route
        path="/"
        element={<MapApp />}
      />
      <Route
        path="/guide"
        element={<UserGuide />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
