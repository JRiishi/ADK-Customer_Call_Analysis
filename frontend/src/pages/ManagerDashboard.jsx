import React, { useState, useEffect } from 'react';
import { Users, BarChart2, TrendingUp, AlertCircle, Search, UserPlus, Eye, Sparkles, ArrowUpRight, ArrowDownRight, X, Download, BookOpen, CheckCircle, Award, ShieldAlert, MessageSquare, Send } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [buddyRecommendations, setBuddyRecommendations] = useState([]);
    const [showBuddyModal, setShowBuddyModal] = useState(false);
    const [buddyPairs, setBuddyPairs] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showWeeklyReports, setShowWeeklyReports] = useState(false);
    const [weeklyData, setWeeklyData] = useState([]);
    const [showRecommendationModal, setShowRecommendationModal] = useState(false);
    const [recommendationType, setRecommendationType] = useState('reward');
    const [recommendationReason, setRecommendationReason] = useState('');
    const [recommendationPriority, setRecommendationPriority] = useState('medium');

    const [metrics, setMetrics] = useState([
        { label: 'Team QA Avg', value: '88.4%', trend: '+3.2%', positive: true },
        { label: 'Active Agents', value: '12 / 15', trend: 'Stable', positive: true },
        { label: 'Compliance Rate', value: '94.1%', trend: '-0.5%', positive: false },
        { label: 'Critical Risks', value: '2', trend: '-1', positive: true },
    ]);

    // Dummy agent data with realistic profiles
    const dummyAgents = [
        { id: 'agent_001', name: 'James Bond', email: 'james.bond@company.com', qa_score: 95, calls_today: 42, avg_sentiment: 88, compliance: 98, risk_count: 0, status: 'In Call', performance_trend: 'up' },
        { id: 'agent_002', name: 'Sarah Connor', email: 'sarah.connor@company.com', qa_score: 92, calls_today: 38, avg_sentiment: 82, compliance: 95, risk_count: 1, status: 'Online', performance_trend: 'up' },
        { id: 'agent_003', name: 'Ellen Ripley', email: 'ellen.ripley@company.com', qa_score: 85, calls_today: 25, avg_sentiment: 75, compliance: 88, risk_count: 2, status: 'Wrap Up', performance_trend: 'down' },
        { id: 'agent_004', name: 'John Wick', email: 'john.wick@company.com', qa_score: 78, calls_today: 31, avg_sentiment: 65, compliance: 82, risk_count: 3, status: 'Online', performance_trend: 'down' },
        { id: 'agent_007', name: 'Agent 007', email: 'agent.007@company.com', qa_score: 91, calls_today: 14, avg_sentiment: 85, compliance: 93, risk_count: 0, status: 'In Call', performance_trend: 'stable' },
        { id: 'agent_005', name: 'Diana Prince', email: 'diana.prince@company.com', qa_score: 89, calls_today: 29, avg_sentiment: 80, compliance: 91, risk_count: 1, status: 'Online', performance_trend: 'up' },
        { id: 'agent_006', name: 'Bruce Wayne', email: 'bruce.wayne@company.com', qa_score: 87, calls_today: 35, avg_sentiment: 78, compliance: 89, risk_count: 1, status: 'Break', performance_trend: 'stable' },
        { id: 'agent_008', name: 'Natasha Romanoff', email: 'natasha.r@company.com', qa_score: 93, calls_today: 40, avg_sentiment: 86, compliance: 96, risk_count: 0, status: 'In Call', performance_trend: 'up' },
        { id: 'agent_009', name: 'Tony Stark', email: 'tony.stark@company.com', qa_score: 81, calls_today: 22, avg_sentiment: 70, compliance: 85, risk_count: 2, status: 'Online', performance_trend: 'down' },
        { id: 'agent_010', name: 'Peter Parker', email: 'peter.parker@company.com', qa_score: 76, calls_today: 18, avg_sentiment: 68, compliance: 80, risk_count: 4, status: 'Training', performance_trend: 'down' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/analysis/');
                // Process real data if available
                if (res.data && res.data.length > 0) {
                    // Map backend data to agent profiles
                    const agentMap = {};
                    res.data.forEach(call => {
                        const agentId = call.agent_id || 'unknown';
                        if (!agentMap[agentId]) {
                            agentMap[agentId] = {
                                id: agentId,
                                name: `Agent ${agentId.slice(-3)}`,
                                calls_today: 0,
                                qa_score: 0,
                                avg_sentiment: 0,
                                compliance: 0,
                                risk_count: 0
                            };
                        }
                        agentMap[agentId].calls_today++;
                        agentMap[agentId].qa_score += call.scores?.qa || 0;
                        agentMap[agentId].avg_sentiment += call.scores?.sentiment || 0;
                        agentMap[agentId].compliance += call.scores?.sop || 0;
                        if (call.scores?.risk > 0) agentMap[agentId].risk_count++;
                    });

                    const processedAgents = Object.values(agentMap).map(agent => ({
                        ...agent,
                        qa_score: Math.round(agent.qa_score / agent.calls_today),
                        avg_sentiment: Math.round(agent.avg_sentiment / agent.calls_today),
                        compliance: Math.round(agent.compliance / agent.calls_today),
                        status: 'Online',
                        performance_trend: 'stable'
                    }));

                    // Fetch buddy information for each agent
                    const agentsWithBuddies = await Promise.all(
                        processedAgents.map(async (agent) => {
                            try {
                                const buddyRes = await axios.get(`http://localhost:8000/api/v1/buddy/agent/${agent.id}`);
                                if (buddyRes.data.has_buddy && buddyRes.data.buddy_info) {
                                    return {
                                        ...agent,
                                        buddy_id: buddyRes.data.buddy_info.mentor_id,
                                        buddy_name: buddyRes.data.buddy_info.mentor_name
                                    };
                                }
                            } catch (err) {
                                console.warn(`No buddy info for ${agent.id}`);
                            }
                            return agent;
                        })
                    );

                    setAgents(agentsWithBuddies.length > 0 ? agentsWithBuddies : dummyAgents);
                    fetchWeeklyAnalytics(agentsWithBuddies.length > 0 ? agentsWithBuddies : dummyAgents);
                } else {
                    setAgents(dummyAgents);
                    fetchWeeklyAnalytics(dummyAgents);
                }
            } catch (err) {
                console.warn("Using dummy agent data", err);
                setAgents(dummyAgents);
                fetchWeeklyAnalytics(dummyAgents);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // AI-Powered Buddy Recommendation System
    const generateBuddyRecommendations = (agent) => {
        // Find agents with similar patterns but better performance
        const recommendations = agents
            .filter(a => a.id !== agent.id)
            .map(potential => {
                // Calculate similarity score based on call patterns and behavior
                const callSimilarity = 1 - Math.abs(agent.calls_today - potential.calls_today) / 50;
                const sentimentSimilarity = 1 - Math.abs(agent.avg_sentiment - potential.avg_sentiment) / 100;
                const performanceGap = potential.qa_score - agent.qa_score;

                // Ideal buddy: similar patterns, better performance
                const buddyScore = (callSimilarity * 0.3 + sentimentSimilarity * 0.3 + (performanceGap > 0 ? performanceGap / 100 : 0) * 0.4);

                return {
                    ...potential,
                    buddyScore: buddyScore,
                    reason: performanceGap > 10
                        ? `${potential.name} has similar call patterns but ${performanceGap}% higher QA score`
                        : performanceGap > 5
                            ? `${potential.name} shows consistent performance in similar scenarios`
                            : `${potential.name} has complementary strengths in compliance`
                };
            })
            .filter(a => a.buddyScore > 0.3 && a.qa_score > agent.qa_score)
            .sort((a, b) => b.buddyScore - a.buddyScore)
            .slice(0, 3);

        setBuddyRecommendations(recommendations);
        setShowBuddyModal(true);
    };

    const handleExportReport = () => {
        // Generate CSV report
        const csvData = agents.map(agent => ({
            Name: agent.name,
            Email: agent.email || `${agent.id}@company.com`,
            'QA Score': agent.qa_score,
            'Calls Today': agent.calls_today,
            'Compliance': agent.compliance,
            'Risk Count': agent.risk_count,
            'Status': agent.status
        }));

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        showToastNotification('Report exported successfully!');
    };

    const handleAssignTraining = () => {
        // Find agents who need training (QA score < 80)
        const needsTraining = agents.filter(a => a.qa_score < 80);
        if (needsTraining.length > 0) {
            showToastNotification(`Training assigned to ${needsTraining.length} agent(s) who need improvement`);
        } else {
            showToastNotification('All agents are performing well! No training needed.');
        }
    };

    const handleBuddyAssignment = async (buddy) => {
        try {
            // Save to database via API
            const response = await axios.post('http://localhost:8000/api/v1/buddy/assign', {
                mentee_id: selectedAgent.id,
                mentor_id: buddy.id,
                mentee_name: selectedAgent.name,
                mentor_name: buddy.name,
                notes: `AI-recommended buddy pairing based on performance analysis`
            });

            // Update local state
            const newPair = {
                mentee: selectedAgent.name,
                mentor: buddy.name,
                assignedAt: new Date().toISOString()
            };
            setBuddyPairs([...buddyPairs, newPair]);

            // Update agent's buddy status in local state
            setAgents(agents.map(a =>
                a.id === selectedAgent.id
                    ? { ...a, buddy_id: buddy.id, buddy_name: buddy.name }
                    : a
            ));

            showToastNotification(`✅ ${buddy.name} assigned as buddy to ${selectedAgent.name}`);
            setShowBuddyModal(false);
        } catch (error) {
            console.error('Error assigning buddy:', error);
            showToastNotification('❌ Failed to assign buddy. Please try again.');
        }
    };

    const handleRecommendationSubmit = async () => {
        try {
            await axios.post('http://localhost:8000/api/v1/recommendations/send', {
                agent_id: selectedAgent.id,
                agent_name: selectedAgent.name,
                manager_id: 'mgr_001', // Mock manager ID
                manager_name: 'Alex Rivera', // Mock manager name
                type: recommendationType,
                priority: recommendationPriority,
                reason: recommendationReason,
                metrics_snapshot: {
                    qa_score: selectedAgent.qa_score,
                    compliance: selectedAgent.compliance,
                    sentiment: selectedAgent.avg_sentiment
                }
            });
            showToastNotification(`✅ Recommendation for ${selectedAgent.name} sent to Supervisor`);
            setShowRecommendationModal(false);
            setRecommendationReason('');
        } catch (error) {
            console.error('Error sending recommendation:', error);
            showToastNotification('❌ Failed to send recommendation.');
        }
    };

    const fetchWeeklyAnalytics = (agentsData) => {
        // Generate mock weekly data based on current agents
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const weekly = agentsData.map(agent => ({
            name: agent.name,
            id: agent.id,
            daily: days.map(day => ({
                day,
                score: Math.max(60, Math.min(100, agent.qa_score + (Math.random() * 20 - 10))),
                sentiment: Math.max(60, Math.min(100, agent.avg_sentiment + (Math.random() * 20 - 10))),
                calls: Math.floor(Math.random() * 10 + 20)
            })),
            weeklyAvg: agent.qa_score,
            improvement: (Math.random() * 10 - 2).toFixed(1)
        }));
        setWeeklyData(weekly);
    };

    const showToastNotification = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Manager Dashboard</h1>
                    <p className="text-gray-400 mt-2">Team-wide performance & AI-powered insights.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Report
                    </button>
                    <button
                        onClick={() => setShowWeeklyReports(true)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <TrendingUp size={16} className="text-cyan-400" />
                        Weekly Analysis
                    </button>
                    <button
                        onClick={handleAssignTraining}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2"
                    >
                        <BookOpen size={16} />
                        Assign Training
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-[#161920]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg">
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

            {/* Agent Search & List */}
            <div className="bg-[#161920]/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Team Roster</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {filteredAgents.map((agent) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {agent.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{agent.name}</p>
                                    <p className="text-xs text-gray-500">{agent.email || `${agent.id}@company.com`}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">QA Score</p>
                                    <p className={`text-lg font-bold ${agent.qa_score >= 90 ? 'text-green-400' : agent.qa_score >= 75 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {agent.qa_score}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Calls</p>
                                    <p className="text-lg font-bold text-white">{agent.calls_today}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Status</p>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${agent.status === 'In Call' ? 'bg-red-500 animate-pulse' :
                                            agent.status === 'Online' ? 'bg-green-500' : 'bg-yellow-500'
                                            }`} />
                                        <p className="text-xs text-gray-400">{agent.status}</p>
                                    </div>
                                </div>

                                {agent.buddy_name && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Buddy</p>
                                        <div className="flex items-center gap-1">
                                            <UserPlus size={12} className="text-cyan-400" />
                                            <p className="text-xs text-cyan-400 font-medium">{agent.buddy_name}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => navigate(`/profile?agent=${agent.id}`)}
                                        className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                                        title="View Profile"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            setRecommendationType(agent.qa_score >= 90 ? 'reward' : 'training');
                                            setShowRecommendationModal(true);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${agent.qa_score >= 90 ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                                        title={agent.qa_score >= 90 ? "Recommend Reward" : "Request Training"}
                                    >
                                        {agent.qa_score >= 90 ? <Award size={16} /> : <ShieldAlert size={16} />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            generateBuddyRecommendations(agent);
                                        }}
                                        className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
                                        title="AI Buddy Match"
                                    >
                                        <Sparkles size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Buddy Recommendation Modal */}
            <AnimatePresence>
                {showBuddyModal && selectedAgent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowBuddyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161920] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Sparkles className="text-cyan-400" />
                                        AI Buddy Recommendations
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">For {selectedAgent.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowBuddyModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            {buddyRecommendations.length > 0 ? (
                                <div className="space-y-4">
                                    {buddyRecommendations.map((buddy, idx) => (
                                        <div
                                            key={buddy.id}
                                            className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                        {buddy.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{buddy.name}</p>
                                                        <p className="text-xs text-gray-500">Match Score: {(buddy.buddyScore * 100).toFixed(0)}%</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 text-center">
                                                    <div>
                                                        <p className="text-xs text-gray-500">QA</p>
                                                        <p className="text-sm font-bold text-green-400">{buddy.qa_score}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Calls</p>
                                                        <p className="text-sm font-bold text-white">{buddy.calls_today}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">{buddy.reason}</p>
                                            <button
                                                onClick={() => handleBuddyAssignment(buddy)}
                                                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <UserPlus size={16} />
                                                Assign as Buddy
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No suitable buddy matches found at this time.</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-500/50">
                            <CheckCircle size={20} />
                            <p className="font-medium">{toastMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Weekly Performance Analysis Modal */}
            <AnimatePresence>
                {showWeeklyReports && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowWeeklyReports(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161920] border border-white/10 rounded-3xl p-8 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <BarChart2 className="text-cyan-400" />
                                        Weekly Performance Analysis
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">Deep dive into team trends and individual performance spikes</p>
                                </div>
                                <button
                                    onClick={() => setShowWeeklyReports(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Team QA Score Trend (Last 5 Days)</h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { day: 'Mon', score: 82 },
                                                { day: 'Tue', score: 85 },
                                                { day: 'Wed', score: 84 },
                                                { day: 'Thu', score: 88 },
                                                { day: 'Fri', score: 89 },
                                            ]}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                <XAxis dataKey="day" stroke="#6b7280" />
                                                <YAxis stroke="#6b7280" domain={[0, 100]} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                                                />
                                                <Area type="monotone" dataKey="score" stroke="#22d3ee" fillOpacity={1} fill="url(#colorScore)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Top Improvers</h3>
                                    <div className="space-y-4">
                                        {weeklyData.slice(0, 4).map((data, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                        {data.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{data.name}</p>
                                                        <p className="text-[10px] text-gray-500">QA Score: {data.weeklyAvg}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                                    <ArrowUpRight size={14} />
                                                    {data.improvement}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Individual Analysis Reports</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase">Agent</th>
                                                <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase">Mon</th>
                                                <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase">Tue</th>
                                                <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase">Wed</th>
                                                <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase">Thu</th>
                                                <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase">Fri</th>
                                                <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {weeklyData.map((data, idx) => (
                                                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                    <td className="py-4 px-4">
                                                        <p className="text-white font-medium">{data.name}</p>
                                                        <p className="text-[10px] text-gray-500">Weekly Avg: {data.weeklyAvg}%</p>
                                                    </td>
                                                    {data.daily.map((day, dIdx) => (
                                                        <td key={dIdx} className="py-4 px-4 text-center">
                                                            <div className={`text-xs font-bold ${day.score >= 90 ? 'text-green-400' :
                                                                day.score >= 80 ? 'text-blue-400' : 'text-red-400'
                                                                }`}>
                                                                {Math.round(day.score)}
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="py-4 px-4 text-right">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${parseFloat(data.improvement) > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {parseFloat(data.improvement) > 0 ? 'Improving' : 'Declining'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manager Action Recommendation Modal */}
            <AnimatePresence>
                {showRecommendationModal && selectedAgent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowRecommendationModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161920] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <MessageSquare className="text-blue-400" />
                                        Recommend Action
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">Nominate {selectedAgent.name} for recognition or support</p>
                                </div>
                                <button
                                    onClick={() => setShowRecommendationModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Action Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setRecommendationType('reward')}
                                            className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${recommendationType === 'reward' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                        >
                                            <Award size={20} />
                                            <span className="text-xs font-bold">Reward & Recognition</span>
                                        </button>
                                        <button
                                            onClick={() => setRecommendationType('training')}
                                            className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${recommendationType === 'training' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                        >
                                            <ShieldAlert size={20} />
                                            <span className="text-xs font-bold">Additional Training</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Priority Level</label>
                                    <select
                                        value={recommendationPriority}
                                        onChange={(e) => setRecommendationPriority(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
                                    >
                                        <option value="low">Low - Routine Update</option>
                                        <option value="medium">Medium - Action Recommended</option>
                                        <option value="high">High - Immediate Attention</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Justification / Reason</label>
                                    <textarea
                                        value={recommendationReason}
                                        onChange={(e) => setRecommendationReason(e.target.value)}
                                        placeholder="Explain why this action is recommended... (e.g., exceptional handling of complex case, or repeated SOP compliance gaps)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 min-h-[120px] resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleRecommendationSubmit}
                                    disabled={!recommendationReason}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    Submit to Supervisor
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManagerDashboard;
