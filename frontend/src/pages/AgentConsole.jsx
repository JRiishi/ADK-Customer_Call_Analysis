import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, MessageSquare, Upload, User, CreditCard, Activity, Clock, AlertTriangle, Cpu, Zap, Radio, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// API Base URL - uses proxy in development, direct URL in production
const API_BASE = import.meta.env.VITE_API_URL || '';

// Simulated Waveform Component
const Waveform = ({ active }) => (
    <div className="flex items-center justify-center gap-1 h-12 w-full max-w-[200px]">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className={`w-1 bg-cyan-500 rounded-full transition-all duration-150 ${active ? 'animate-wave' : 'h-1 opacity-20'}`}
                style={{ animationDelay: `${i * 0.05}s`, height: active ? '100%' : '4px' }}
            />
        ))}
    </div>
);

const AgentConsole = () => {
    const [isActive, setIsActive] = useState(false);
    const [callId, setCallId] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [insights, setInsights] = useState([]);
    const [processingStatus, setProcessingStatus] = useState('IDLE'); // IDLE, LISTENING, ANALYZING, DETECTED
    const [uploading, setUploading] = useState(false);

    // Refs
    const transcriptEndRef = useRef(null);
    const navigate = useNavigate();
    const wsRef = useRef(null);
    const fileInputRef = useRef(null);

    // Mock Data for "Live Call" feel
    const simulationScript = [
        { role: 'Agent', text: "Thank you for calling Cognivista. This is Alex speaking. How can I help you today?" },
        { role: 'Customer', text: "Yeah, hi. I've been waiting on hold for 20 minutes! This is ridiculous." },
        {
            type: 'insight',
            title: "Sentiment High Alert",
            desc: "Customer frustration detected (>85%). Acknowledge wait time immediately.",
            severity: "high",
            action: "Apologize & Validate"
        },
        { role: 'Agent', text: "I completely understand your frustration. I apologize for the long wait. I'm here to solve your issue right now." },
        { role: 'Customer', text: "Fine. My internet bill has gone up again. You guys promised a fixed rate!" },
        {
            type: 'insight',
            title: "Churn Risk Detected",
            desc: "Price sensitivity mentions. Customer referencing 'Promised fixed rate'.",
            severity: "medium",
            action: "Check Contract Terms"
        },
        { role: 'Agent', text: "Let me pull up your account details to check that agreement. One moment please." }
    ];

    const [simStep, setSimStep] = useState(0);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const startCall = () => {
        setCallId(`call_${Date.now()}`);
        setIsActive(true);
        setTranscript([]);
        setInsights([]);
        setSimStep(0);
        setProcessingStatus('LISTENING');
    };

    const simulateNextStep = () => {
        if (simStep >= simulationScript.length) return;

        const item = simulationScript[simStep];

        if (item.type === 'insight') {
            // Visualize "Processing" -> "Insight Found"
            setProcessingStatus('ANALYZING');
            setTimeout(() => {
                setInsights(prev => [item, ...prev]); // Add to top of insights
                setProcessingStatus('DETECTED');
                setTimeout(() => setProcessingStatus('LISTENING'), 2000);
            }, 800);
        } else {
            // Text Message
            setProcessingStatus('LISTENING');
            setTranscript(prev => [...prev, item]);
        }

        setSimStep(prev => prev + 1);
    };

    const endCall = () => {
        setIsActive(false);
        setProcessingStatus('IDLE');
        // In real app, submit transcript here
        console.log("Call Ended, Transcript:", transcript);
        navigate(`/analysis?id=${callId || 'demo'}`);
    };

    // --- File Upload Logic (RESTORED) ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setProcessingStatus('ANALYZING'); // Reuse status for visual feedback

        const formData = new FormData();
        formData.append('file', file);
        formData.append('agent_id', 'agent_007'); // Default or dynamic

        try {
            // Don't set Content-Type header - let axios set it automatically with boundary
            const response = await axios.post(`${API_BASE}/api/v1/analysis/upload`, formData, {
                timeout: 120000, // 2 minute timeout for large files
            });
            console.log("Upload Success:", response.data);

            // Navigate to analysis page with the new call ID
            navigate(`/analysis?id=${response.data.call_id}`);
        } catch (error) {
            console.error("Upload failed:", error);
            const errorMsg = error.response?.data?.detail || error.message || "Upload failed. Please try again.";
            alert(`Upload failed: ${errorMsg}`);
            setProcessingStatus('IDLE');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="h-full w-full bg-[#050505] text-white flex flex-col overflow-hidden font-sans selection:bg-cyan-500/20">
            {/* Top Bar: Status & Controls */}
            <header className="h-16 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-6 backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Activity size={18} className="text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-widest uppercase">Live Console</h1>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                            <span className="text-[10px] text-gray-500 font-mono">{isActive ? 'REC 00:04:12' : 'STANDBY'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-white/5 rounded border border-white/5 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Processing Status:</span>
                        <span className={`text-xs font-bold w-20 text-center transition-colors ${processingStatus === 'ANALYZING' ? 'text-amber-400' :
                            processingStatus === 'DETECTED' ? 'text-emerald-400' :
                                processingStatus === 'LISTENING' ? 'text-cyan-400' : 'text-gray-600'
                            }`}>
                            {processingStatus}
                        </span>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="audio/*,.wav,.mp3"
                    />

                    {!isActive ? (
                        <div className="flex gap-3">
                            {/* Upload Button */}
                            <button
                                onClick={triggerUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded text-xs font-bold uppercase tracking-widest transition-all"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={14} /> Upload Audio
                                    </>
                                )}
                            </button>

                            <button onClick={startCall} className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                <Mic size={14} /> Start Call
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={simulateNextStep}
                                disabled={simStep >= simulationScript.length}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold uppercase tracking-widest text-cyan-300 disabled:opacity-30 flex items-center gap-2"
                            >
                                <Play size={12} fill="currentColor" /> Sim
                            </button>
                            <button onClick={endCall} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-xs font-bold uppercase tracking-widest text-red-500">
                                End Call
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden w-full">
                {/* Left Panel: Customer Profile & Waveform */}
                <div className="w-80 border-r border-white/5 bg-black/20 p-6 flex flex-col gap-6 relative z-10 shrink-0">
                    {/* Customer Card */}
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-white/10 flex items-center justify-center font-bold text-lg text-gray-400">JD</div>
                            <div>
                                <h3 className="font-bold text-white">John Doe</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Premium Tier</p>
                            </div>
                        </div>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Risk Score</span>
                                <span className="text-emerald-400 font-bold">Low (12)</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Sentiment</span>
                                <span className="text-amber-400 font-bold">Neutral</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[80%]" />
                            </div>
                        </div>
                    </div>

                    {/* Live Processing Unit Visualizer */}
                    <div className="flex-1 rounded-2xl border border-white/5 bg-black relative overflow-hidden flex flex-col items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />

                        <div className="relative z-10 text-center space-y-4">
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Voice Stream Analysis</p>
                            <Waveform active={processingStatus === 'LISTENING' || processingStatus === 'ANALYZING'} />
                            <div className="flex gap-2 justify-center mt-4">
                                <div className={`w-2 h-2 rounded-full ${processingStatus === 'ANALYZING' ? 'bg-amber-400 animate-bounce' : 'bg-gray-800'}`} />
                                <div className={`w-2 h-2 rounded-full ${processingStatus === 'ANALYZING' ? 'bg-amber-400 animate-bounce' : 'bg-gray-800'}`} style={{ animationDelay: '0.1s' }} />
                                <div className={`w-2 h-2 rounded-full ${processingStatus === 'ANALYZING' ? 'bg-amber-400 animate-bounce' : 'bg-gray-800'}`} style={{ animationDelay: '0.2s' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Transcript */}
                <div className="flex-1 bg-black/40 relative flex flex-col container-lines min-w-0">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px)', backgroundSize: '100% 40px' }}
                    />

                    <div className="p-3 border-b border-white/5 text-[10px] text-gray-600 uppercase tracking-widest bg-black/40 backdrop-blur-sm sticky top-0 z-10 flex justify-between">
                        <span>Live Transcript Stream</span>
                        <span>Enlish-US / mono / 44.1kHz</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
                        {transcript.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-700 opacity-50">
                                <Radio size={48} className="mb-4 animate-pulse" />
                                <p className="text-xs uppercase tracking-widest">Waiting for Audio Input...</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {transcript.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex gap-4 max-w-3xl ${msg.role === 'Agent' ? 'ml-auto flex-row-reverse text-right' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold border ${msg.role === 'Agent' ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400'
                                            }`}>
                                            {msg.role === 'Agent' ? 'AG' : 'CU'}
                                        </div>
                                        <div className={`p-4 rounded-b-xl rounded-tr-xl border text-sm leading-relaxed ${msg.role === 'Agent'
                                            ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-100 rounded-tl-xl rounded-tr-none'
                                            : 'bg-[#111] border-white/5 text-gray-300'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                {/* Right Panel: Live Insights */}
                <div className="w-96 border-l border-white/5 bg-black/20 p-6 flex flex-col relative z-20 shrink-0">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap size={16} className="text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">AI Assistance</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        <AnimatePresence>
                            {insights.map((insight, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    className={`p-4 rounded-xl border-l-4 backdrop-blur-md shadow-lg ${insight.severity === 'high'
                                        ? 'bg-red-950/10 border-red-500 border-y border-r border-white/5'
                                        : 'bg-amber-950/10 border-amber-500 border-y border-r border-white/5'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${insight.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {insight.severity} Priority
                                        </span>
                                        <Clock size={12} className="text-gray-600" />
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">{insight.title}</h4>
                                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">{insight.desc}</p>

                                    {insight.action && (
                                        <div className="p-2 rounded bg-white/5 border border-white/5 flex gap-2 items-start">
                                            <div className="mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /></div>
                                            <div>
                                                <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-0.5">Recommended Action</span>
                                                <span className="text-xs text-gray-300">{insight.action}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {insights.length === 0 && (
                            <div className="text-center mt-20 opacity-30">
                                <Cpu size={40} className="mx-auto mb-4" />
                                <p className="text-xs uppercase tracking-widest">AI Listening for cues...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentConsole;
