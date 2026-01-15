import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { Github, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, googleSignIn, loginAnonymously } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
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
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setAuthError('');
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await googleSignIn();
            navigate('/chat');
        } catch (error) {
            console.error('Google Sign In Error:', error);
            setAuthError('Failed to sign in with Google');
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple validation
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }

        // OWASP: Regular expressions for email validation
        // Using a basic one here, but can be more strict if needed.
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            await login(formData.email, formData.password);
            navigate('/chat');
        } catch (error) {
            console.error('Login error:', error);
            // OWASP: Do not fail exactly with "User not found" to prevent enumeration.
            // Use generic messages.
            setAuthError('Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-md animate-fade-in">
                {/* Login Card */}
                <div className="card">
                    {/* Logo/App Name */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-black font-bold text-3xl">C</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-400">Sign in to continue to Cue2Clarity</p>
                    </div>

                    {/* Login Form */}
                    {authError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            disabled={loading}
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" className="mr-2 rounded" />
                                Remember me
                            </label>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-card text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="ghost" className="w-full border border-border">
                            <Github size={20} />
                            GitHub
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full border border-border"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <Mail size={20} />
                            Google
                        </Button>
                    </div>

                    <div className="mt-4">
                        <Button
                            onClick={handleGuestLogin}
                            variant="ghost"
                            className="w-full border border-border text-gray-400 hover:text-white"
                            disabled={loading}
                        >
                            Skip for now (Guest)
                        </Button>
                    </div>

                    {/* Create Account */}
                    <p className="text-center text-gray-400 text-sm mt-8">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-white hover:underline">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
