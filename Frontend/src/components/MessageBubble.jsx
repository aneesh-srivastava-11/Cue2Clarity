import React from 'react';

const MessageBubble = ({ message, isUser, timestamp }) => {
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-in`}>
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={isUser ? 'message-user' : 'message-bot'}>
                    <p className="text-sm leading-relaxed">{message}</p>
                </div>
                {timestamp && (
                    <span className="text-xs text-gray-500 mt-1 px-2">
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
