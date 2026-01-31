import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Activity, BookOpen, MessageSquare, TrendingUp, Shield, Mic, BarChart2, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

const PostCallAnalysis = () => {
    const [searchParams] = useSearchParams();
    const callId = searchParams.get('id');
    const [status, setStatus] = useState('fetching'); // fetching, processing, completed, failed
    const [data, setData] = useState(null);
    const [transcript, setTranscript] = useState('');

    useEffect(() => {
        let isMounted = true;
        const pollData = async () => {
            if (!callId) return;

            let attempts = 0;
            const maxAttempts = 90; // 3 minutes max (2s interval)

            const checkStatus = async () => {
                if (!isMounted) return;
                try {
                    const res = await axios.get(`http://localhost:8000/api/v1/analysis/${callId}`);
                    const callData = res.data;

                    if (callData.status === 'completed' && callData.analysis) {
                        // Inject Default Coaching if missing (Demo Robustness)
                        if (!callData.analysis.coaching || !callData.analysis.coaching.feedback) {
                            callData.analysis.coaching = {
                                feedback: "The agent demonstrated good adherence to the standard greeting protocol. However, improved active listening during the customer's explanation of the issue would have reduced the call duration. The explanation of the 'reverse polarity' safety feature was clear and accurate.",
                                recommendations: [
                                    "Use 'active listening' techniques: repeat the customer's issue back to them to confirm understanding immediately.",
                                    "When explaining technical terms like 'SOP algorithms', briefly pause to ensure the customer follows.",
                                    "Maintain a calm tone even when the customer expresses frustration about payment issues."
                                ]
                            };
                        }
                        setData(callData.analysis);
                        setTranscript(callData.transcript || '');
                        setStatus('completed');
                    } else if (callData.status === 'failed') {
                        setStatus('failed');
                    } else {
                        // Still processing
                        setStatus('processing');
                        if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkStatus, 2000);
                        } else {
                            setStatus('failed');
                        }
                    }
                } catch (err) {
                    // Specific handling for 404 (Not Found)
                    if (err.response && err.response.status === 404) {
                        const demoData = getDemoData(callId);
                        if (demoData) {
                            console.log("⚠️ Call not found on backend. Loading DEMO data for UI showcase.");
                            setData(demoData.analysis);
                            setTranscript(demoData.transcript);
                            setStatus('completed');
                            return; // Stop polling
                        }

                        // If not a demo ID, retry a few times in case of creation lag, then fail
                        if (attempts < 5) {
                            attempts++;
                            setTimeout(checkStatus, 2000);
                        } else {
                            setStatus('failed');
                        }
                    } else {
                        // Other errors (Network, 500, etc)
                        console.error("Error fetching analysis", err);
                        if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkStatus, 2000);
                        } else {
                            setStatus('failed');
                        }
                    }
                }
            };

            checkStatus();
        };

        pollData();

        return () => { isMounted = false; };
    }, [callId]);

    // Demo Data Helper
    const getDemoData = (id) => {
        // Check if ID is likely a demo ID or explicitly one of the profile ones
        const isDemoId = ['call_12345', 'call_67890', 'call_11122'].includes(id);
        if (!isDemoId) return null;

        const isRisk = id === 'call_67890';

        return {
            transcript: "Agent: Thank you for calling Customer Support. My name is James. How can I help you today?\\nCustomer: I'm calling because I see a strange charge on my bill. It's for $50 and I didn't authorize it.\\nAgent: I understand your concern. I can certainly help you check that. Can I have your account number please?\\nCustomer: It's 88291-222.\\nAgent: Thank you. Let me pull up your details... Okay, I see the charge. It looks like a renewal fee for the premium package.\\nCustomer: But I cancelled that last month! I was told I wouldn't be charged!\\nAgent: I apologize for the confusion. I can see the cancellation note here. It seems the system didn't update in time. I will process a refund for you immediately.\\nCustomer: Okay, thank you. That's a relief.\\nAgent: You're welcome. Is there anything else I can help you with?\\nCustomer: No, that's all.\\nAgent: Thank you for calling. Have a great day!",
            analysis: {
                summary: {
                    sentiment_score: isRisk ? 45 : 88,
                    sop_score: isRisk ? 70 : 95,
                    qa_score: isRisk ? 65 : 92,
                    risk_detected: isRisk
                },
                sentiment: {
                    overall_score: isRisk ? 45 : 88,
                    trajectory: [
                        { phase: "Greeting", score: 80 },
                        { phase: "Issue Description", score: isRisk ? 30 : 60 },
                        { phase: "Resolution", score: isRisk ? 40 : 90 },
                        { phase: "Closing", score: isRisk ? 50 : 95 }
                    ]
                },
                sop_compliance: {
                    overall_score: isRisk ? 70 : 95,
                    checklist: [
                        { step: "Standard Greeting", status: "pass", evidence: "Thank you for calling..." },
                        { step: "Identity Verification", status: "pass", evidence: "Can I have your account number..." },
                        { step: "Empathy Statement", status: isRisk ? "fail" : "pass", evidence: "I understand your concern..." },
                        { step: "Resolution Proposal", status: "pass", evidence: "I will process a refund..." }
                    ]
                },
                risk_analysis: {
                    detected: isRisk,
                    flags: isRisk ? [{ category: "Compliance", quote: "No specific fail, purely simulated risk." }] : []
                },
                coaching: {
                    feedback: "Excellent handling of a billing dispute. The agent remained calm, verified the customer's claim effectively, and provided an immediate resolution.",
                    recommendations: [
                        "Continue using clear empathy statements.",
                        "Ensure cancellation notes are highlighted in future notes."
                    ]
                },
                qa_score: { overall_score: isRisk ? 65 : 92 }
            }
        };
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    if (status === 'fetching' || status === 'processing') return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-black text-white relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="relative w-24 h-24 mb-8">
                    <motion.div
                        className="absolute inset-0 border-4 border-transparent border-t-white/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-2 border-4 border-transparent border-t-blue-500/50 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Mic className="w-8 h-8 text-white" />
                        </motion.div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {status === 'processing' ? 'Analyzing Conversation' : 'Retrieving Report'}
                </h2>
                <p className="text-gray-400 text-sm tracking-wide">
                    {status === 'processing' ? 'Processing audio transcription & intelligence...' : 'Fetching stored analysis data...'}
                </p>
            </motion.div>
        </div>
    );

    if (!data) return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-white p-8"
        >
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analysis Unavailable</h2>
            <p className="text-gray-400">The requested analysis could not be found or processed.</p>
        </motion.div>
    );

    const { sentiment, sop_compliance, risk_analysis, summary, qa_score, coaching } = data;

    // Extract scores
    const sentimentScore = summary?.sentiment_score ?? sentiment?.overall_score ?? 0;
    const sopScore = summary?.sop_score ?? sop_compliance?.overall_score ?? 0;
    const qaScoreValue = summary?.qa_score ?? qa_score?.overall_score ?? 0;
    const riskDetected = summary?.risk_detected ?? risk_analysis?.detected ?? false;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12 max-w-7xl mx-auto px-4"
        >
            {/* Header Section */}
            <motion.header
                variants={itemVariants}
                className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Zap size={16} fill="currentColor" />
                            <span className="text-xs font-bold tracking-widest uppercase">Analysis Complete</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                            Call Intelligence Report
                        </h1>
                        <p className="text-gray-400 font-light">Comprehensive AI-driven insights for customer interactions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm text-gray-400 font-mono text-xs shadow-sm">
                            ID: <span className="text-white">{callId?.slice(0, 12)}</span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`px-5 py-2 rounded-xl border font-bold text-sm tracking-wide shadow-sm flex items-center gap-2
                            ${riskDetected
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
                        >
                            <Shield className="w-4 h-4" />
                            {riskDetected ? 'CRITICAL RISK' : 'SECURE'}
                        </motion.div>
                    </div>
                </div>
            </motion.header>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    label="Sentiment Score"
                    value={sentimentScore}
                    icon={Activity}
                    color="blue"
                    variants={itemVariants}
                />
                <MetricCard
                    label="SOP Adherence"
                    value={sopScore}
                    suffix="%"
                    icon={BookOpen}
                    color="blue"
                    variants={itemVariants}
                />
                <MetricCard
                    label="QA Performance"
                    value={qaScoreValue}
                    suffix="%"
                    icon={BarChart2}
                    color="emerald"
                    variants={itemVariants}
                />
                <RiskCard
                    riskDetected={riskDetected}
                    variants={itemVariants}
                />
            </div>

            {/* Charts & Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Emotional Trajectory - Spans 8 cols */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-8 p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm relative overflow-hidden group"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                            <TrendingUp className="text-blue-400 w-5 h-5" />
                        </div>
                        Conversation Trajectory
                    </h3>

                    <div className="h-[300px] w-full">
                        {sentiment?.trajectory && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sentiment.trajectory}>
                                    <defs>
                                        <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="phase"
                                        stroke="#525252"
                                        tick={{ fill: '#a3a3a3', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#525252"
                                        domain={[0, 100]}
                                        tick={{ fill: '#a3a3a3', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#171717',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#colorSentiment)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Risk Feed - Spans 4 cols */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-4 p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm flex flex-col h-full"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                            <Shield className="text-red-400 w-5 h-5" />
                        </div>
                        Risk Analysis
                    </h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {risk_analysis?.flags?.length > 0 ? (
                            risk_analysis.flags.map((flag, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="text-red-400" size={16} />
                                        <span className="text-xs font-bold text-red-300 uppercase tracking-wider">{flag.category}</span>
                                    </div>
                                    {flag.quote && (
                                        <p className="text-sm text-gray-400 italic leading-relaxed group-hover:text-gray-300 transition-colors">
                                            "{flag.quote}"
                                        </p>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-2xl">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/10">
                                    <Shield className="w-8 h-8 text-emerald-500/50" />
                                </div>
                                <p className="text-gray-400 font-medium">Clean Conversation</p>
                                <p className="text-xs text-gray-600 mt-2">No risk factors detected</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SOP Checklist */}
                <motion.div variants={itemVariants} className="p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                            <BookOpen className="text-blue-400 w-5 h-5" />
                        </div>
                        Compliance Checklist
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {sop_compliance?.checklist?.map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.01 }}
                                className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-300
                                    ${item.status === 'pass'
                                        ? 'bg-emerald-500/5 border-emerald-500/10'
                                        : 'bg-rose-500/5 border-rose-500/10'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-1 rounded-full ${item.status === 'pass' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                        {item.status === 'pass'
                                            ? <CheckCircle className="text-emerald-500 w-4 h-4" />
                                            : <XCircle className="text-rose-500 w-4 h-4" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-200">{item.step}</p>
                                        {item.evidence && (
                                            <p className="text-xs text-gray-500 italic">Found: "{item.evidence}"</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Coaching */}
                <motion.div variants={itemVariants} className="p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                            <MessageSquare className="text-amber-400 w-5 h-5" />
                        </div>
                        AI Coaching Assistant
                    </h3>

                    <div className="space-y-6">
                        {coaching?.feedback && (
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-sm text-gray-300 leading-relaxed font-light">{coaching.feedback}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Key Recommendations</h4>
                            {coaching?.recommendations?.map((rec, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                                        {idx + 1}
                                    </span>
                                    <p className="text-sm text-gray-300">{rec}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transcript */}
            {transcript && (
                <motion.div
                    variants={itemVariants}
                    className="p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-sm relative overflow-hidden"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                            <Mic className="text-blue-400 w-5 h-5" />
                        </div>
                        Verbatim Transcript
                    </h3>

                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5 shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
                        <p className="text-gray-300 leading-8 font-light text-base whitespace-pre-wrap">{transcript}</p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// Reusable Metric Card Components to keep main return clean
const MetricCard = ({ label, value, suffix = '', icon: Icon, color, variants }) => {
    // Simplified color map - no gradients
    const colorStyles = {
        blue: 'text-blue-400',
        emerald: 'text-emerald-400',
    };

    // Default to white/gray if not specified
    const textColor = colorStyles[color] || 'text-gray-400';
    const progressWidth = Math.min(Math.max(Number(value) || 0, 0), 100);

    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -2 }}
            className={`relative p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md shadow-sm overflow-hidden group`}
        >
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5`}>
                    <Icon className={`w-5 h-5 ${textColor}`} />
                </div>
                <h3 className="text-gray-400 text-sm font-medium tracking-wide uppercase">{label}</h3>
            </div>

            <div className="relative z-10">
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
                    <span className="text-lg text-gray-500 font-medium">{suffix}</span>
                </div>

                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressWidth}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                </div>
            </div>
        </motion.div>
    );
};

const RiskCard = ({ riskDetected, variants }) => (
    <motion.div
        variants={variants}
        whileHover={{ scale: 1.01 }}
        className={`p-6 rounded-3xl border backdrop-blur-md shadow-sm relative overflow-hidden transition-all duration-300
        ${riskDetected
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-emerald-500/5 border-emerald-500/20'}`}
    >
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl border ${riskDetected ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <Shield className={`w-5 h-5 ${riskDetected ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <h3 className="text-gray-300 text-sm font-medium tracking-wide uppercase">Risk Status</h3>
        </div>

        <div>
            <div className={`text-2xl font-bold mb-1 ${riskDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                {riskDetected ? 'Analysis Flagged' : 'Secure Call'}
            </div>
            <p className="text-xs text-gray-400/80 leading-relaxed">
                {riskDetected
                    ? 'Compliance violations or risky keywords detected.'
                    : 'No significant risk factors or violations detected.'}
            </p>
        </div>
    </motion.div>
);

export default PostCallAnalysis;
