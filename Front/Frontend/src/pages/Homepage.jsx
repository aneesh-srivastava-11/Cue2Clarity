import React, { Suspense } from 'react'; // <--- 1. Import Suspense
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import Button from '../components/Button';
import { Upload, History, Lock, Brain } from 'lucide-react';

// <--- 2. Lazy Import (Replaces the normal import)
const VantaBackground = React.lazy(() => import('../components/VantaBackground'));

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
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            
            {/* ✅ 3. BACKGROUND ANIMATION (Lazy Loaded) */}
            {/* We show a solid dark color while the heavy 3D engine loads */}
            <div className="fixed inset-0 -z-20 bg-[#0f1115]" />
            
            <Suspense fallback={null}>
                <VantaBackground />
            </Suspense>

            {/* Navbar sits on top */}
            <Navbar />

            {/* --- HERO SECTION --- */}
            <section className="flex-1 flex items-center justify-center px-4 pt-24 pb-16 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                    
                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                        Your Learning Companion,
                        <br />
                        <span className="text-emerald-400">Reimagined</span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                        Experience the future of conversational AI. Smart, intuitive, and designed to understand you better.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/30 transition-shadow"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-20 px-4 bg-black/20 backdrop-blur-sm border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-300">
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