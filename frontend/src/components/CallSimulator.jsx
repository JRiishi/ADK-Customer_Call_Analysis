import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic, Volume2, User, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge } from './UI';

const CallSimulator = ({ onTranscriptUpdate, onAnalysisUpdate }) => {
    const [isActive, setIsActive] = useState(false);
    const [duration, setDuration] = useState(0);
    const timerRef = useRef(null);

    // Mock conversation for simulation
    const conversation = [
        { speaker: 'customer', text: "Hi, I'm calling because my delivery is late again.", sentiment: 'negative' },
        { speaker: 'agent', text: "I apologize for the inconvenience. Let me check that for you.", sentiment: 'neutral' },
        { speaker: 'customer', text: "It was supposed to be here yesterday! This is unacceptable.", sentiment: 'negative' },
        { speaker: 'agent', text: "I see the delay. I can issue a 20% refund immediately.", sentiment: 'positive' },
        { speaker: 'customer', text: "Okay, that helps. Thank you.", sentiment: 'positive' },
    ];

    const [currentLine, setCurrentLine] = useState(-1);

    const startCall = () => {
        setIsActive(true);
        setCurrentLine(-1);
        onTranscriptUpdate([]);

        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        // Simulate flow
        let lineIdx = 0;
        const interval = setInterval(() => {
            if (lineIdx >= conversation.length) {
                clearInterval(interval);
                return;
            }

            const line = conversation[lineIdx];
            setCurrentLine(lineIdx);
            onTranscriptUpdate(prev => [...prev, { ...line, timestamp: new Date().toLocaleTimeString() }]);

            // Mock analysis update
            if (line.speaker === 'customer') {
                onAnalysisUpdate({
                    sentiment: line.sentiment,
                    risk: line.sentiment === 'negative' ? 'High' : 'Low'
                });
            }

            lineIdx++;
        }, 3000); // New line every 3 seconds
    };

    const endCall = () => {
        setIsActive(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
        setDuration(0);
        setCurrentLine(-1);
    };

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="h-full flex flex-col relative overflow-hidden" glow={isActive}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                    <h3 className="text-lg font-medium text-white">Live Call Simulation</h3>
                </div>
                <Badge variant={isActive ? 'success' : 'default'}>
                    {isActive ? 'CONNECTED' : 'STANDBY'}
                </Badge>
            </div>

            {/* Visualization Mockup */}
            <div className="h-32 bg-black/20 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden border border-white/5">
                {isActive ? (
                    <div className="flex items-end justify-center gap-1 h-12">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-primary/60 rounded-full"
                                animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                            />
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-600 text-sm">No Audio Stream</span>
                )}
            </div>

            {/* Controls */}
            <div className="mt-auto grid grid-cols-2 gap-4">
                {!isActive ? (
                    <button
                        onClick={startCall}
                        className="col-span-2 bg-primary hover:bg-primary-dim text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Play className="w-4 h-4" /> Start Simulation
                    </button>
                ) : (
                    <>
                        <div className="col-span-2 flex items-center justify-center mb-4">
                            <span className="font-mono text-2xl text-white tracking-widest">{formatTime(duration)}</span>
                        </div>
                        <button
                            onClick={endCall}
                            className="col-span-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Square className="w-4 h-4" /> End Call
                        </button>
                    </>
                )}
            </div>
        </Card>
    );
};

export default CallSimulator;
