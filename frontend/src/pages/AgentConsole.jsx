import React, { useState, useRef, useEffect } from 'react';
import LiveAssistOverlay from '../components/overlay/LiveAssistOverlay';
import { Mic, Square, Play, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AgentConsole = () => {
    const [isActive, setIsActive] = useState(false);
    const [callId, setCallId] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const agentId = "agent_007"; // Mock Agent ID

    const [uploading, setUploading] = useState(false);

    // WebSocket Reference to send data
    const wsRef = useRef(null);
    const audioInputRef = useRef(null);
    const navigate = useNavigate();

    // Simulation Data
    const simulationScript = [
        { role: 'Agent', text: "Thank you for calling Cognivista. How may I assist you?" },
        { role: 'Customer', text: "I am extremely frustrated! My bill is double what it should be." },
        { role: 'Agent', text: "Okay, let me check." },
        { role: 'Customer', text: "This is ridiculous. I want to cancel my subscription immediately!" },
        { role: 'Agent', text: "I understand. Let's see what we can do." }
    ];
    const [simStep, setSimStep] = useState(0);

    const startCall = async () => {
        const newCallId = `call_${Date.now()}`;
        setCallId(newCallId);
        setIsActive(true);
        setTranscript([]);
        setSimStep(0);

        // Connect WS for live nudges and transcript updates
        const ws = new WebSocket(`ws://localhost:8000/api/v1/live/ws/${newCallId}/${agentId}`);
        ws.onopen = () => console.log("🔗 WebSocket Connected for call:", newCallId);
        ws.onerror = (err) => console.error("❌ WebSocket Error:", err);
        wsRef.current = ws;
    };

    const endCall = async () => {
        setIsActive(false);
        if (wsRef.current) wsRef.current.close();
        
        // Build full transcript from conversation
        const fullTranscript = transcript.map(line => `${line.role}: ${line.text}`).join('\n');
        
        console.log("📤 Submitting transcript for analysis...");
        console.log("📝 Transcript length:", fullTranscript.length, "chars");
        
        // Submit transcript for full analysis
        try {
            await axios.post('http://localhost:8000/api/v1/analysis/analyze', {
                call_id: callId,
                transcript: fullTranscript
            });
            console.log("✅ Analysis triggered for:", callId);
        } catch (err) {
            console.error("❌ Failed to trigger analysis:", err);
        }
        
        // Navigate to results page
        navigate(`/analysis?id=${callId}`);
        setCallId(null);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agent_id', agentId);

        try {
            const res = await axios.post('http://localhost:8000/api/v1/analysis/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Navigate to results after a short delay for background processing
            setTimeout(() => {
                setUploading(false);
                navigate(`/analysis?id=${res.data.call_id}`);
            }, 2000);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Ensure backend is running.");
            setUploading(false);
        }
    };

    const triggerUpload = () => audioInputRef.current?.click();

    const simulateNextStep = () => {
        if (simStep >= simulationScript.length) return;

        const line = simulationScript[simStep];
        setTranscript(prev => [...prev, line]);
        setSimStep(prev => prev + 1);

        // Send to Backend
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'transcript_update',
                text: line.text,
                role: line.role
            }));
        }
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl">
            {/* Live HUD Overlay */}
            {isActive && callId && (
                <LiveAssistOverlay callId={callId} agentId={agentId} />
            )}

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#161920]/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Agent Console</h2>
                    <p className="text-gray-400 text-sm">Live Assistance Ready</p>
                </div>
                <div className="flex gap-4">
                    {isActive && (
                        <button
                            onClick={simulateNextStep}
                            disabled={simStep >= simulationScript.length}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg font-medium transition-all border border-blue-600/50 disabled:opacity-50"
                        >
                            <MessageSquare size={18} /> Next Line
                        </button>
                    )}

                    {!isActive ? (
                        <>
                            <input
                                type="file"
                                ref={audioInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="audio/*"
                            />
                            <button
                                onClick={triggerUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                {uploading ? "Analyzing..." : "Upload Audio"}
                            </button>
                            <button
                                onClick={startCall}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            >
                                <Mic size={18} /> Start Call
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={endCall}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            <Square size={18} /> End Call
                        </button>
                    )}
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Transcript Panel */}
                <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                    <div className="bg-[#1c1f26] rounded-xl p-6 border border-white/5 flex-1 flex flex-col overflow-hidden">
                        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 flex-shrink-0">Live Transcript</h3>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {isActive ? (
                                transcript.length > 0 ? (
                                    transcript.map((line, i) => (
                                        <div key={i} className={`flex ${line.role === 'Agent' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${line.role === 'Agent'
                                                ? 'bg-blue-600/20 text-blue-100 rounded-tr-none'
                                                : 'bg-white/10 text-gray-200 rounded-tl-none'
                                                }`}>
                                                <p className="font-bold text-xs mb-1 opacity-50">{line.role}</p>
                                                {line.text}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-600 text-center mt-20">
                                        <p>Conversation inactive.</p>
                                        <p className="text-xs mt-2">Click 'Start Call' then 'Next Line' to simulate.</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-600">
                                    Waiting for call to start...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer Info Panel */}
                <div className="space-y-6">
                    <div className="bg-[#1c1f26] rounded-xl p-6 border border-white/5">
                        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4">Customer Profile</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <span className="text-gray-400">Name</span>
                                <span className="font-medium text-white">John Doe</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <span className="text-gray-400">Loyalty</span>
                                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs font-bold">GOLD</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Risk Score</span>
                                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs font-bold">LOW</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1c1f26] rounded-xl p-6 border border-white/5">
                        <h3 className="text-gray-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                            <Play size={16} /> Recent Actions
                        </h3>
                        <div className="text-sm text-gray-400 space-y-2">
                            <p>• Viewed 'Billing Page' (2m ago)</p>
                            <p>• Failed Login Attempt (1h ago)</p>
                            <p>• Ticket #99201 Created (Yesterday)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentConsole;
