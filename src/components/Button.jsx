import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    onClick,
    className = '',
    icon: Icon,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {Icon && <Icon size={20} />}
            {children}
        </button>
    );
};

export default Button;
