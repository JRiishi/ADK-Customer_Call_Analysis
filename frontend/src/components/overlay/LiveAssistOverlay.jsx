import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// WebSocket URL - uses ws:// for dev, wss:// for production
const getWsUrl = (callId, agentId) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, '') 
        : window.location.host;
    return `${protocol}//${host}/api/v1/live/ws/${callId}/${agentId}`;
};

const LiveAssistOverlay = ({ callId, agentId, onTranscriptUpdate }) => {
    const [nudges, setNudges] = useState([]);
    const [status, setStatus] = useState("connecting");
    const wsRef = useRef(null);

    useEffect(() => {
        if (!callId) return;

        // Connect to WebSocket
        const wsUrl = getWsUrl(callId, agentId);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to Live Service");
            setStatus("connected");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'nudge') {
                addNudge(data);
            }
        };

        ws.onclose = () => setStatus("disconnected");

        return () => {
            ws.close();
        };
    }, [callId, agentId]);

    const addNudge = (nudge) => {
        const id = Date.now();
        setNudges(prev => [{ ...nudge, id }, ...prev].slice(0, 3)); // Keep recent 3

        // Auto dismiss lower severity nudges
        if (nudge.severity !== 'high') {
            setTimeout(() => {
                setNudges(prev => prev.filter(n => n.id !== id));
            }, 8000);
        }
    };

    return (
        <div className="absolute top-6 right-6 w-[400px] z-50 pointer-events-none flex flex-col gap-4">
            <div className="flex justify-end">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm
                    ${status === 'connected'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {status === 'connected' ? 'Live Insight Active' : 'Connecting...'}
                </motion.div>
            </div>

            <AnimatePresence mode="popLayout">
                {nudges.map((nudge) => (
                    <motion.div
                        key={nudge.id}
                        layout
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`relative p-5 rounded-2xl border backdrop-blur-xl shadow-lg pointer-events-auto overflow-hidden
                            ${nudge.severity === 'high'
                                ? 'bg-red-500/10 border-red-500/20 shadow-red-500/5'
                                : 'bg-cyan-600/10 border-cyan-500/20 shadow-cyan-500/5'}
                        `}
                    >
                        {/* Ambient Glow */}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none opacity-40
                            ${nudge.severity === 'high' ? 'bg-red-500/20' : 'bg-cyan-500/20'}`}
                        />

                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm
                                ${nudge.severity === 'high' ? 'bg-red-500/10' : 'bg-cyan-500/10'}`}>
                                {nudge.severity === 'high'
                                    ? <AlertTriangle size={20} className="text-red-300" />
                                    : <Zap size={20} className="text-cyan-300" />
                                }
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest
                                        ${nudge.severity === 'high' ? 'text-red-300' : 'text-cyan-300'}`}>
                                        {nudge.severity} Priority
                                    </h4>
                                    <span className="text-[10px] text-gray-500">Just now</span>
                                </div>

                                <p className="text-sm font-medium text-gray-200 leading-relaxed mb-3">
                                    {nudge.message}
                                </p>

                                {nudge.action && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-2"
                                    >
                                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-300 font-medium">Suggested: <span className="text-white">{nudge.action}</span></span>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default LiveAssistOverlay;
