import React from 'react';

const FeatureCard = ({ icon: Icon, title, description }) => {
    return (
        <div className="card card-hover group">
            <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                    <Icon size={32} className="text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default FeatureCard;
