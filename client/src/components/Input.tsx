import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}

export const Input = ({
  label,
  error,
  fullWidth = true,
  className = '',
  showPasswordToggle,
  onTogglePassword,
  type,
  ...props
}: InputProps) => {
  const baseStyles = 'px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const errorStyles = error ? 'border-red-500' : 'border-gray-300';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className='relative'>
        <input
          type={type}
          className={`${baseStyles} ${errorStyles} ${widthStyles} ${showPasswordToggle ? 'pr-10' : ''} ${className}`}
          {...props}
        />

        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            {type === 'password' ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        )}

      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};