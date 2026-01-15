import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    error,
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`input-field ${isPassword ? 'pr-12' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
};

export default Input;
