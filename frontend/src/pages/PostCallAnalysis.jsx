import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Activity, BookOpen, MessageSquare, TrendingUp, Shield, Mic } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import axios from 'axios';

const PostCallAnalysis = () => {
    const [searchParams] = useSearchParams();
    const callId = searchParams.get('id');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transcript, setTranscript] = useState('');

    useEffect(() => {
        let isMounted = true;
        const pollData = async () => {
            if (!callId) return;

            let attempts = 0;
            const maxAttempts = 90; // 3 minutes max (2s interval) for longer audio files

            const checkStatus = async () => {
                if (!isMounted) return;
                try {
                    const res = await axios.get(`http://localhost:8000/api/v1/analysis/${callId}`);
                    const callData = res.data;

                    if (callData.status === 'completed' && callData.analysis) {
                        setData(callData.analysis);
                        setTranscript(callData.transcript || '');
                        setLoading(false);
                    } else if (callData.status === 'failed') {
                        setLoading(false);
                        console.error("Analysis failed on backend", callData.error);
                    } else {
                        // Still processing, poll again
                        if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkStatus, 2000);
                        } else {
                            setLoading(false); // Timeout
                        }
                    }
                } catch (err) {
                    console.error("Error fetching analysis", err);
                    // If 404, maybe it's not created yet? Wait a bit.
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkStatus, 2000);
                    } else {
                        setLoading(false);
                    }
                }
            };

            checkStatus();
        };

        pollData();

        return () => { isMounted = false; };
    }, [callId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 text-white space-y-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Mic className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-white">Analyzing Call Intelligence...</p>
                <p className="text-gray-500 text-sm">Processing audio transcription and AI analysis</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-96 text-white space-y-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500" />
            <p className="text-xl font-semibold">Analysis Not Found</p>
            <p className="text-gray-500 text-sm">The analysis may still be processing or the call ID is invalid.</p>
        </div>
    );

    const { sentiment, sop_compliance, risk_analysis, summary, qa_score, coaching } = data;

    // Extract scores with fallbacks
    const sentimentScore = summary?.sentiment_score ?? sentiment?.overall_score ?? 0;
    const sopScore = summary?.sop_score ?? sop_compliance?.overall_score ?? 0;
    const qaScoreValue = summary?.qa_score ?? qa_score?.overall_score ?? 0;
    const riskDetected = summary?.risk_detected ?? risk_analysis?.detected ?? false;

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Call Intelligence Report</h1>
                        <p className="text-gray-400 mt-1">AI-powered analysis of customer conversation</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-mono text-sm border border-purple-500/30">
                            ID: {callId?.slice(0, 12)}
                        </span>
                        <span className={`px-4 py-2 rounded-xl border font-bold text-sm uppercase flex items-center gap-2
                            ${riskDetected ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-green-500/20 border-green-500/40 text-green-400'}`}>
                            <Shield className="w-4 h-4" />
                            {riskDetected ? 'Risk Detected' : 'No Risk'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sentiment Score */}
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-sm group hover:border-purple-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Activity className="text-purple-400 w-5 h-5" />
                        </div>
                        <h3 className="text-gray-300 font-medium">Sentiment</h3>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{sentimentScore}</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000"
                                style={{ width: `${sentimentScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">/ 100</span>
                    </div>
                </div>

                {/* SOP Score */}
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 p-6 rounded-2xl border border-blue-500/20 backdrop-blur-sm group hover:border-blue-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <BookOpen className="text-blue-400 w-5 h-5" />
                        </div>
                        <h3 className="text-gray-300 font-medium">SOP Compliance</h3>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{sopScore}%</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                                style={{ width: `${sopScore}%` }} />
                        </div>
                    </div>
                </div>

                {/* QA Score */}
                <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 p-6 rounded-2xl border border-green-500/20 backdrop-blur-sm group hover:border-green-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <TrendingUp className="text-green-400 w-5 h-5" />
                        </div>
                        <h3 className="text-gray-300 font-medium">QA Score</h3>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">{qaScoreValue}</div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
                                style={{ width: `${qaScoreValue}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">/ 100</span>
                    </div>
                </div>

                {/* Risk Level */}
                <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all ${riskDetected
                        ? 'bg-gradient-to-br from-red-900/30 to-red-800/10 border-red-500/20 hover:border-red-500/40'
                        : 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${riskDetected ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                            <Shield className={`w-5 h-5 ${riskDetected ? 'text-red-400' : 'text-emerald-400'}`} />
                        </div>
                        <h3 className="text-gray-300 font-medium">Risk Status</h3>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${riskDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                        {riskDetected ? 'HIGH RISK' : 'LOW RISK'}
                    </div>
                    <p className="text-xs text-gray-500">
                        {riskDetected ? 'Immediate attention required' : 'Conversation within guidelines'}
                    </p>
                </div>
            </div>

            {/* Sentiment Graph */}
            {sentiment?.trajectory && sentiment.trajectory.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Activity className="text-purple-400" />
                        Emotional Trajectory
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sentiment.trajectory}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="phase" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                                <YAxis stroke="#666" domain={[0, 100]} tick={{ fill: '#999', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SOP Checklist */}
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <BookOpen className="text-blue-400" />
                        SOP Compliance Checklist
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {sop_compliance?.checklist?.map((item, idx) => (
                            <div key={idx} className={`flex items-start justify-between p-4 rounded-xl transition-all ${item.status === 'pass'
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                                }`}>
                                <div className="flex items-start gap-3">
                                    {item.status === 'pass'
                                        ? <CheckCircle className="text-green-500 mt-0.5" size={20} />
                                        : <XCircle className="text-red-500 mt-0.5" size={20} />}
                                    <div>
                                        <div className="text-sm font-medium text-white">{item.step}</div>
                                        {item.evidence && (
                                            <div className="text-xs text-gray-400 italic mt-1 line-clamp-2">"{item.evidence}"</div>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold ${item.status === 'pass'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                        )) || (
                                <div className="text-center text-gray-500 py-8">No SOP data available</div>
                            )}
                    </div>
                </div>

                {/* Risk Flags */}
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <AlertTriangle className="text-orange-400" />
                        Risk Flags & Insights
                    </h3>
                    {risk_analysis?.flags?.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {risk_analysis.flags.map((flag, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="text-red-400 mt-1 flex-shrink-0" size={18} />
                                    <div>
                                        <div className="text-sm font-bold text-red-300">{flag.category} Risk</div>
                                        {flag.quote && (
                                            <div className="text-xs text-red-200/70 mt-1 italic">"{flag.quote}"</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <Shield className="w-12 h-12 text-green-500/40 mb-3" />
                            <p className="text-gray-400">No significant risks detected</p>
                            <p className="text-xs text-gray-600 mt-1">Conversation followed guidelines</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Coaching Recommendations */}
            {coaching && (coaching.recommendations?.length > 0 || coaching.feedback) && (
                <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <MessageSquare className="text-amber-400" />
                        Coaching Recommendations
                    </h3>
                    {coaching.feedback && (
                        <p className="text-gray-300 mb-4">{coaching.feedback}</p>
                    )}
                    {coaching.recommendations?.length > 0 && (
                        <div className="grid gap-3">
                            {coaching.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <span className="flex-shrink-0 w-6 h-6 bg-amber-500/30 rounded-full flex items-center justify-center text-amber-300 text-sm font-bold">
                                        {idx + 1}
                                    </span>
                                    <p className="text-gray-300 text-sm">{rec}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Transcript */}
            {transcript && (
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Mic className="text-purple-400" />
                        Call Transcript
                    </h3>
                    <div className="bg-black/30 p-4 rounded-xl max-h-64 overflow-y-auto custom-scrollbar">
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCallAnalysis;
