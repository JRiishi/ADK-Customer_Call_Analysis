import React from 'react';
import { Card, Badge } from './UI';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SuggestionItem = ({ suggestion }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-obsidian-900/50 border border-white/10 rounded-xl p-4 mb-3 hover:border-primary/30 transition-colors group cursor-pointer"
    >
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Lightbulb className="w-4 h-4" />
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-200 mb-1">{suggestion.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{suggestion.description}</p>
            </div>
        </div>
    </motion.div>
);

const LiveAssist = ({ analysis }) => {
    // Mock suggestions based on sentiment/risk
    const suggestions = analysis.risk === 'High' ? [
        { title: "Empathy Check", description: "Customer is frustrated. Acknowledge their feelings before offering a solution." },
        { title: "Escalation Prevention", description: "Offer immediate refund or supervisor callback to de-escalate." }
    ] : [
        { title: "Cross-sell Opportunity", description: "Customer is happy. Mention the premium support package." }
    ];

    return (
        <div className="space-y-6">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Sentiment</span>
                    <div className={`text-2xl font-bold ${analysis.sentiment === 'positive' ? 'text-green-400' :
                            analysis.sentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                        {analysis.sentiment ? analysis.sentiment.toUpperCase() : '--'}
                    </div>
                    {/* Mini graph bg */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <TrendingUp className="w-full h-full text-current" />
                    </div>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Risk Level</span>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${analysis.risk === 'High' ? 'text-red-500' : 'text-green-500'
                        }`}>
                        {analysis.risk === 'High' && <AlertTriangle className="w-5 h-5" />}
                        {analysis.risk || '--'}
                    </div>
                </Card>
            </div>

            {/* AI Nudges */}
            <Card className="flex-1 min-h-[400px]">
                <div className="flex items-center gap-2 mb-4 text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h3 className="font-medium tracking-wide text-sm uppercase">AI Assitant Live Nudges</h3>
                </div>

                <div className="space-y-2">
                    <AnimatePresence>
                        {suggestions.map((s, i) => (
                            <SuggestionItem key={i} suggestion={s} />
                        ))}
                    </AnimatePresence>
                </div>

                {/* SOP Checklist */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">SOP Adherence</h4>
                    <div className="space-y-2">
                        {[
                            { label: "Verify Identity", checked: true },
                            { label: "Listen to Issue", checked: true },
                            { label: "Propose Solution", checked: false },
                            { label: "Confirm Resolution", checked: false }
                        ].map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-3 text-sm ${item.checked ? 'text-green-400 line-through opacity-70' : 'text-gray-400'}`}>
                                <CheckCircle className={`w-4 h-4 ${item.checked ? 'text-green-500' : 'text-gray-700'}`} />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default LiveAssist;
