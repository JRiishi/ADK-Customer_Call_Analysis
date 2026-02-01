import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Award, Clock, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AgentDashboard = () => {
    const navigate = useNavigate();
    const [recentCalls, setRecentCalls] = useState([]);
    const [stats, setStats] = useState({ qa: 94, compliance: 98, duration: '4:12', calls: 12 });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/v1/analysis/`);
                const data = res.data;

                // Sort by date desc just in case
                const sortedCalls = data.sort((a, b) => new Date(b.started_at) - new Date(a.started_at)).slice(0, 5);
                setRecentCalls(sortedCalls);

                // Calculate simple stats from actual data if available
                if (data.length > 0) {
                    const totalQa = data.reduce((acc, curr) => acc + (curr.scores?.qa || 0), 0);
                    const totalSop = data.reduce((acc, curr) => acc + (curr.scores?.sop || 0), 0);
                    const avgQa = Math.round(totalQa / data.length);
                    const avgSop = Math.round(totalSop / data.length);

                    setStats(prev => ({
                        ...prev,
                        qa: avgQa || 94,
                        compliance: avgSop || 98,
                        calls: data.length
                    }));
                }
                setLastUpdated(new Date());
            } catch (err) {
                console.warn("Using mock call history due to API error", err);
                // Keep existing mocks if needed, or handle error
            } finally {
                setLoading(false);
            }
        };

        // Initial Fetch
        fetchDashboardData();

        // Live Polling every 5 seconds
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, []);

    const performanceData = [
        { day: 'Mon', score: 85 },
        { day: 'Tue', score: 88 },
        { day: 'Wed', score: 92 },
        { day: 'Thu', score: 90 },
        { day: 'Fri', score: 95 },
        { day: 'Sat', score: 93 },
        { day: 'Sun', score: 96 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Agent Performance Overview</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-gray-400">Welcome back, Agent 007.</p>
                        <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Live Updates
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={() => navigate('/console')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
                    >
                        <Play size={18} fill="currentColor" /> Enter Console
                    </button>
                    <p className="text-[10px] text-gray-500 font-mono">
                        Last synced: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Avg QA Score', value: `${stats.qa}%`, icon: <Award className="text-blue-400" />, trend: '+2.4%' },
                    { label: 'Compliance', value: `${stats.compliance}%`, icon: <TrendingUp className="text-green-400" />, trend: '+0.5%' },
                    { label: 'Avg Duration', value: stats.duration, icon: <Clock className="text-indigo-400" />, trend: '-12s' },
                    { label: 'Total Calls', value: stats.calls, icon: <LayoutDashboard className="text-yellow-400" />, trend: '+3' },
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
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                        {recentCalls.length > 0 ? (
                            recentCalls.map((call, i) => (
                                <div
                                    key={call._id || i}
                                    onClick={() => navigate(`/analysis?id=${call._id}`)}
                                    className="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-110 
                                            ${(call.scores?.qa || 0) >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                                                (call.scores?.qa || 0) >= 75 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {call.scores?.qa || 0}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white truncate w-32 md:w-auto">
                                                ID: {call._id?.slice(-8) || 'Unknown'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-gray-500">{new Date(call.started_at).toLocaleTimeString()}</p>
                                                {call.scores?.risk > 0 && (
                                                    <span className="text-[10px] text-red-400 bg-red-400/10 px-1 rounded">RISK</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No evaluations yet.
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate('/profile')} className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        View All History
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;
