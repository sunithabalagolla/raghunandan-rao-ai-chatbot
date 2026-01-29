import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { validateEmail } from '../utils/validation';
import { GoogleLogin } from '@react-oauth/google';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, error, clearError, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
 const [showPassword, setShowPassword] = useState(false);


const togglePassword = () => setShowPassword(prev => !prev);


  // Validate email on blur
  const handleEmailBlur = () => {
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setErrors((prev) => ({ ...prev, email: validation.error }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Clear errors when typing
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
    clearError();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    clearError();
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailValidation = validateEmail(email);
    const newErrors: { email?: string; password?: string } = {};

    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(email, password, rememberMe);
      navigate('/home');
    } catch (err) {
      // Error is handled by auth context
      console.error('Login failed:', err);
    }
  };

  // Handle Google Sign-In Success
  const handleGoogleSuccess = async (credentialResponse: any) => {
    // Prevent multiple simultaneous requests
    if (isLoading) return;

    try {
      clearError();

      // Validate credential exists
      const credential = credentialResponse.credential;
      if (!credential) {
        throw new Error('No credentials received from Google');
      }

      // Use AuthContext's loginWithGoogle method
      await loginWithGoogle(credential);

      // Navigate to home page
      navigate('/home');

    } catch (err: any) {
      // Provide more specific error messages
      if (err.response?.status === 401) {
        clearError();
        setTimeout(() => {
          if (error) clearError();
        }, 100);
        setErrors({ email: 'Google authentication failed. Please try again.' });
      } else if (err.response?.status === 403) {
        clearError();
        setTimeout(() => {
          if (error) clearError();
        }, 100);
        setErrors({ email: 'Account access denied. Please contact support.' });
      } else if (err.message?.includes('Network')) {
        clearError();
        setTimeout(() => {
          if (error) clearError();
        }, 100);
        setErrors({ email: 'Network error. Please check your connection.' });
      } else {
        clearError();
        setTimeout(() => {
          if (error) clearError();
        }, 100);
        setErrors({ email: err.message || 'Google sign-in failed. Please try again.' });
      }
      
      console.error('Google sign-in error:', err);
    }
  };

  // Handle Google Sign-In Error
  const handleGoogleError = (error?: any) => {
    console.error('Google sign-in error:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Google sign-in failed. Please try again.';
    
    if (error?.error === 'popup_closed_by_user') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (error?.error === 'access_denied') {
      errorMessage = 'Access was denied. Please grant necessary permissions.';
    } else if (error?.error === 'popup_blocked') {
      errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
    }
    
    clearError();
    setTimeout(() => {
      if (error) clearError();
    }, 100);
    setErrors({ email: errorMessage });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login to Your Account
          </h2>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">📘</span>
            Continue with Facebook (Coming Soon)
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">OR</span>
          </div>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} onClose={clearError} />}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            {/* Password Input */}
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              required
              showPasswordToggle={true}
              onTogglePassword={togglePassword}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" fullWidth isLoading={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          {/* Register Link */}
          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
