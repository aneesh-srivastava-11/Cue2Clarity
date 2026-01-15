import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth"; 
import { auth } from "../config/firebase";
// import MessageBubble from '../components/MessageBubble'; // Ensure you have this or use inline
// import TypingIndicator from '../components/TypingIndicator'; // Ensure you have this or use inline
// import Button from '../components/Button'; // Ensure you have this

import {
    Send, MessageSquare, Paperclip, Plus, Settings, Menu, X, Trash2, Download, LogOut, ChevronDown,
    BookOpen, GraduationCap, BarChart, FileText
} from 'lucide-react';

// --- INLINE COMPONENTS (If you don't have them separately, keep them here) ---
const MessageBubble = ({ text, isUser, sources }) => (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[75%] p-4 rounded-2xl ${isUser ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
            <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
            {/* RENDER SOURCES IF AVAILABLE */}
            {sources && sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">📚 Sources</p>
                    <ul className="space-y-1">
                        {sources.map((src, idx) => (
                            <li key={idx}>
                                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline flex items-center gap-2">
                                    <FileText size={14} /> {src.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </div>
);

const TypingIndicator = () => (
    <div className="flex justify-start mb-4 animate-pulse">
        <div className="bg-white/10 p-4 rounded-2xl text-gray-400 text-sm">Thinking...</div>
    </div>
);

// --- MAIN COMPONENT ---
const ChatInterface = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // 1. STATE: Start with a welcome message
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hello! I am connected to your lecture notes. What would you like to review?', isUser: false, timestamp: new Date().toLocaleTimeString() },
    ]);
    
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false); // Controls the "Thinking..." bubble
    const [uploadedFile, setUploadedFile] = useState(null);
    const [chatHistory, setChatHistory] = useState([
        { id: 1, title: 'Current Session', preview: 'Active chat...', active: true },
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

    // --- 2. LOGIC: THE BACKEND CONNECTION ---
    const handleSendMessage = async () => {
        if (!inputValue.trim() && !uploadedFile) return;

        const currentText = inputValue;
        
        // A. Add User Message to UI immediately
        const newMessage = {
            id: messages.length + 1,
            text: currentText,
            isUser: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setUploadedFile(null);
        setIsTyping(true); // Show loading state

        try {
            // B. Send to FastAPI Backend
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: currentText }),
            });

            if (!response.ok) throw new Error("Backend failed");

            const data = await response.json();

            // C. Add AI Response to UI
            const botResponse = {
                id: messages.length + 2,
                text: data.answer,        // The text from Gemini
                sources: data.sources,    // The PDF links from Pinecone/Supabase
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, botResponse]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = {
                id: messages.length + 2,
                text: "⚠️ I couldn't reach the brain. Is your Python backend running?",
                isUser: false,
                timestamp: new Date().toLocaleTimeString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false); // Hide loading state
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // --- LOGIC: Logout ---
    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) setUploadedFile(file);
    };

    const handleDragOver = (e) => e.preventDefault();
    
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setUploadedFile(file);
    };

    const handleNewChat = () => {
        setMessages([{ id: 1, text: 'Fresh start! Ask me anything.', isUser: false, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleClearChat = () => setMessages([]);

    return (
        <div className="h-screen flex bg-[#0f1115] overflow-hidden text-white font-sans">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#161b22] border-r border-gray-800 transition-all duration-300 flex flex-col overflow-hidden`}>
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-black font-bold text-lg">C</span>
                            </div>
                            <span className="font-semibold">Cue2Clarity</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <button onClick={handleNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Plus size={18} /> New Chat
                    </button>
                </div>

                {/* History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chatHistory.map((chat) => (
                        <div key={chat.id} className={`p-3 rounded-lg cursor-pointer ${chat.active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                            <h4 className="text-sm font-medium truncate">{chat.title}</h4>
                            <p className="text-gray-500 text-xs truncate">{chat.preview}</p>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <LogOut size={18} /> <span className="text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Chat */}
            <main className="flex-1 flex flex-col relative">
                <header className="h-16 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4 z-10">
                    <div className="flex items-center space-x-3">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
                                <Menu size={24} />
                            </button>
                        )}
                        <div className="relative">
                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 font-semibold hover:bg-white/10 px-3 py-2 rounded-lg">
                                <span>{selectedMode}</span> <ChevronDown size={16} />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1f2937] border border-gray-700 rounded-lg shadow-xl py-1 z-50">
                                    {modes.map((mode) => (
                                        <button key={mode.id} onClick={() => { setSelectedMode(mode.id); setDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 flex items-center space-x-3 text-gray-300">
                                            <mode.icon size={16} /> <span>{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleClearChat} className="text-gray-400 hover:text-white p-2"><Trash2 size={20} /></button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0f1115]" onDragOver={handleDragOver} onDrop={handleDrop}>
                    <div className="max-w-4xl mx-auto pb-4">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-[50vh]">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                                        <MessageSquare size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-semibold">Ready to help</h3>
                                    <p className="text-gray-400">Ask about your lectures or upload a file.</p>
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

                {/* Input Area */}
                <div className="border-t border-gray-800 bg-[#161b22] p-4">
                    <div className="max-w-4xl mx-auto">
                        {uploadedFile && (
                            <div className="mb-3 flex items-center justify-between bg-white/5 border border-gray-700 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                    <Paperclip size={16} className="text-gray-400" />
                                    <span className="text-sm">{uploadedFile.name}</span>
                                </div>
                                <button onClick={() => setUploadedFile(null)}><X size={16} className="text-gray-400 hover:text-white" /></button>
                            </div>
                        )}
                        <div className="flex items-end space-x-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                                <Paperclip size={20} />
                            </button>
                            <div className="flex-1">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your message..."
                                    rows={1}
                                    className="w-full bg-[#0d1117] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                                    style={{ minHeight: '48px', maxHeight: '120px' }}
                                />
                            </div>
                            <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="p-3 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatInterface;