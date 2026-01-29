import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { OTPInput } from '../components/OTPInput';
import { validateEmail, validateName, validatePhone, validatePassword, validatePasswordMatch } from '../utils/validation';
import AuthService from '../services/authService';
import * as storage from '../utils/storage';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';

type Step = 'form' | 'otp' | 'password';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, setAuthUser } = useAuth();

  // Current step
  const [step, setStep] = useState<Step>('form');

  // Form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  // const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // const [otpExpiryTime, setOtpExpiryTime] = useState(300); // 5 minutes in seconds

  // Clear error
  const clearError = () => setError(null);

  const togglePassword = () => {
    console.log('togglePassword called, current showPassword:', showPassword);
    setShowPassword(prev => !prev);
  };
  
  const toggleConfirmPassword = () => {
    console.log('toggleConfirmPassword called, current showConfirmPassword:', showConfirmPassword);
    setShowConfirmPassword(prev => !prev);
  };

  console.log('RegisterPage render - showPassword:', showPassword, 'showConfirmPassword:', showConfirmPassword);


  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  // Step 1: Handle form submission
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate all fields
    const newErrors: Record<string, string> = {};

    const firstNameValidation = validateName(firstName, 'First name');
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.error!;

    const lastNameValidation = validateName(lastName, 'Last name');
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error!;

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error!;

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.error!;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.registerEmail({
        firstName,
        lastName,
        email,
        phoneNumber: phone || undefined,
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP verification
  const handleOTPComplete = async (otpValue: string) => {

    try {
      setIsLoading(true);
      clearError();
      await AuthService.validateOTP(email, otpValue)

      setOtp(otpValue);
      console.log('success otp');
      setStep('password');

    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    try {
      setIsLoading(true);
      clearError();
      await AuthService.resendOTP(email);
      setResendCooldown(30);
      // Show success message (you can add a success state if needed)
      console.log('OTP resent successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Handle password creation
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate password
    const newErrors: Record<string, string> = {};

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error!;

    const matchValidation = validatePasswordMatch(password, confirmPassword);
    if (!matchValidation.isValid) newErrors.confirmPassword = matchValidation.error!;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await AuthService.verifyOTP({
        email,
        otp,
        password,
        firstName,
        lastName,
        phoneNumber: phone || undefined,
      });

      // Store tokens and user data
      storage.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        storage.setRefreshToken(response.refreshToken);
      }
      storage.setUser(response.user);

      // Update AuthContext to mark user as authenticated
      setAuthUser(response.user);

      // Redirect to home page
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };


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

      // Use AuthContext's loginWithGoogle method (handles both signup and login)
      await loginWithGoogle(credential);

      // Navigate to home page
      navigate('/home');

    } catch (err: any) {
      // Provide more specific error messages
      if (err.response?.status === 401) {
        setError('Google authentication failed. Please try again.');
      } else if (err.response?.status === 403) {
        setError('Account access denied. Please contact support.');
      } else if (err.message?.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }

      console.error('Google sign-in error:', err);
    }
  };


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

    setError(errorMessage);
    setIsLoading(false);
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step {step === 'form' ? '1' : step === 'otp' ? '2' : '3'} of 3
          </p>
        </div>

        {/* Step 1: Registration Form */}
        {step === 'form' && (
          <>
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

            {error && <ErrorMessage message={error} onClose={clearError} />}

            <form className="mt-8 space-y-4" onSubmit={handleFormSubmit}>
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setErrors((prev) => ({ ...prev, firstName: '' }));
                }}
                error={errors.firstName}
                required
              />

              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setErrors((prev) => ({ ...prev, lastName: '' }));
                }}
                error={errors.lastName}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: '' }));
                }}
                error={errors.email}
                required
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                error={errors.phone}
                placeholder="+1234567890"
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Continue
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Login
                </Link>
              </div>
            </form>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600">
                We've sent a verification code to
              </p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>

            {error && <ErrorMessage message={error} onClose={clearError} />}

            <div className="flex justify-center">
              <OTPInput onComplete={handleOTPComplete} error={errors.otp} />
            </div>
            <div className="text-center text-sm space-y-2">
              <div>
                <span className="text-gray-600">Didn't receive the code? </span>
                <button
                  type="button"
                  className={`font-medium ${resendCooldown > 0 || isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-500'
                    }`}
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  {resendCooldown > 0
                    ? `Resend OTP (${resendCooldown}s)`
                    : 'Resend OTP'}
                </button>
              </div>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500"
                onClick={() => setStep('form')}
              >
                ← Back to form
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Password Creation */}
        {step === 'password' && (
          <>
            <div className="text-center">
              <p className="text-gray-600">Create a secure password</p>
            </div>

            {error && <ErrorMessage message={error} onClose={clearError} />}

            <form className="mt-8 space-y-4" onSubmit={handlePasswordSubmit}>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
                error={errors.password}
                required
                showPasswordToggle={true}
                onTogglePassword={togglePassword}
              />

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                error={errors.confirmPassword}
                required
                showPasswordToggle={true}
                onTogglePassword={toggleConfirmPassword}

              />

              <div className="text-xs text-gray-600 space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading}>
                Create Account
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
