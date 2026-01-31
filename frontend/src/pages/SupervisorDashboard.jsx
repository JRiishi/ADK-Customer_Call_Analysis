import React from 'react';
import { Card, Badge } from '../components/UI';
import { Users, AlertTriangle, TrendingUp, Trophy } from 'lucide-react';
import axios from 'axios';

const SupervisorDashboard = () => {
    const [agents, setAgents] = React.useState([]);
    const [stats, setStats] = React.useState({ agents_count: 0, critical: 0, sentiment: 0 });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/analysis/dashboard/stats');
                if (res.data.agent_performance) {
                    const mappedAgents = res.data.agent_performance.map((a, i) => ({
                        id: i + 1,
                        name: a.name || `Agent ${i + 1}`,
                        sentiment: (a.sentiment / 100) * 2 - 1,   // Norm 0-100 to -1..1 roughly, or just use score
                        sentiment_raw: a.sentiment,
                        calls: a.calls,
                        score: a.score,
                        status: ['online', 'busy', 'call'][i % 3] // Mock status as placeholder
                    }));
                    setAgents(mappedAgents);
                }
                if (res.data.metrics) {
                    const m = res.data.metrics;
                    setStats({
                        // mapping from labels "Team QA Avg", etc.
                        agents_count: 15, // Fixed or from specific API
                        critical: m.find(x => x.label.includes("Risks"))?.value || 0,
                        sentiment: m.find(x => x.label.includes("Compliance"))?.value || "0%"
                    });
                }
            } catch (err) {
                console.error("Failed to fetch supervisor stats", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="flex items-center gap-4 bg-primary/10 border-primary/20">
                    <div className="p-3 bg-primary/20 rounded-lg text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Total Agents</p>
                        <p className="text-2xl font-bold text-white">42</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Critical Alerts</p>
                        <p className="text-2xl font-bold text-white">3</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Avg Sentiment</p>
                        <p className="text-2xl font-bold text-white">+0.65</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-gold-400/10 border-gold-400/20">
                    <div className="p-3 bg-gold-400/20 rounded-lg text-gold-400">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Team Rank</p>
                        <p className="text-2xl font-bold text-white">#1</p>
                    </div>
                </Card>
            </div>

            {/* Leaderboard Table */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Live Leaderboard</h3>
                    <button className="text-sm text-primary hover:text-white transition-colors">View All Agents</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                <th className="py-4 px-4 font-medium">Rank</th>
                                <th className="py-4 px-4 font-medium">Agent</th>
                                <th className="py-4 px-4 font-medium">Status</th>
                                <th className="py-4 px-4 font-medium">Avg Sentiment</th>
                                <th className="py-4 px-4 font-medium">QA Score</th>
                                <th className="py-4 px-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-300">
                            {agents.map((agent, index) => (
                                <tr key={agent.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-4">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-gold-400 text-black shadow-lg shadow-gold-400/20' :
                                            index === 1 ? 'bg-gray-400 text-black' :
                                                index === 2 ? 'bg-orange-700 text-white' : 'text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 font-medium text-white">{agent.name}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' :
                                                agent.status === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`} />
                                            <span className="capitalize text-xs text-gray-400">{agent.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${agent.sentiment > 0.5 ? 'bg-green-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.abs(agent.sentiment) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] ml-1">{agent.sentiment > 0 ? '+' : ''}{agent.sentiment}</span>
                                    </td>
                                    <td className="py-4 px-4 font-bold">{agent.score}</td>
                                    <td className="py-4 px-4">
                                        <button className="text-xs text-primary px-3 py-1 rounded-md bg-primary/10 hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                            Monitor
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SupervisorDashboard;
