import React from 'react';
import { Target, Award, PlayCircle, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import axios from 'axios'; // Ensure imported if not already

const CoachingHub = () => {
    const [skillData, setSkillData] = React.useState([]);
    const [modules, setModules] = React.useState([]);
    const [rec, setRec] = React.useState("Analyzing performance...");

    React.useEffect(() => {
        const fetchCoaching = async () => {
            try {
                // Assuming the backend endpoint is fixed to /summary relative to the router prefix
                const res = await axios.get('http://localhost:8000/api/v1/coaching/summary');
                setSkillData(res.data.skill_matrix || []);
                setModules(res.data.modules || []);
                setRec(res.data.recommendation || "No specific recommendations yet.");
            } catch (err) {
                console.error("Failed to fetch coaching data", err);
                // Fallback for demo
                setSkillData([
                    { subject: 'Empathy', A: 65, fullMark: 100 },
                    { subject: 'Resolution', A: 90, fullMark: 100 },
                    { subject: 'Speed', A: 80, fullMark: 100 },
                    { subject: 'Compliance', A: 70, fullMark: 100 },
                    { subject: 'Tone', A: 85, fullMark: 100 },
                ]);
                setModules([
                    { title: "Handling Irate Customers", type: "Video", duration: "12 min", status: "Pending" },
                    { title: "SOP V2.4 Updates", type: "Document", duration: "5 min", status: "Completed" },
                    { title: "Active Listening Lab", type: "Simulation", duration: "15 min", status: "In Progress" },
                ]);
                setRec("Could not load recommendations. Please try again later.");
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">Coaching Hub</h1>
                <p className="text-gray-400 mt-2">Your personalized growth plan and skill analysis.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill Radar */}
                <div className="bg-[#161920]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Target size={20} className="text-blue-400" /> Skill Matrix
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Radar name="My Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Assigned Modules */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PlayCircle size={20} className="text-purple-400" /> Active Modules
                    </h3>
                    {modules.map((mod, i) => (
                        <div
                            key={i}
                            onClick={() => alert(`Starting Module: ${mod.title}`)}
                            className="flex items-center justify-between p-4 bg-[#161920]/60 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{mod.title}</h4>
                                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                        <span>{mod.type}</span>
                                        <span>•</span>
                                        <span>{mod.duration}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full border ${mod.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                mod.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                {mod.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Award size={20} className="text-yellow-400" /> AI Coach Recommendation
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                    "Based on your last 5 calls, you have shown excellent <strong>Resolution</strong> skills.
                    However, your <strong>Empathy score</strong> drops during the 'Objection Handling' phase.
                    I recommend reviewing the 'Active Listening Lab' module to improve emotional connection during conflicts."
                </p>
            </div>
        </div>
    );
};

export default CoachingHub;
