import React, { useRef, useEffect } from 'react';
import { Card } from './UI';
import { motion, AnimatePresence } from 'framer-motion';

const TranscriptLine = ({ line }) => {
    const isAgent = line.speaker === 'agent';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} mb-4`}
        >
            <div className={`max-w-[80%] p-4 rounded-2xl ${isAgent
                    ? 'bg-primary/10 border border-primary/20 text-gray-200 rounded-tr-sm'
                    : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-sm'
                }`}>
                <p className="text-sm leading-relaxed">{line.text}</p>
            </div>
            <span className="text-[10px] text-gray-600 mt-1 px-1 capitalize">
                {line.speaker} • {line.timestamp}
            </span>
        </motion.div>
    );
};

const LiveTranscript = ({ transcript }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <Card className="h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h3 className="text-lg font-medium text-white">Live Transcript</h3>
                <div className="flex items-center gap-2 text-xs text-green-400">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Recording
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <p>Waiting for voice activity...</p>
                    </div>
                ) : (
                    transcript.map((line, idx) => (
                        <TranscriptLine key={idx} line={line} />
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </Card>
    );
};

export default LiveTranscript;
