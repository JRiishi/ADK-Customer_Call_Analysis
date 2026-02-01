import React, { useEffect, useState } from 'react';
import { User, Smartphone, Zap, Star, Shield, Clock, TrendingUp, Calendar, ArrowUpRight, Search, ChevronRight, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AgentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [buddyInfo, setBuddyInfo] = useState(null);
    const agentId = "agent_007"; // Hardcoded for demo/MVP
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/v1/agent/profile/${agentId}`);
                if (res.data) {
                    setProfile(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch agent profile", err);
                // Fallback / Demo Data
                setProfile({
                    agent: {
                        name: "James Bond",
                        id: agentId,
                        department: "Special Operations",
                        joined_at: "2023-11-01"
                    },
                    stats: {
                        total_calls: 142,
                        avg_sentiment: 88,
                        avg_sop: 92,
                        avg_qa: 95,
                        risk_rate: 2.1,
                        total_hours: 48.5
                    },
                    recent_history: [
                        { date: 'Mon', score: 85, sentiment: 80 },
                        { date: 'Tue', score: 88, sentiment: 82 },
                        { date: 'Wed', score: 92, sentiment: 88 },
                        { date: 'Thu', score: 90, sentiment: 85 },
                        { date: 'Fri', score: 95, sentiment: 92 },
                    ],
                    call_history: [
                        { id: "call_12345", started_at: "2024-05-15T10:30:00", duration: 320, sentiment_score: 88, qa_score: 95, risk_detected: false },
                        { id: "call_67890", started_at: "2024-05-14T14:15:00", duration: 180, sentiment_score: 45, qa_score: 70, risk_detected: true },
                        { id: "call_11122", started_at: "2024-05-14T09:00:00", duration: 600, sentiment_score: 92, qa_score: 98, risk_detected: false },
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();

        // Fetch buddy information
        const fetchBuddyInfo = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/v1/buddy/agent/${agentId}`);
                if (res.data) {
                    setBuddyInfo(res.data);
                }
            } catch (err) {
                console.warn("No buddy info available", err);
            }
        };
        fetchBuddyInfo();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] text-gray-500">
            Loading Profile...
        </div>
    );

    // Filter Logic
    const filteredCalls = profile?.call_history?.filter(call =>
        call.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.started_at && call.started_at.includes(searchTerm))
    ) || [];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12 max-w-7xl mx-auto px-4"
        >
            {/* Header / Profile Card */}
            <motion.header variants={itemVariants} className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-white/10 flex items-center justify-center shadow-lg">
                        <User size={40} className="text-blue-300" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.agent.name}</h1>
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                {profile.agent.department}
                            </span>
                        </div>
                        <p className="text-gray-400 font-mono text-sm mb-4">ID: <span className="text-gray-300">{profile.agent.id}</span></p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                <Calendar size={14} /> Joined: {new Date(profile.agent.joined_at).toLocaleDateString()}
                            </div>

                            {buddyInfo?.has_buddy && buddyInfo.buddy_info && (
                                <div className="flex items-center gap-2 text-sm bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl">
                                    <UserPlus size={14} className="text-cyan-400" />
                                    <span className="text-gray-400">Buddy:</span>
                                    <span className="text-cyan-400 font-medium">{buddyInfo.buddy_info.mentor_name}</span>
                                </div>
                            )}

                            {buddyInfo?.is_mentoring && buddyInfo.mentees.length > 0 && (
                                <div className="flex items-center gap-2 text-sm bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
                                    <Star size={14} className="text-indigo-400" />
                                    <span className="text-gray-400">Mentoring:</span>
                                    <span className="text-indigo-400 font-medium">{buddyInfo.mentees.length} agent(s)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center w-32">
                            <p className="text-2xl font-bold text-white mb-1">{profile.stats.total_calls}</p>
                            <p className="text-xs text-gray-400 font-bold uppercase">Total Calls</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center w-32">
                            <p className="text-2xl font-bold text-emerald-400 mb-1">{profile.stats.avg_qa}%</p>
                            <p className="text-xs text-gray-400 font-bold uppercase">Avg QA Score</p>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Smartphone}
                    label="Total Hours"
                    value={`${profile.stats.total_hours}h`}
                    sub="Talk Time"
                    color="blue"
                    variants={itemVariants}
                />
                <StatCard
                    icon={Star}
                    label="Avg Sentiment"
                    value={profile.stats.avg_sentiment}
                    sub="/ 100 Score"
                    color="emerald"
                    variants={itemVariants}
                />
                <StatCard
                    icon={Shield}
                    label="SOP Compliance"
                    value={`${profile.stats.avg_sop}%`}
                    sub="Adherence Rate"
                    color="emerald"
                    variants={itemVariants}
                />
                <StatCard
                    icon={Zap}
                    label="Risk Rate"
                    value={`${profile.stats.risk_rate}%`}
                    sub="Critical Flags"
                    color="red" // Using red for risk
                    variants={itemVariants}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart - Span 2 */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-blue-400" size={20} /> Performance Trend
                        </h3>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-gray-300 outline-none">
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profile.recent_history}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#525252"
                                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#171717',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Call History / Search - Span 1 */}
                <motion.div
                    variants={itemVariants}
                    className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-[400px]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock className="text-emerald-400" size={20} /> Call History
                        </h3>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search Call ID or Date..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {filteredCalls.length > 0 ? (
                            filteredCalls.map((call, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate(`/analysis?id=${call.id}`)}
                                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/20 cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-mono text-blue-400 group-hover:text-blue-300">
                                            {call.id.slice(0, 12)}...
                                        </p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${call.risk_detected ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'}`}>
                                            {call.risk_detected ? 'RISK' : 'SAFE'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm font-bold text-white">{new Date(call.started_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(call.started_at).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                                            Score: <span className={call.qa_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{call.qa_score}%</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No calls found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, color, variants }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    // Fallback for unexpected colors
    const activeColor = colors[color] || colors.blue;
    const iconColor = activeColor.split(' ')[0]; // Extract text class

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -2 }}
            className="p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm group hover:border-white/20 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${activeColor} bg-opacity-50`}>
                    <Icon size={20} className={iconColor} />
                </div>
                {color === 'green' && <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">+2.4% <ArrowUpRight size={10} /></div>}
            </div>
            <div>
                <p className="text-3xl font-bold text-white tracking-tight mb-1">{value}</p>
                <div className="flex justify-between items-end">
                    <p className="text-sm text-gray-400 font-medium">{label}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{sub}</p>
                </div>
            </div>
        </motion.div>
    )
}

export default AgentProfile;
