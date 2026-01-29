import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import AuthService from '../services/authService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { validatePassword, validatePasswordMatch } from "../utils/validation";




export const ForgotPasswordPage = () => {
    const [stage, setStage] = useState<'email' | 'otp' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const[showConfirmPassword,setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();


    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1)
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown])


    const handleSendOTP = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await AuthService.requestPasswordReset(email);
            console.log('otp sent successfully:', response);
            setStage('otp');
        } catch (err: any) {
            console.error('❌ Error sending OTP:', err);
            setError(err.message || 'Failed to send otp.plz try again.');

        } finally {
            setLoading(false);
        }
    };


    //verify otp fn
    const handleVerifyOTP = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await AuthService.validateOTP(email, otp);
            console.log('✅ OTP verified successfully');
            setStage('password');

        } catch (err: any) {
            console.error('❌ Error verifying OTP:', err);
            setError(err.message || 'Invalid OTP. Please try again.');

        } finally {
            setLoading(false);
        }

    }


    //resend otp fn
    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await AuthService.resendOTP(email);
            console.log('✅ OTP resent successfully');
            setResendCooldown(30);
            setOtp('');
        } catch (err: any) {
            console.error('❌ Error resending OTP:', err);
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }

    }

    //reset password fn
    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        //use validation utilties
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.error!);
            return;
        }

        const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
        if (!matchValidation.isValid) {
            setError(matchValidation.error!);
            return;
        }
        setLoading(true);

        try {
            await AuthService.resetPassword({
                email,
                otp,
                newPassword
            });
            console.log('✅ Password reset successful');
            alert('Password reset successful!')
            setTimeout(() => {
                navigate('/login');
            }, 1000);


        } catch (err: any) {
            console.error('❌ Error resetting password:', err);
            setError(err.message || 'Failed to reset password. Please try again.');

        } finally {
            setLoading(false);
        }



    }



    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your registered email address and we'll send you an OTP to reset your password.
                    </p>
                </div>

                {/* Email Form */}
                {stage === 'email' && (
                    <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
                        <div className="space-y-4">
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                error={error}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Your Email"
                                required
                            />
                        </div>
                        {/* Send OTP Button */}
                        <Button type="submit" fullWidth isLoading={loading}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </Button>

                        {/* Back to Login Link */}
                        <div className="text-center text-sm">
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                ← Back to Login
                            </Link>
                        </div>

                    </form>
                )}
                {/* OTP Form */}
                {stage === 'otp' && (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
                        <div>
                            <h2 className="text-center text-2xl font-bold text-gray-900">
                                Verify OTP
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                We've sent a 6-digit OTP to {email}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="enter OTP"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit OTP"
                                error={error}
                                required
                            />

                            {/* Better resend display */}
                            <div className="text-center text-sm">
                                {resendCooldown > 0 ? (
                                    <p className="text-gray-600">
                                        Resend OTP in {resendCooldown}s
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Didn't receive? Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>


                        <Button type='submit' fullWidth isLoading={loading} disabled={otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                        <div className="text-center text-sm">
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                )}

//password form
                {stage === 'password' && (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div>
                            <h2 className="text-center text-2xl font-bold text-gray-900">
                                Reset Password
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Create a new password for your account
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* New Password Input */}
                            <Input
                                label="New Password"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                error={error}
                                required
                                showPasswordToggle={true}
                                onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                            />

                            {/* Confirm Password Input */}
                            <Input
                                label="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                showPasswordToggle={true}
                                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                            />

                            {/* Password Requirements */}
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-medium">Password Requirements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                                        At least 8 characters
                                    </li>
                                    <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                                        One uppercase letter
                                    </li>
                                    <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                                        One number
                                    </li>
                                    <li className={/[!@#$%^&*]/.test(newPassword) ? 'text-green-600' : ''}>
                                        One special character (!@#$%^&*)
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            isLoading={loading}
                            disabled={!newPassword || !confirmPassword}
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                    </form>
                )}

            </div>
        </div>
    )
}


