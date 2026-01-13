import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import Button from '../components/Button';
import {
    Send,
    MessageSquare,
    Paperclip,
    Plus,
    Settings,
    Menu,
    X,
    Trash2,
    Download,
    LogOut,
    ChevronDown,
    BookOpen,
    GraduationCap,
    BarChart,
    FileText
} from 'lucide-react';

const ChatInterface = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Happy to help you!', isUser: false, timestamp: '10:30 AM' },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [chatHistory, setChatHistory] = useState([
        { id: 1, title: 'Getting Started', preview: 'Happy to help you!', active: true },
        { id: 2, title: 'Project Planning', preview: 'Can you help me with...', active: false },
        { id: 3, title: 'Code Review', preview: 'I need assistance reviewing...', active: false },
    ]);
    const [selectedMode, setSelectedMode] = useState('Lectures');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const modes = [
        { id: 'Lectures', icon: BookOpen, label: 'Lectures' },
        { id: 'Exam', icon: GraduationCap, label: 'Exam' },
        { id: 'Difficulty', icon: BarChart, label: 'Difficulty' },
        { id: 'Assignment', icon: FileText, label: 'Assignment' },
    ];

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = () => {
        if (!inputValue.trim() && !uploadedFile) return;

        const newMessage = {
            id: messages.length + 1,
            text: inputValue,
            isUser: true,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setUploadedFile(null);

        // Simulate bot response
        setIsTyping(true);
        setTimeout(() => {
            const botResponse = {
                id: messages.length + 2,
                text: 'I understand your question. Let me help you with that. This is a UI mockup, so I can\'t provide real responses yet, but the interface is ready for integration!',
                isUser: false,
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 2000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleNewChat = () => {
        setMessages([
            { id: 1, text: 'Happy to help you!', isUser: false, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
        ]);
        setChatHistory(prev => prev.map(chat => ({ ...chat, active: false })));
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-0'
                    } bg-card border-r border-border transition-all duration-300 flex flex-col overflow-hidden`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-black font-bold text-lg">C</span>
                            </div>
                            <span className="text-white font-semibold">Cue2Clarity</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full"
                        icon={Plus}
                        onClick={handleNewChat}
                    >
                        New Chat
                    </Button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {chatHistory.map((chat) => (
                        <div
                            key={chat.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${chat.active
                                ? 'bg-white/10 border border-white/20'
                                : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <h4 className="text-white text-sm font-medium mb-1 truncate">
                                {chat.title}
                            </h4>
                            <p className="text-gray-500 text-xs truncate">{chat.preview}</p>
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                    >
                        <LogOut size={18} />
                        <span className="text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                {/* Chat Header */}
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4">
                    <div className="flex items-center space-x-3">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center space-x-2 text-white font-semibold hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                            >
                                <span>{selectedMode}</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl py-1 z-50">
                                    {modes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setSelectedMode(mode.id);
                                                setDropdownOpen(false);
                                                // Optional: Send a system message indicating mode switch
                                                setMessages(prev => [...prev, {
                                                    id: prev.length + 1,
                                                    text: `Switched to ${mode.label} mode.`,
                                                    isUser: false,
                                                    isSystem: true,
                                                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                                }]);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center space-x-3 transition-colors ${selectedMode === mode.id ? 'text-white bg-white/5' : 'text-gray-400'
                                                }`}
                                        >
                                            <mode.icon size={16} />
                                            <span>{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleClearChat}
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                            title="Clear chat"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                            title="Download chat"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Messages Area */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="max-w-4xl mx-auto">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                                        <MessageSquare size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white">Start a conversation</h3>
                                    <p className="text-gray-400">Ask me anything or upload a file to get started</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => (
                                    <MessageBubble key={message.id} {...message} />
                                ))}
                                {isTyping && <TypingIndicator />}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                </div>

                {/* Input Section */}
                <div className="border-t border-border bg-card p-4">
                    <div className="max-w-4xl mx-auto">
                        {/* File Upload Preview */}
                        {uploadedFile && (
                            <div className="mb-3 flex items-center justify-between bg-white/5 border border-border rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                    <Paperclip size={16} className="text-gray-400" />
                                    <span className="text-sm text-white">{uploadedFile.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(uploadedFile.size / 1024).toFixed(2)} KB)
                                    </span>
                                </div>
                                <button
                                    onClick={() => setUploadedFile(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Input Box */}
                        <div className="flex items-end space-x-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                                title="Upload file"
                            >
                                <Paperclip size={20} />
                            </button>

                            <div className="flex-1 relative">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    rows={1}
                                    className="w-full bg-input-bg text-white px-4 py-3 pr-12 rounded-button border border-input-border focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 placeholder:text-gray-500 resize-none"
                                    style={{ minHeight: '48px', maxHeight: '120px' }}
                                />
                            </div>

                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() && !uploadedFile}
                                className="p-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                title="Send message"
                            >
                                <Send size={20} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-3">
                            Press Enter to send, Shift + Enter for new line
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatInterface;
