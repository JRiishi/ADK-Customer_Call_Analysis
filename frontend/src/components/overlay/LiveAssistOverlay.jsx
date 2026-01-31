import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveAssistOverlay = ({ callId, agentId, onTranscriptUpdate }) => {
    const [nudges, setNudges] = useState([]);
    const [status, setStatus] = useState("connecting");
    const wsRef = useRef(null);

    useEffect(() => {
        if (!callId) return;

        // Connect to WebSocket
        const wsUrl = `ws://localhost:8000/api/v1/live/ws/${callId}/${agentId}`;
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
        <div className="absolute top-4 right-4 w-96 z-50 pointer-events-none">
            <div className="flex justify-end mb-4">
                <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {status.toUpperCase()}
                </span>
            </div>

            <AnimatePresence>
                {nudges.map((nudge) => (
                    <motion.div
                        key={nudge.id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`mb-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl pointer-events-auto
                            ${nudge.severity === 'high'
                                ? 'bg-red-900/40 border-red-500/50 text-red-100'
                                : 'bg-blue-900/40 border-blue-500/50 text-blue-100'}
                        `}
                    >
                        <div className="flex items-start">
                            <div className={`p-2 rounded-lg mr-3 ${nudge.severity === 'high' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide uppercase mb-1">
                                    {nudge.severity} Priority
                                </h4>
                                <p className="text-sm font-medium leading-relaxed opacity-90">
                                    {nudge.message}
                                </p>
                                {nudge.action && (
                                    <div className="mt-3 text-xs bg-black/20 p-2 rounded border border-white/5">
                                        👉 {nudge.action}
                                    </div>
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
