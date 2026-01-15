import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const { signup, loginAnonymously } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setAuthError('');
    };

    const validatePassword = (password) => {
        // OWASP: Password Complexity
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain uppercase letter";
        if (!/[a-z]/.test(password)) return "Password must contain lowercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain number";
        if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain special character";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

        if (!formData.password) newErrors.password = 'Password is required';
        else {
            const passwordError = validatePassword(formData.password);
            if (passwordError) newErrors.password = passwordError;
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            await signup(formData.email, formData.password, formData.name);
            navigate('/chat');
        } catch (error) {
            console.error('Registration error:', error);
            setAuthError('Failed to create account. Email may already be in use.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        try {
            setLoading(true);
            await loginAnonymously();
            navigate('/chat');
        } catch (error) {
            console.error('Guest Login Error:', error);
            setAuthError('Failed to continue as guest. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-md animate-fade-in">
                <div className="card">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-black font-bold text-3xl">C</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-gray-400">Join Cue2Clarity today</p>
                    </div>

                    {authError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            type="text"
                            name="name"
                            label="Full Name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            disabled={loading}
                        />

                        <Input
                            type="email"
                            name="email"
                            label="Email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            disabled={loading}
                        />

                        <Input
                            type="password"
                            name="password"
                            label="Password"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            disabled={loading}
                        />
                        {/* OWASP: Password strength hints could be added here visually */}

                        <Input
                            type="password"
                            name="confirmPassword"
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            disabled={loading}
                        />

                        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#1a1a2e] px-2 text-gray-500">Or continue without account</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleGuestLogin}
                            type="button"
                            variant="ghost"
                            className="w-full border border-border text-gray-400 hover:text-white"
                            disabled={loading}
                        >
                            Skip for now (Guest)
                        </Button>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
