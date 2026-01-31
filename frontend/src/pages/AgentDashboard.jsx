import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Award, Clock, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AgentDashboard = () => {
    const navigate = useNavigate();
    const [recentCalls, setRecentCalls] = useState([]);
    const [loading, setLoading] = useState(true);

    const performanceData = [
        { day: 'Mon', score: 85 },
        { day: 'Tue', score: 88 },
        { day: 'Wed', score: 92 },
        { day: 'Thu', score: 90 },
        { day: 'Fri', score: 95 },
        { day: 'Sat', score: 93 },
        { day: 'Sun', score: 96 },
    ];

    useEffect(() => {
        const fetchDemoCalls = async () => {
            try {
                // Try to get actual calls from DB, fallback to demo if none
                const res = await axios.get('http://localhost:8000/api/v1/analysis/');
                setRecentCalls(res.data.slice(0, 5));
            } catch (err) {
                console.warn("Using mock call history");
                setRecentCalls([
                    { _id: 'call_demo_1', started_at: new Date().toISOString(), scores: { compliance: 95, sentiment: 80 }, status: 'completed' },
                    { _id: 'call_demo_2', started_at: new Date().toISOString(), scores: { compliance: 88, sentiment: 60 }, status: 'completed' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchDemoCalls();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Agent Performance Overview</h1>
                    <p className="text-gray-400 mt-2">Welcome back, Agent 007. Here is your current standing.</p>
                </div>
                <button
                    onClick={() => navigate('/console')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
                >
                    <Play size={18} fill="currentColor" /> Enter Console
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Avg QA Score', value: '94%', icon: <Award className="text-blue-400" />, trend: '+2.4%' },
                    { label: 'Compliance', value: '98%', icon: <TrendingUp className="text-green-400" />, trend: '+0.5%' },
                    { label: 'Avg Duration', value: '4:12', icon: <Clock className="text-purple-400" />, trend: '-12s' },
                    { label: 'Calls Today', value: '12', icon: <LayoutDashboard className="text-yellow-400" />, trend: '+3' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#161920]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl transition-transform hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg">{stat.icon}</div>
                            <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{stat.trend}</span>
                        </div>
                        <h4 className="text-gray-400 text-sm font-medium">{stat.label}</h4>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score History Graph */}
                <div className="lg:col-span-2 bg-[#161920]/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Weekly Quality Score Trajectory</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="day" stroke="#666" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fontSize: 12 }} domain={[70, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Calls */}
                <div className="bg-[#161920]/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Recent Evaluations</h3>
                    <div className="space-y-4 flex-1">
                        {recentCalls.map((call, i) => (
                            <div
                                key={call._id}
                                onClick={() => navigate(`/analysis?id=${call._id}`)}
                                className="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <CheckCircle size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">QA Score: {call.scores?.compliance || 'N/A'}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(call.started_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        View All History
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
