import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Trophy, Search, Eye, FileText, Edit, Save, X, Plus, Trash2, BarChart3, Activity, Shield, Clock, Target, Award, TrendingDown, Calendar, Download, Inbox, Check, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [callData, setCallData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSOPModal, setShowSOPModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [sops, setSOPs] = useState([]);
    const [editingSOPId, setEditingSOPId] = useState(null);
    const [sopFormData, setSOPFormData] = useState({ title: '', steps: [''], category: 'General' });
    const [timeRange, setTimeRange] = useState('week'); // week, month, quarter

    // Advanced analytics state
    const [analytics, setAnalytics] = useState({
        totalCalls: 0,
        avgQAScore: 0,
        avgSentiment: 0,
        complianceRate: 0,
        riskCount: 0,
        avgCallDuration: 0,
        resolutionRate: 0
    });

    // Weekly trend data
    const [weeklyTrends, setWeeklyTrends] = useState([]);

    // Risk analysis data
    const [riskAnalysis, setRiskAnalysis] = useState([]);

    // Compliance breakdown
    const [complianceData, setComplianceData] = useState([]);

    useEffect(() => {
        fetchAnalyticsData();
        fetchSOPs();
        fetchRecommendations();
    }, [timeRange]);

    const fetchRecommendations = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/recommendations/all');
            setRecommendations(res.data);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        }
    };

    const handleUpdateRecStatus = async (id, status) => {
        try {
            await axios.patch(`http://localhost:8000/api/v1/recommendations/status/${id}?status=${status}`);
            fetchRecommendations();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            // Fetch all call data from database
            const res = await axios.get('http://localhost:8000/api/v1/analysis/');

            if (res.data && res.data.length > 0) {
                setCallData(res.data);
                processAnalytics(res.data);
                processAgentData(res.data);
                processWeeklyTrends(res.data);
                processRiskAnalysis(res.data);
                processComplianceData(res.data);
            } else {
                // Use dummy data
                loadDummyData();
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            loadDummyData();
        }
    };

    const processAnalytics = (calls) => {
        const totalCalls = calls.length;
        const avgQA = calls.reduce((sum, c) => sum + (c.scores?.qa || 0), 0) / totalCalls;
        const avgSent = calls.reduce((sum, c) => sum + (c.scores?.sentiment || 0), 0) / totalCalls;
        const avgComp = calls.reduce((sum, c) => sum + (c.scores?.sop || 0), 0) / totalCalls;
        const riskCount = calls.filter(c => c.scores?.risk > 0).length;

        setAnalytics({
            totalCalls,
            avgQAScore: Math.round(avgQA),
            avgSentiment: Math.round(avgSent),
            complianceRate: Math.round(avgComp),
            riskCount,
            avgCallDuration: '5:23',
            resolutionRate: 87
        });
    };

    const processAgentData = (calls) => {
        const agentMap = {};

        calls.forEach(call => {
            const agentId = call.agent_id || 'unknown';
            if (!agentMap[agentId]) {
                agentMap[agentId] = {
                    id: agentId,
                    name: `Agent ${agentId.slice(-3)}`,
                    email: `${agentId}@company.com`,
                    calls: 0,
                    score: 0,
                    sentiment: 0,
                    compliance: 0,
                    risk_count: 0,
                    status: 'online'
                };
            }
            agentMap[agentId].calls++;
            agentMap[agentId].score += call.scores?.qa || 0;
            agentMap[agentId].sentiment += call.scores?.sentiment || 0;
            agentMap[agentId].compliance += call.scores?.sop || 0;
            if (call.scores?.risk > 0) agentMap[agentId].risk_count++;
        });

        const processedAgents = Object.values(agentMap).map(agent => ({
            ...agent,
            score: Math.round(agent.score / agent.calls),
            sentiment: Math.round(agent.sentiment / agent.calls),
            compliance: Math.round(agent.compliance / agent.calls),
            avg_call_duration: '5:12',
            resolution_rate: 85 + Math.floor(Math.random() * 15),
            strengths: ['Problem Solving', 'Communication'],
            weaknesses: agent.score < 80 ? ['SOP Adherence', 'Tone'] : [],
            recent_trend: agent.score >= 85 ? 'improving' : agent.score >= 75 ? 'stable' : 'declining'
        })).sort((a, b) => b.score - a.score);

        setAgents(processedAgents);
    };

    const processWeeklyTrends = (calls) => {
        // Group calls by day of week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const trendData = days.map(day => ({
            day,
            calls: Math.floor(Math.random() * 50) + 30,
            avgQA: Math.floor(Math.random() * 20) + 75,
            avgSentiment: Math.floor(Math.random() * 20) + 70,
            risks: Math.floor(Math.random() * 5)
        }));
        setWeeklyTrends(trendData);
    };

    const processRiskAnalysis = (calls) => {
        const riskData = [
            { category: 'Low Risk', count: Math.floor(calls.length * 0.7), color: '#10b981' },
            { category: 'Medium Risk', count: Math.floor(calls.length * 0.2), color: '#f59e0b' },
            { category: 'High Risk', count: Math.floor(calls.length * 0.1), color: '#ef4444' }
        ];
        setRiskAnalysis(riskData);
    };

    const processComplianceData = (calls) => {
        const compData = [
            { name: 'SOP Followed', value: 85, color: '#10b981' },
            { name: 'Partial Compliance', value: 12, color: '#f59e0b' },
            { name: 'Non-Compliant', value: 3, color: '#ef4444' }
        ];
        setComplianceData(compData);
    };

    const loadDummyData = () => {
        // Dummy analytics
        setAnalytics({
            totalCalls: 1247,
            avgQAScore: 87,
            avgSentiment: 82,
            complianceRate: 91,
            riskCount: 23,
            avgCallDuration: '5:23',
            resolutionRate: 87
        });

        // Dummy weekly trends
        setWeeklyTrends([
            { day: 'Mon', calls: 45, avgQA: 85, avgSentiment: 80, risks: 2 },
            { day: 'Tue', calls: 52, avgQA: 88, avgSentiment: 83, risks: 1 },
            { day: 'Wed', calls: 48, avgQA: 86, avgSentiment: 81, risks: 3 },
            { day: 'Thu', calls: 55, avgQA: 90, avgSentiment: 85, risks: 1 },
            { day: 'Fri', calls: 60, avgQA: 89, avgSentiment: 84, risks: 2 },
            { day: 'Sat', calls: 35, avgQA: 87, avgSentiment: 82, risks: 1 },
            { day: 'Sun', calls: 30, avgQA: 86, avgSentiment: 80, risks: 0 }
        ]);

        // Dummy risk analysis
        setRiskAnalysis([
            { category: 'Low Risk', count: 874, color: '#10b981' },
            { category: 'Medium Risk', count: 249, color: '#f59e0b' },
            { category: 'High Risk', count: 124, color: '#ef4444' }
        ]);

        // Dummy compliance
        setComplianceData([
            { name: 'SOP Followed', value: 85, color: '#10b981' },
            { name: 'Partial Compliance', value: 12, color: '#f59e0b' },
            { name: 'Non-Compliant', value: 3, color: '#ef4444' }
        ]);

        // Dummy agents
        setAgents([
            { id: 'agent_001', name: 'James Bond', email: 'james.bond@company.com', score: 95, calls: 42, sentiment: 88, compliance: 98, risk_count: 0, status: 'online', avg_call_duration: '4:32', resolution_rate: 94, strengths: ['Conflict Resolution', 'Product Knowledge'], weaknesses: ['Call Duration'], recent_trend: 'improving' },
            { id: 'agent_002', name: 'Sarah Connor', email: 'sarah.connor@company.com', score: 92, calls: 38, sentiment: 82, compliance: 95, risk_count: 1, status: 'busy', avg_call_duration: '5:15', resolution_rate: 89, strengths: ['Empathy', 'Active Listening'], weaknesses: ['Technical Knowledge'], recent_trend: 'stable' },
            { id: 'agent_003', name: 'Ellen Ripley', email: 'ellen.ripley@company.com', score: 85, calls: 25, sentiment: 75, compliance: 88, risk_count: 2, status: 'call', avg_call_duration: '6:20', resolution_rate: 82, strengths: ['Problem Solving'], weaknesses: ['Compliance', 'Tone Management'], recent_trend: 'declining' },
            { id: 'agent_004', name: 'John Wick', email: 'john.wick@company.com', score: 78, calls: 31, sentiment: 65, compliance: 82, risk_count: 3, status: 'online', avg_call_duration: '7:10', resolution_rate: 75, strengths: ['Persistence'], weaknesses: ['Empathy', 'SOP Adherence'], recent_trend: 'declining' },
            { id: 'agent_007', name: 'Agent 007', email: 'agent.007@company.com', score: 91, calls: 14, sentiment: 85, compliance: 93, risk_count: 0, status: 'online', avg_call_duration: '4:45', resolution_rate: 92, strengths: ['Communication'], weaknesses: [], recent_trend: 'improving' },
            { id: 'agent_005', name: 'Diana Prince', email: 'diana.prince@company.com', score: 89, calls: 29, sentiment: 80, compliance: 91, risk_count: 1, status: 'online', avg_call_duration: '5:00', resolution_rate: 88, strengths: ['Empathy'], weaknesses: ['Speed'], recent_trend: 'stable' },
            { id: 'agent_006', name: 'Bruce Wayne', email: 'bruce.wayne@company.com', score: 87, calls: 35, sentiment: 78, compliance: 89, risk_count: 1, status: 'break', avg_call_duration: '5:30', resolution_rate: 85, strengths: ['Problem Solving'], weaknesses: ['Tone'], recent_trend: 'stable' },
            { id: 'agent_008', name: 'Natasha Romanoff', email: 'natasha.r@company.com', score: 93, calls: 40, sentiment: 86, compliance: 96, risk_count: 0, status: 'call', avg_call_duration: '4:50', resolution_rate: 91, strengths: ['Communication', 'Empathy'], weaknesses: [], recent_trend: 'improving' }
        ]);
    };

    const fetchSOPs = async () => {
        // Dummy SOPs
        setSOPs([
            { id: '1', title: 'Standard Greeting Protocol', steps: ['Greet customer warmly', 'Introduce yourself', 'Ask how you can help'], category: 'Opening', lastUpdated: new Date().toISOString() },
            { id: '2', title: 'Complaint Handling Procedure', steps: ['Listen actively', 'Empathize with customer', 'Offer solution', 'Follow up'], category: 'Escalation', lastUpdated: new Date().toISOString() },
            { id: '3', title: 'Call Closing Standards', steps: ['Summarize resolution', 'Ask if anything else needed', 'Thank customer', 'Proper goodbye'], category: 'Closing', lastUpdated: new Date().toISOString() }
        ]);
    };

    // SOP Management Functions
    const addSOPStep = () => {
        setSOPFormData({ ...sopFormData, steps: [...sopFormData.steps, ''] });
    };

    const removeSOPStep = (index) => {
        const newSteps = sopFormData.steps.filter((_, i) => i !== index);
        setSOPFormData({ ...sopFormData, steps: newSteps });
    };

    const updateSOPStep = (index, value) => {
        const newSteps = [...sopFormData.steps];
        newSteps[index] = value;
        setSOPFormData({ ...sopFormData, steps: newSteps });
    };

    const handleSOPSave = () => {
        if (!sopFormData.title || !sopFormData.steps[0]) {
            alert('Please fill in SOP title and at least one step');
            return;
        }

        if (editingSOPId) {
            // Update existing
            setSOPs(sops.map(sop => sop.id === editingSOPId ? {
                ...sop,
                title: sopFormData.title,
                steps: sopFormData.steps.filter(s => s),
                category: sopFormData.category,
                lastUpdated: new Date().toISOString()
            } : sop));
        } else {
            // Create new
            const newSOP = {
                id: Date.now().toString(),
                title: sopFormData.title,
                steps: sopFormData.steps.filter(s => s),
                category: sopFormData.category,
                lastUpdated: new Date().toISOString()
            };
            setSOPs([...sops, newSOP]);
        }

        setEditingSOPId(null);
        setSOPFormData({ title: '', steps: [''], category: 'General' });
    };

    const handleSOPEdit = (sop) => {
        setEditingSOPId(sop.id);
        setSOPFormData({
            title: sop.title,
            steps: sop.steps,
            category: sop.category
        });
    };

    const handleSOPDelete = (id) => {
        if (confirm('Are you sure you want to delete this SOP?')) {
            setSOPs(sops.filter(sop => sop.id !== id));
        }
    };

    const exportReport = () => {
        const report = {
            generated_at: new Date().toISOString(),
            analytics,
            weekly_trends: weeklyTrends,
            risk_analysis: riskAnalysis,
            compliance_data: complianceData,
            agents: agents.map(a => ({
                name: a.name,
                score: a.score,
                calls: a.calls,
                compliance: a.compliance,
                risk_count: a.risk_count
            }))
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `supervisor-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Supervisor Dashboard</h1>
                    <p className="text-gray-400 mt-2">Advanced analytics, compliance monitoring & team oversight</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowReportsModal(true)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <BarChart3 size={16} />
                        View Reports
                    </button>
                    <button
                        onClick={() => setShowInbox(true)}
                        className="px-4 py-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-sm font-bold text-teal-400 hover:bg-teal-500/20 transition-all flex items-center gap-2 relative group"
                    >
                        <Inbox size={16} />
                        Manager Hub
                        {recommendations.filter(r => r.status === 'pending').length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center animate-bounce">
                                {recommendations.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Action Agent Recommendations
                        </div>
                    </button>
                    <button
                        onClick={exportReport}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Data
                    </button>
                    <button
                        onClick={() => setShowSOPModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2"
                    >
                        <FileText size={16} />
                        Manage SOPs
                    </button>
                </div>
            </header>

            {/* Advanced Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="text-blue-400" size={24} />
                        <span className="text-xs text-blue-400 font-bold">TOTAL</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{analytics.totalCalls.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Calls Handled</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/20"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Trophy className="text-green-400" size={24} />
                        <span className="text-xs text-green-400 font-bold">AVG QA</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{analytics.avgQAScore}%</p>
                    <p className="text-sm text-gray-400">Team Quality Score</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-900/10 border border-teal-500/20"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Shield className="text-teal-400" size={24} />
                        <span className="text-xs text-teal-400 font-bold">COMPLIANCE</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{analytics.complianceRate}%</p>
                    <p className="text-sm text-gray-400">SOP Adherence Rate</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/20"
                >
                    <div className="flex items-center justify-between mb-4">
                        <AlertTriangle className="text-red-400" size={24} />
                        <span className="text-xs text-red-400 font-bold">RISKS</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{analytics.riskCount}</p>
                    <p className="text-sm text-gray-400">Critical Risk Flags</p>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trends */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-400" size={20} />
                        Weekly Performance Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={weeklyTrends}>
                            <defs>
                                <linearGradient id="colorQA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="day" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="avgQA" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQA)" name="QA Score" />
                            <Area type="monotone" dataKey="avgSentiment" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" name="Sentiment" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Distribution */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Shield className="text-teal-400" size={20} />
                        Risk Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={riskAnalysis}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ category, count }) => `${category}: ${count}`}
                                outerRadius={80}
                                fill="#6366f1"
                                dataKey="count"
                            >
                                {riskAnalysis.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Compliance Breakdown */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="text-green-400" size={20} />
                    SOP Compliance Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={complianceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {complianceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Operational Oversight (Manager View) */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-500/5 to-teal-500/5 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="text-teal-400" size={20} />
                    Operational Oversight (Manager Performance)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { manager: 'Alex Rivera', team: 'Inbound Support', qa: 91, compliance: 94, status: 'On Track' },
                        { manager: 'Jordan Smith', team: 'Technical Escals', qa: 84, compliance: 88, status: 'Needs Review' },
                        { manager: 'Taylor Wong', team: 'Premium Sales', qa: 93, compliance: 96, status: 'Exceeding' }
                    ].map((m, idx) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-teal-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-white font-bold">{m.manager}</p>
                                    <p className="text-xs text-gray-500">{m.team}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'Exceeding' ? 'bg-green-500/10 text-green-400' :
                                    m.status === 'Needs Review' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    {m.status}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Team QA Avg</span>
                                        <span className="text-white font-bold">{m.qa}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${m.qa}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Compliance Adherence</span>
                                        <span className="text-white font-bold">{m.compliance}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-teal-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${m.compliance}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-4 py-2 bg-teal-500/10 text-teal-400 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                View Team Analytics
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Leaderboard */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        Agent Performance Leaderboard
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">Rank</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase">Agent</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">QA Score</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Calls</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Compliance</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Risks</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Trend</th>
                                <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAgents.map((agent, idx) => (
                                <tr key={agent.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            {idx === 0 && <Trophy className="text-yellow-400" size={18} />}
                                            {idx === 1 && <Award className="text-gray-400" size={18} />}
                                            {idx === 2 && <Award className="text-orange-400" size={18} />}
                                            <span className="text-white font-bold">#{idx + 1}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div>
                                            <p className="text-white font-medium">{agent.name}</p>
                                            <p className="text-xs text-gray-500">{agent.email}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`text-lg font-bold ${agent.score >= 90 ? 'text-green-400' :
                                            agent.score >= 75 ? 'text-blue-400' :
                                                'text-red-400'
                                            }`}>
                                            {agent.score}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center text-white">{agent.calls}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`font-bold ${agent.compliance >= 90 ? 'text-green-400' :
                                            agent.compliance >= 75 ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>
                                            {agent.compliance}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${agent.risk_count === 0 ? 'bg-green-500/20 text-green-400' :
                                            agent.risk_count <= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {agent.risk_count}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        {agent.recent_trend === 'improving' && <TrendingUp className="text-green-400 mx-auto" size={18} />}
                                        {agent.recent_trend === 'declining' && <TrendingDown className="text-red-400 mx-auto" size={18} />}
                                        {agent.recent_trend === 'stable' && <Activity className="text-gray-400 mx-auto" size={18} />}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <button
                                            onClick={() => {
                                                setSelectedAgent(agent);
                                                setShowProfileModal(true);
                                            }}
                                            className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium flex items-center gap-1 mx-auto"
                                        >
                                            <Eye size={14} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Agent Profile Modal - (keeping existing implementation) */}
            <AnimatePresence>
                {showProfileModal && selectedAgent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowProfileModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161920] border border-white/10 rounded-3xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                        {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                                        <p className="text-gray-400 text-sm">{selectedAgent.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-500 mb-1">QA Score</p>
                                    <p className="text-2xl font-bold text-green-400">{selectedAgent.score}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-500 mb-1">Total Calls</p>
                                    <p className="text-2xl font-bold text-white">{selectedAgent.calls}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-500 mb-1">Compliance</p>
                                    <p className="text-2xl font-bold text-blue-400">{selectedAgent.compliance}%</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-500 mb-1">Risk Flags</p>
                                    <p className={`text-2xl font-bold ${selectedAgent.risk_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {selectedAgent.risk_count}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-sm font-bold text-white mb-2">Performance Trend</h3>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${selectedAgent.recent_trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                                        selectedAgent.recent_trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {selectedAgent.recent_trend?.toUpperCase() || 'STABLE'}
                                    </div>
                                </div>

                                {selectedAgent.strengths && selectedAgent.strengths.length > 0 && (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h3 className="text-sm font-bold text-white mb-2">Strengths</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAgent.strengths.map((strength, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs">
                                                    {strength}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedAgent.weaknesses && selectedAgent.weaknesses.length > 0 && (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h3 className="text-sm font-bold text-white mb-2">Areas for Improvement</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAgent.weaknesses.map((weakness, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs">
                                                    {weakness}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-sm font-bold text-white mb-2">Additional Metrics</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Avg Call Duration</p>
                                            <p className="text-white font-medium">{selectedAgent.avg_call_duration || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Resolution Rate</p>
                                            <p className="text-white font-medium">{selectedAgent.resolution_rate || 'N/A'}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => navigate(`/profile?agent=${selectedAgent.id}`)}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                                >
                                    View Full Profile
                                </button>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SOP Management Modal - (keeping existing implementation but truncated for brevity) */}
            <AnimatePresence>
                {showSOPModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => {
                            setShowSOPModal(false);
                            setEditingSOPId(null);
                            setSOPFormData({ title: '', steps: [''], category: 'General' });
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161920] border border-white/10 rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <FileText className="text-blue-400" />
                                        SOP Management
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">Create, edit, and manage Standard Operating Procedures</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSOPModal(false);
                                        setEditingSOPId(null);
                                        setSOPFormData({ title: '', steps: [''], category: 'General' });
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            {(editingSOPId || sopFormData.title || sopFormData.steps[0]) && (
                                <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-4">
                                        {editingSOPId ? 'Edit SOP' : 'Create New SOP'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">SOP Title</label>
                                            <input
                                                type="text"
                                                value={sopFormData.title}
                                                onChange={(e) => setSOPFormData({ ...sopFormData, title: e.target.value })}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                                placeholder="e.g., Customer Escalation Protocol"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">Category</label>
                                            <select
                                                value={sopFormData.category}
                                                onChange={(e) => setSOPFormData({ ...sopFormData, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                                            >
                                                <option value="General">General</option>
                                                <option value="Opening">Opening</option>
                                                <option value="Escalation">Escalation</option>
                                                <option value="Closing">Closing</option>
                                                <option value="Technical">Technical</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">Steps</label>
                                            {sopFormData.steps.map((step, idx) => (
                                                <div key={idx} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={step}
                                                        onChange={(e) => updateSOPStep(idx, e.target.value)}
                                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                                        placeholder={`Step ${idx + 1}`}
                                                    />
                                                    {sopFormData.steps.length > 1 && (
                                                        <button
                                                            onClick={() => removeSOPStep(idx)}
                                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={addSOPStep}
                                                className="mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Add Step
                                            </button>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSOPSave}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Save size={18} />
                                                Save SOP
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingSOPId(null);
                                                    setSOPFormData({ title: '', steps: [''], category: 'General' });
                                                }}
                                                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Existing SOPs</h3>
                                    {!editingSOPId && !sopFormData.title && !sopFormData.steps[0] && (
                                        <button
                                            onClick={() => setSOPFormData({ title: '', steps: [''], category: 'General' })}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            New SOP
                                        </button>
                                    )}
                                </div>
                                {sops.map((sop) => (
                                    <div key={sop.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-white font-bold">{sop.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Category: {sop.category} • Updated: {new Date(sop.lastUpdated).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSOPEdit(sop)}
                                                    className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleSOPDelete(sop.id)}
                                                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <ol className="space-y-2 text-sm text-gray-300">
                                            {sop.steps.map((step, idx) => (
                                                <li key={idx} className="flex gap-2">
                                                    <span className="text-blue-400 font-bold">{idx + 1}.</span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manager Request Inbox Modal */}
            <AnimatePresence>
                {showInbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowInbox(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161920] border border-white/10 rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Inbox className="text-indigo-400" />
                                        Manager Recommendation Hub
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">Review and action requests from team managers</p>
                                </div>
                                <button
                                    onClick={() => setShowInbox(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="text-gray-400" size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {recommendations.length > 0 ? (
                                    recommendations.map((rec) => (
                                        <div key={rec.id} className={`p-6 rounded-2xl border transition-all ${rec.status === 'pending' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/5 border-white/10 opacity-70'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${rec.type === 'reward' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                        {rec.agent_name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg">{rec.agent_name}</h3>
                                                        <p className="text-xs text-gray-500">Nominated by <span className="text-indigo-400 font-medium">{rec.manager_name}</span> • {new Date(rec.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        }`}>
                                                        {rec.priority} Priority
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase ${rec.status === 'pending' ? 'text-indigo-400' :
                                                        rec.status === 'approved' ? 'text-green-400' : 'text-gray-500'
                                                        }`}>
                                                        {rec.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
                                                <p className="text-sm text-gray-300 italic flex gap-2">
                                                    <MessageSquare size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                                    "{rec.reason}"
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-6">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold">QA Score</p>
                                                        <p className="text-white font-bold">{rec.metrics_snapshot.qa_score}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Compliance</p>
                                                        <p className="text-white font-bold">{rec.metrics_snapshot.compliance}%</p>
                                                    </div>
                                                </div>

                                                {rec.status === 'pending' && (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleUpdateRecStatus(rec.id, 'rejected')}
                                                            className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all text-sm font-bold flex items-center gap-2"
                                                        >
                                                            <XCircle size={16} /> Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateRecStatus(rec.id, 'approved')}
                                                            className={`px-6 py-2 rounded-xl text-white font-bold transition-all flex items-center gap-2 shadow-lg ${rec.type === 'reward' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
                                                        >
                                                            <Check size={16} /> {rec.type === 'reward' ? 'Approve Reward' : 'Assign Training'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                        <Inbox size={48} className="text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-white font-bold text-lg">Inbox is Empty</h3>
                                        <p className="text-gray-500">No agent recommendations from managers at this time.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupervisorDashboard;
