import React, { useState } from 'react';
import { Target, Award, PlayCircle, BarChart2, BookOpen, ChevronRight, Star, Zap, MessageSquare, Mic, User } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const CoachingHub = () => {
    const [activeTab, setActiveTab] = useState('insights');
    const [simulationActive, setSimulationActive] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: 'ai', text: "Hello! I'm your roleplay customer today. I'm calling because my internet connection has been dropping intermittently for three days." }
    ]);
    const [userResponse, setUserResponse] = useState('');

    const topPerformerInsights = [
        {
            title: "The '30-Second' Empathy Rule",
            desc: "Top 5% of agents validate customer emotion within the first 30 seconds of a complaint. This reduces average handle time by 15%.",
            stat: "+15% Efficiency",
            icon: <HeartIcon className="text-pink-400" />
        },
        {
            title: "Proactive Assurance",
            desc: "Agents with >95 CSAT use phrases like 'I will personally handle this' twice as often as average performers.",
            stat: "98% CSAT",
            icon: <ShieldIcon className="text-emerald-400" />
        },
        {
            title: "Silence Management",
            desc: "Successful outcomes correlate with filling 'dead air' during system lookups with process explanation, not silence.",
            stat: "key Differentiator",
            icon: <MicIcon className="text-cyan-400" />
        }
    ];

    const handleSendMessage = () => {
        if (!userResponse.trim()) return;
        setChatHistory(prev => [...prev, { role: 'user', text: userResponse }]);
        setUserResponse('');

        // Mock AI Response
        setTimeout(() => {
            setChatHistory(prev => [...prev, {
                role: 'ai',
                text: "I appreciate you checking. It's just very frustrating because I work from home and I can't afford these outages.",
                feedback: "Good start! Remember to acknowledge their 'work from home' context specifically."
            }]);
        }, 1200);
    };

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
            <header className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-sm">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Award size={16} />
                        <span className="text-xs font-bold tracking-widest uppercase">Growth & Development</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Coaching Hub</h1>
                    <p className="text-gray-400 font-light max-w-2xl">
                        Master your craft. Analyze winning patterns from top performers and practice in a safe, AI-simulated environment.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Stats & Performer Insights */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Radar Chart (Analysis) */}
                    <div className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 w-full mb-4">
                            <Target size={20} className="text-cyan-400" /> Your Skill Matrix
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                    { subject: 'Empathy', A: 65, fullMark: 100 },
                                    { subject: 'Resolution', A: 90, fullMark: 100 },
                                    { subject: 'Speed', A: 80, fullMark: 100 },
                                    { subject: 'Compliance', A: 70, fullMark: 100 },
                                    { subject: 'Tone', A: 85, fullMark: 100 },
                                ]}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="My Skills" dataKey="A" stroke="#22d3ee" strokeWidth={2} fill="#22d3ee" fillOpacity={0.3} />
                                    <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Winning Patterns */}
                    <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-3xl border border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Winning Patterns</h3>
                        <div className="space-y-4">
                            {topPerformerInsights.map((insight, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-black/40 rounded-lg">{insight.icon}</div>
                                        <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-white">{insight.stat}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">{insight.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">{insight.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Simulation */}
                <div className="lg:col-span-8">
                    <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-sm h-full flex flex-col overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/5 to-transparent pointer-events-none" />

                        <div className="p-6 border-b border-white/5 flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap className="text-amber-400" fill="currentColor" size={20} />
                                    AI Roleplay Simulator
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Scenario: Irate Customer - Internet Outage</p>
                            </div>
                            <button
                                onClick={() => setSimulationActive(!simulationActive)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${simulationActive ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                            >
                                {simulationActive ? 'End Session' : 'Start Simulation'}
                            </button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10 min-h-[400px] bg-black/20">
                            {simulationActive ? (
                                chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                                            {msg.role === 'user' ? <User size={20} className="text-white" /> : <User size={20} className="text-gray-300" />}
                                        </div>
                                        <div className={`max-w-[70%] space-y-2`}>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-100 rounded-tr-sm'
                                                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            {msg.feedback && (
                                                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-900/10 p-2 rounded-lg border border-amber-500/20">
                                                    <p><span className="font-bold uppercase tracking-wider">Coach:</span> {msg.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <PlayCircle size={40} className="text-cyan-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ready to Practice?</h3>
                                    <p className="text-sm text-gray-400 max-w-sm">
                                        Start a roleplay session to practice handling difficult scenarios. The AI will provide real-time feedback on your responses.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/40 z-10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    disabled={!simulationActive}
                                    value={userResponse}
                                    onChange={(e) => setUserResponse(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={simulationActive ? "Type your response..." : "Start simulation to chat"}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                                />
                                <button
                                    disabled={!simulationActive}
                                    onClick={handleSendMessage}
                                    className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MessageSquare size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Icon Components for readability
const HeartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
);
const ShieldIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const MicIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
);


export default CoachingHub;
