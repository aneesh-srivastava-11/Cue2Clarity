import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import {
    Send, MessageSquare, Paperclip, Plus, Settings, Menu, X, Trash2,
    LogOut, ChevronDown, BookOpen, GraduationCap, BarChart, FileText, Eye, EyeOff, Brain
} from 'lucide-react';
import api from '../services/api';

// --- OPTIMIZED MESSAGE BUBBLES ---
const RevealAnswer = React.memo(({ text }) => {
    const [isVisible, setIsVisible] = useState(false);
    const cleanText = text.replace(/\*/g, '').trim();

    return (
        <div className="mt-2 mb-4">
            {!isVisible ? (
                <button onClick={() => setIsVisible(true)} className="flex items-center gap-2 text-xs font-semibold bg-emerald-900/30 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
                    <Eye size={14} /> Show Answer
                </button>
            ) : (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{cleanText}</span>
                    <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-white"><EyeOff size={14} /></button>
                </div>
            )}
        </div>
    );
});

const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        if (line.includes('Correct Answer:')) return <RevealAnswer key={i} text={line} />;
        if (/^\d+\./.test(line.trim())) return <div key={i} className="text-emerald-400 font-bold text-lg mt-4 mb-2">{line}</div>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <div key={i} className={`min-h-[1.5em] ${line.trim().startsWith('-') ? 'ml-4' : ''}`}>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-bold text-emerald-300">{part.slice(2, -2)}</strong>;
                    return part;
                })}
            </div>
        );
    });
};

const MessageBubble = React.memo(({ text, isUser, sources }) => (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${isUser ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1c1f26] text-white border border-gray-800'}`}>
            <div className="leading-relaxed">{isUser ? text : renderMessageContent(text)}</div>
            {!isUser && sources && sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2"><BookOpen size={14} className="text-emerald-400" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Source Material</p></div>
                    <div className="grid gap-2">
                        {sources.map((src, idx) => (
                            <div key={idx} className="bg-black/20 p-2 rounded-lg flex items-center justify-between hover:bg-black/30 transition-colors">
                                <div className="flex-1 min-w-0 mr-3"><p className="text-sm font-medium text-emerald-200 truncate">📄 {src.source}</p>{src.chapter && <p className="text-xs text-gray-500 truncate">Chapter: {src.chapter}</p>}</div>
                                {src.pdf_url ? <a href={src.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1.5 rounded hover:bg-emerald-600 hover:text-white transition-all"><span>Open PDF</span><FileText size={12} /></a> : <span className="text-xs text-gray-600 italic">No Link</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
));

const TypingIndicator = React.memo(() => (<div className="flex justify-start mb-4 animate-pulse"><div className="bg-[#1c1f26] p-4 rounded-2xl text-gray-400 text-sm border border-gray-800">Thinking...</div></div>));

// --- MAIN COMPONENT ---
const ChatInterface = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [messages, setMessages] = useState([{ id: 1, text: 'Hello! I am connected to your lecture notes. What would you like to review?', isUser: false, timestamp: new Date().toLocaleTimeString() }]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // --- QUIZ STATE ---
    const [quizStep, setQuizStep] = useState('TOPIC');
    const [quizTopic, setQuizTopic] = useState('');

    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadSubject, setUploadSubject] = useState('');
    const [uploadChapter, setUploadChapter] = useState('');
    const [chatHistory, setChatHistory] = useState([{ id: 1, title: 'Current Session', preview: 'Active chat...', active: true }]);
    const [selectedMode, setSelectedMode] = useState('Lectures');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const modes = [
        { id: 'Lectures', icon: BookOpen, label: 'Lectures' },
        { id: 'Exam', icon: GraduationCap, label: 'Exam' },
        { id: 'Quizzes', icon: BarChart, label: 'Quizzes' },
        { id: 'Assignment', icon: FileText, label: 'Assignment' },
    ];

    useEffect(() => { setQuizStep('TOPIC'); setQuizTopic(''); }, [selectedMode]);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => scrollToBottom(), [messages.length, isTyping]);

    // --- LOGIC ---
    const handleSendMessage = async () => {
        if (!inputValue.trim() && !uploadedFile) return;

        const currentText = inputValue;
        let backendMode = selectedMode.toUpperCase();
        if (selectedMode === 'Exam' || selectedMode === 'Quizzes') backendMode = 'QUIZ';
        if (selectedMode === 'Lectures') backendMode = 'LECTURE';

        // --- 1. QUIZ FLOW ---
        if (backendMode === 'QUIZ' && !uploadedFile) {
            if (quizStep === 'TOPIC') {
                const userMsg = { id: messages.length + 1, text: currentText, isUser: true, timestamp: new Date().toLocaleTimeString() };
                setMessages(prev => [...prev, userMsg]);
                setInputValue('');
                setIsTyping(true);

                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: prev.length + 1,
                        text: `Got it! You want a quiz on **"${currentText}"**. \n\nWhat difficulty level would you like? (e.g., Easy, Medium, Hard)`,
                        isUser: false,
                        timestamp: new Date().toLocaleTimeString()
                    }]);
                    setIsTyping(false);
                    setQuizTopic(currentText);
                    setQuizStep('DIFFICULTY');
                }, 600);
                return;
            }

            if (quizStep === 'DIFFICULTY') {
                const userMsg = { id: messages.length + 1, text: currentText, isUser: true, timestamp: new Date().toLocaleTimeString() };
                setMessages(prev => [...prev, userMsg]);
                setInputValue('');
                setIsTyping(true);

                try {
                    const response = await api.post("/chat", {
                        question: quizTopic,
                        mode: backendMode,
                        difficulty: currentText
                    });

                    const data = response.data;

                    setMessages(prev => [...prev, {
                        id: prev.length + 2, text: data.answer, sources: data.sources, isUser: false, timestamp: new Date().toLocaleTimeString()
                    }]);
                } catch (error) {
                    console.error("Error:", error);
                } finally {
                    setIsTyping(false);
                    setQuizStep('TOPIC');
                    setQuizTopic('');
                }
                return;
            }
        }

        // --- 2. STANDARD CHAT/UPLOAD ---
        const newMessage = { id: messages.length + 1, text: uploadedFile ? `Uploading ${uploadedFile.name}...` : currentText, isUser: true, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("subject", uploadSubject || "General");
                formData.append("chapter", uploadChapter || "General");

                if (uploadedFile) {
                    const formData = new FormData();
                    formData.append("file", uploadedFile);
                    formData.append("subject", uploadSubject || "General");
                    formData.append("chapter", uploadChapter || "General");

                    const uploadResponse = await api.post("/upload", formData, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                    const uploadData = uploadResponse.data;

                    setMessages(prev => [...prev, { id: prev.length + 2, text: `✅ Uploaded **${uploadData.filename}**!`, isUser: false, timestamp: new Date().toLocaleTimeString() }]);
                    setUploadedFile(null); setUploadSubject(''); setUploadChapter('');
                } else {
                    const response = await api.post("/chat", {
                        question: currentText,
                        mode: backendMode
                    });

                    const data = response.data;
                    setMessages(prev => [...prev, { id: prev.length + 2, text: data.answer, sources: data.sources, isUser: false, timestamp: new Date().toLocaleTimeString() }]);
                }
            } catch (error) {
                setMessages(prev => [...prev, { id: prev.length + 2, text: "⚠️ Error connecting to server.", isUser: false, timestamp: new Date().toLocaleTimeString() }]);
            } finally {
                setIsTyping(false);
            }
        };

        const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
        const handleFileUpload = (e) => { const file = e.target.files[0]; if (file) setUploadedFile(file); };
        const handleLogout = async () => { await signOut(auth); navigate('/login'); };

        return (
            <div className="h-screen flex bg-[#0f1115] overflow-hidden text-white font-sans">
                <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#161b22] border-r border-gray-800 transition-all duration-300 flex flex-col overflow-hidden`}>
                    <div className="p-4 border-b border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-lg group-hover:border-emerald-500/50 transition-all">
                                    <Brain className="w-6 h-6 text-emerald-400" />
                                </div>
                                <span className="font-bold text-white tracking-tight">
                                    Cue2<span className="text-emerald-400">Clarity</span>
                                </span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <button onClick={() => setMessages([])} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-emerald-900/20"><Plus size={18} /> New Chat</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chatHistory.map((chat) => (
                            <div key={chat.id} className={`p-3 rounded-lg cursor-pointer transition-all ${chat.active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
                                <h4 className="text-sm font-medium truncate">{chat.title}</h4>
                                <p className={`text-xs truncate ${chat.active ? 'text-emerald-400/70' : 'text-gray-600'}`}>{chat.preview}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-800"><button onClick={handleLogout} className="w-full flex items-center space-x-2 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors"><LogOut size={18} /> <span className="text-sm">Logout</span></button></div>
                </aside>
                <main className="flex-1 flex flex-col relative">
                    <header className="h-16 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4 z-10">
                        <div className="flex items-center space-x-3">{!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white"><Menu size={24} /></button>}<div className="relative"><button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 font-semibold hover:bg-white/10 px-3 py-2 rounded-lg"><span>{selectedMode}</span> <ChevronDown size={16} /></button>{dropdownOpen && (<div className="absolute top-full left-0 mt-2 w-48 bg-[#1f2937] border border-gray-700 rounded-lg shadow-xl py-1 z-50">{modes.map((mode) => (<button key={mode.id} onClick={() => { setSelectedMode(mode.id); setDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 flex items-center space-x-3 text-gray-300"><mode.icon size={16} /> <span>{mode.label}</span></button>))}</div>)}</div></div><button onClick={() => setMessages([])} className="text-gray-400 hover:text-white p-2"><Trash2 size={20} /></button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0f1115]">
                        <div className="max-w-4xl mx-auto pb-4">
                            {messages.length === 0 ? (<div className="flex items-center justify-center h-[50vh]"><div className="text-center space-y-4"><div className="w-16 h-16 bg-[#1c1f26] border border-gray-800 rounded-2xl flex items-center justify-center mx-auto"><MessageSquare size={32} className="text-emerald-500" /></div><h3 className="text-2xl font-semibold">Ready to help</h3><p className="text-gray-400">Ask about your lectures or upload a PDF.</p></div></div>) : (<>{messages.map((message) => <MessageBubble key={message.id} {...message} />)}{isTyping && <TypingIndicator />}<div ref={messagesEndRef} /></>)}
                        </div>
                    </div>
                    <div className="border-t border-gray-800 bg-[#161b22] p-4"><div className="max-w-4xl mx-auto">
                        {uploadedFile && !isTyping && (<div className="mb-3 bg-white/5 border border-gray-700 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2"><div className="flex items-center justify-between mb-3"><div className="flex items-center space-x-2"><Paperclip size={16} className="text-emerald-400" /><span className="text-sm font-medium">{uploadedFile.name}</span></div><button onClick={() => setUploadedFile(null)}><X size={16} className="text-gray-400 hover:text-white" /></button></div><div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Subject" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" /><input type="text" placeholder="Chapter" value={uploadChapter} onChange={(e) => setUploadChapter(e.target.value)} className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" /></div></div>)}
                        <div className="flex items-end space-x-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />

                            {/* ✅ ALIGNED PAPERCLIP BUTTON */}
                            <button onClick={() => fileInputRef.current?.click()} className="h-12 w-12 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors">
                                <Paperclip size={20} />
                            </button>

                            <div className="flex-1">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={uploadedFile ? "Add context..." : (selectedMode === 'Exam' || selectedMode === 'Quizzes') ? (quizStep === 'DIFFICULTY' ? "Type Easy, Medium, or Hard..." : "Enter topic for quiz...") : selectedMode === 'Assignment' ? "Paste homework question..." : "Ask a question..."}
                                    rows={1}
                                    className="w-full bg-[#0d1117] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none resize-none"
                                    style={{ minHeight: '48px', maxHeight: '120px' }}
                                />
                            </div>

                            {/* ✅ ALIGNED SEND BUTTON */}
                            <button onClick={handleSendMessage} disabled={!inputValue.trim() && !uploadedFile} className="h-12 w-12 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:bg-gray-700 transition-colors shadow-lg shadow-emerald-900/20">
                                <Send size={20} />
                            </button>
                        </div>
                    </div></div>
                </main>
            </div>
        );
    };

    export default ChatInterface;