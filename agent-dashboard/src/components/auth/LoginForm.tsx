import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginCredentials } from '../../types/auth.types';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dollsVisible, setDollsVisible] = useState([false, false, false, false]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Animate dolls entrance one by one
  useEffect(() => {
    const timers = [
      setTimeout(() => setDollsVisible(prev => [true, ...prev.slice(1)]), 200),
      setTimeout(() => setDollsVisible(prev => [prev[0], true, ...prev.slice(2)]), 400),
      setTimeout(() => setDollsVisible(prev => [...prev.slice(0, 2), true, prev[3]]), 600),
      setTimeout(() => setDollsVisible(prev => [...prev.slice(0, 3), true]), 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Show error animation
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data as LoginCredentials);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const getEyePosition = () => {
    if (isPasswordFocused) {
      return { x: -3, y: -1 }; // Look away and slightly up during password
    }
    if (isEmailFocused) {
      return { x: 4, y: 2 }; // Look more directly at email field
    }
    // Follow mouse with more natural movement
    const baseX = mousePosition.x / 45;
    const baseY = mousePosition.y / 45;
    return { 
      x: Math.max(-4, Math.min(4, baseX - 12)), 
      y: Math.max(-3, Math.min(3, baseY - 12)) 
    };
  };

  const getCharacterRotation = () => {
    if (isPasswordFocused) {
      return {
        transform: 'rotate(-15deg) scale(0.95)',
        transformOrigin: 'center bottom',
        transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
      };
    }
    if (isEmailFocused) {
      return {
        transform: 'rotate(8deg) scale(1.05)',
        transformOrigin: 'center bottom',
        transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
      };
    }
    return {
      transform: 'rotate(0deg) scale(1)',
      transformOrigin: 'center bottom',
      transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full flex items-center justify-center">
        {/* Left side - Animated Dolls */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative">
          <div className="relative w-[520px] h-[400px] flex items-center justify-center">
            
            {/* Purple Doll - Back Top (TALL TIN CAN SHAPE, HIGHER POSITION) */}
            <div className={`absolute top-2 left-16 transition-all duration-700 ease-out delay-200 ${dollsVisible[1] ? 'animate-gentle-bounce' : 'opacity-0 translate-y-10'} ${showError ? 'animate-shake' : ''}`}
                 style={getCharacterRotation()}>
              <div className="w-32 h-96 bg-purple-500 relative transition-all duration-700 ease-out character-breathing">
                <div className={`absolute top-24 left-8 w-4 h-4 bg-white rounded-full border border-gray-300 character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}>
                  <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out"
                       style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                </div>
                <div className={`absolute top-24 left-16 w-4 h-4 bg-white rounded-full border border-gray-300 character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}>
                  <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out"
                       style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                </div>
                <div className="absolute top-40 left-14 w-4 h-2 bg-white rounded-full"></div>
                {showError && <div className="absolute top-44 left-12 text-5xl animate-pulse">🙅‍♀️</div>}
              </div>
            </div>

            {/* Black Doll - Middle Bottom (MEDIUM HEIGHT, SAME BOTTOM LEVEL) */}
            <div className={`absolute bottom-0 left-40 transition-all duration-700 ease-out delay-400 ${dollsVisible[2] ? 'animate-gentle-bounce' : 'opacity-0 translate-y-10'} ${showError ? 'animate-shake' : ''}`}
                 style={getCharacterRotation()}>
              <div className="w-24 h-64 bg-gray-800 relative transition-all duration-700 ease-out character-breathing">
                <div className={`absolute top-20 left-6 w-4 h-4 bg-white rounded-full border border-gray-300 character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}>
                  <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out"
                       style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                </div>
                <div className={`absolute top-20 left-12 w-4 h-4 bg-white rounded-full border border-gray-300 character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}>
                  <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out"
                       style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                </div>
                <div className="absolute top-28 left-9 w-3 h-1 bg-white rounded-full"></div>
                {showError && <div className="absolute -top-6 left-6 text-5xl animate-spin">❌</div>}
              </div>
            </div>

            {/* Orange Doll - Bottom Left (PERFECT HALF-CIRCLE LIKE REFERENCE) */}
            <div className={`absolute bottom-0 left-6 transition-all duration-700 ease-out ${dollsVisible[0] ? 'animate-gentle-bounce' : 'opacity-0 translate-y-10'} ${showError ? 'animate-shake' : ''}`}
                 style={getCharacterRotation()}>
              <div className="w-48 h-24 bg-orange-500 rounded-t-full relative overflow-hidden transition-all duration-700 ease-out character-breathing">
                {/* Eyes - Simple black dots */}
                <div className={`absolute top-6 left-14 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}
                     style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                <div className={`absolute top-6 left-20 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}
                     style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                {/* Mouth - White oval */}
                <div className="absolute top-12 left-16 w-4 h-2 bg-white rounded-full"></div>
                {/* Cheeks - Simple orange dots */}
                <div className="absolute top-8 left-10 w-2 h-2 bg-orange-300 rounded-full"></div>
                <div className="absolute top-8 left-24 w-2 h-2 bg-orange-300 rounded-full"></div>
                {showError && <div className="absolute -top-8 left-16 text-5xl animate-bounce">😵</div>}
              </div>
            </div>

            {/* Yellow Doll - Bottom Right (SMALLER THAN BLACK, SAME BOTTOM LEVEL) */}
            <div className={`absolute bottom-0 left-56 transition-all duration-700 ease-out delay-600 ${dollsVisible[3] ? 'animate-gentle-bounce' : 'opacity-0 translate-y-10'} ${showError ? 'animate-shake' : ''}`}
                 style={getCharacterRotation()}>
              <div className="w-20 h-48 bg-yellow-400 rounded-t-3xl relative transition-all duration-700 ease-out character-breathing">
                <div className={`absolute top-16 left-6 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}
                     style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                <div className={`absolute top-16 left-12 w-2 h-2 bg-black rounded-full transition-transform duration-300 ease-out character-eyes ${isEmailFocused ? 'character-eyes-focused' : isPasswordFocused ? 'character-eyes-shy' : ''}`}
                     style={{ transform: `translate(${getEyePosition().x}px, ${getEyePosition().y}px)` }}></div>
                <div className="absolute top-20 left-8 w-4 h-2 bg-white rounded-full"></div>
                {showError && <div className="absolute -top-8 left-6 text-5xl animate-pulse">🚫</div>}
              </div>
            </div>

          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-50 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Agent Login
              </h2>
              <p className="text-gray-500 text-sm">
                Welcome back! The dolls are watching 👀
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-shake">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg animate-bounce">🙅‍♀️</span>
                    <span className="font-medium">No no!</span>
                    <span className="ml-2">{error}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your email"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your password"
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span>Sign In</span>
                      <span className="ml-2">🚀</span>
                    </span>
                  )}
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center py-3.5 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="text-center text-sm text-gray-500 pt-4">
                Don't have an account? 
                <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 ml-1 transition-colors">
                  Contact Admin
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};