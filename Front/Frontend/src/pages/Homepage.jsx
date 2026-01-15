import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import Button from '../components/Button';
import { Upload, History, Lock, Brain } from 'lucide-react';

const Homepage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Brain,
            title: 'RAG-Powered Accuracy',
            description: 'Unlike common AI chatbots, we use Retrieval-Augmented Generation (RAG) to provide fact-based responses with significantly fewer hallucinations.',
        },
        {
            icon: Upload,
            title: 'File Upload',
            description: 'Upload and analyze documents, images, and files with intelligent processing capabilities.',
        },
        {
            icon: History,
            title: 'Chat History',
            description: 'Access your previous conversations anytime with our secure cloud-based storage system.',
        },
        {
            icon: Lock,
            title: 'Secure Login',
            description: 'Your data is protected with enterprise-grade security and end-to-end encryption.',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
                <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                        Your Learning Companion,
                        <br />
                        <span className="text-gradient">Reimagined</span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Experience the future of conversational AI. Smart, intuitive, and designed to understand you better.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 bg-card/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-400">
                            Everything you need for intelligent conversations
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <FeatureCard {...feature} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Homepage;
