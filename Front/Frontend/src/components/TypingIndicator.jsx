import React from 'react';

const TypingIndicator = () => {
    return (
        <div className="flex justify-start mb-4">
            <div className="message-bot">
                <div className="flex items-center space-x-2">
                    <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                    <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                    <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;
