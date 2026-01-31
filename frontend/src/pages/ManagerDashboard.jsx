import React, { useState, useEffect } from 'react';
import { Users, BarChart2, TrendingUp, AlertCircle, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import axios from 'axios';

const ManagerDashboard = () => {
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(true);

    const metrics = [
        { label: 'Team QA Avg', value: '88.4%', trend: '+3.2%', positive: true, icon: <BarChart2 className="text-blue-400" /> },
        { label: 'Active Agents', value: '12 / 15', trend: 'Stable', positive: true, icon: <Users className="text-purple-400" /> },
        { label: 'Compliance Rate', value: '94.1%', trend: '-0.5%', positive: false, icon: <TrendingUp className="text-green-400" /> },
        { label: 'Critical Risks', value: '2', trend: '-1', positive: true, icon: <AlertCircle className="text-red-400" /> },
    ];

    const agentPerformance = [
        { name: 'James Bond', score: 95, calls: 42, sentiment: 88 },
        { name: 'Sarah Connor', score: 92, calls: 38, sentiment: 82 },
        { name: 'Ellen Ripley', score: 85, calls: 25, sentiment: 75 },
        { name: 'John Doe', score: 78, calls: 31, sentiment: 65 },
        { name: 'Agent 007', score: 91, calls: 14, sentiment: 85 },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/analysis/dashboard/stats');
                if (res.data.metrics && res.data.metrics.length > 0) {
                    setDashboardMetrics(res.data.metrics);
                    setAgentPerf(res.data.agent_performance);
                }
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const [dashboardMetrics, setDashboardMetrics] = useState(metrics);
    const [agentPerf, setAgentPerf] = useState(agentPerformance);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Manager Dashboard</h1>
                    <p className="text-gray-400 mt-2">Team-wide performance & resource allocation.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors">
                        Export Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        Assign Training
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardMetrics.map((m, i) => (
                    <div key={i} className="bg-[#161920]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg">
                                {/* Simple icon mapping based on label for now, or pass from backend if complex */}
                                <BarChart2 className="text-blue-400" />
                            </div>
                            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${m.positive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                                }`}>
                                {m.trend} {m.positive ? <ArrowUpRight size={12} className="ml-1" /> : <ArrowDownRight size={12} className="ml-1" />}
                            </div>
                        </div>
                        <h4 className="text-gray-400 text-sm font-medium">{m.label}</h4>
                        <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-[#161920]/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Agent Productivity (Score vs Calls)</h3>
                        <div className="flex gap-2">
                            <span className="flex items-center text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1" /> Score</span>
                            <span className="flex items-center text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-purple-500 mr-1" /> Calls</span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agentPerf}>
                                <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Status */}
                <div className="bg-[#161920]/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Agent Live Status</h3>
                    <div className="space-y-6">
                        {[
                            { name: 'Sarah Connor', status: 'In Call', time: '14:20', sentiment: 'Positive' },
                            { name: 'John Wick', status: 'Online', time: '--', sentiment: '--' },
                            { name: 'Ellen Ripley', status: 'Wrap Up', time: '02:15', sentiment: 'Neutral' },
                            { name: 'James Bond', status: 'In Call', time: '05:45', sentiment: 'Urgent' },
                        ].map((agent, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${agent.status === 'In Call' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' :
                                        agent.status === 'Online' ? 'bg-green-500' : 'bg-yellow-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-bold text-white">{agent.name}</p>
                                        <p className="text-xs text-gray-500">{agent.status}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-300 font-mono">{agent.time}</p>
                                    <p className={`text-[10px] font-bold uppercase transition-colors ${agent.sentiment === 'Urgent' ? 'text-red-500' :
                                        agent.sentiment === 'Positive' ? 'text-green-500' : 'text-gray-500'
                                        }`}>{agent.sentiment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        View Team Roster
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
