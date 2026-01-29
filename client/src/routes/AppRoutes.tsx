import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HomePage } from '../pages/HomePage';
import { FeedbackPage } from '../pages/FeedbackPage';
// import { ProtectedRoute } from './ProtectedRoute';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Feedback Route - Public (No Login Required) */}
      <Route path="/feedback/:ticketId" element={<FeedbackPage />} />
      
      {/* Home Page - Public (No Login Required) */}
      <Route path="/" element={<HomePage />} />
      
      {/* Also support /home route */}
      <Route path="/home" element={<HomePage />} />

      {/* Catch all - redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
