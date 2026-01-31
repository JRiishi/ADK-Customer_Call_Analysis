import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/UI'; // Assuming generic card, or I'll inline styles if needed
import { CheckCircle, XCircle, AlertTriangle, Activity, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

const PostCallAnalysis = () => {
    const [searchParams] = useSearchParams();
    const callId = searchParams.get('id');
    const isUpload = searchParams.get('source') === 'upload';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const pollData = async () => {
            if (!callId) return;

            let attempts = 0;
            const maxAttempts = 20; // 40 seconds max (2s interval)

            const checkStatus = async () => {
                if (!isMounted) return;
                try {
                    const res = await axios.get(`http://localhost:8000/api/v1/analysis/${callId}`);
                    const callData = res.data;

                    if (callData.status === 'completed' && callData.analysis) {
                        setData(callData.analysis);
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
        <div className="flex flex-col items-center justify-center h-96 text-white space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 animate-pulse">Analyzing Call Intelligence...</p>
        </div>
    );

    if (!data) return <div className="text-white p-10 text-center">Analysis Not Found</div>;

    const { sentiment, sop_compliance, risk_analysis, summary } = data;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Call Intelligence Report</h1>
                <div className="flex gap-4">
                    <span className="px-4 py-1 rounded-full bg-blue-500/20 text-blue-400 font-mono text-sm border border-blue-500/30">
                        ID: {callId?.slice(0, 8)}
                    </span>
                    <span className={`px-4 py-1 rounded-full border font-bold text-sm uppercase
                        ${summary?.risk_severity === 'high' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-green-500/20 border-green-500 text-green-500'}`}>
                        Risk: {summary?.risk_severity || "None"}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Metrics Cards */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-[#161920]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="text-purple-400" size={20} />
                            <h3 className="text-gray-400 font-medium">Sentiment</h3>
                        </div>
                        <div className="text-4xl font-bold text-white">{summary?.sentiment_score ?? 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Emotional Resonance Score</p>
                    </div>

                    <div className="bg-[#161920]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="text-blue-400" size={20} />
                            <h3 className="text-gray-400 font-medium">SOP Adherence</h3>
                        </div>
                        <div className="text-4xl font-bold text-white">{summary?.sop_score ?? 0}%</div>
                        <p className="text-xs text-gray-500 mt-1">Procedure Compliance</p>
                    </div>
                </div>

                {/* Sentiment Graph */}
                <div className="md:col-span-3 bg-[#161920]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4">Emotional Trajectory</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sentiment?.trajectory || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="phase" stroke="#666" />
                                <YAxis stroke="#666" domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SOP Checklist */}
                <div className="bg-[#161920]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4">SOP Compliance Check</h3>
                    <div className="space-y-4">
                        {sop_compliance?.checklist?.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                                <div className="flex items-center gap-3">
                                    {item.status === 'pass'
                                        ? <CheckCircle className="text-green-500" size={18} />
                                        : <XCircle className="text-red-500" size={18} />}

                                    <div>
                                        <div className="text-sm font-medium text-white">{item.step}</div>
                                        {item.evidence && <div className="text-xs text-gray-500 italic">"{item.evidence}"</div>}
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${item.status === 'pass' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk & Insights */}
                <div className="bg-[#161920]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4">Risk Flags & Insights</h3>
                    {risk_analysis?.flags?.length > 0 ? (
                        <div className="space-y-3">
                            {risk_analysis.flags.map((flag, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="text-red-500 mt-1" size={16} />
                                    <div>
                                        <div className="text-sm font-bold text-red-400">{flag.category} Risk</div>
                                        <div className="text-xs text-red-200/70 mt-1">"{flag.quote}"</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                            No significant risks detected.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCallAnalysis;
