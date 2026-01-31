import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Edit3, Save, X, Search, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';

const SOPManager = () => {
    const [sops, setSops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSop, setEditingSop] = useState(null);
    const [formData, setFormData] = useState({ title: '', department: 'General', content: '', mandatory_keywords: '' });

    const API_URL = 'http://localhost:8000/api/v1/sop';

    const fetchSops = async () => {
        try {
            const res = await axios.get(API_URL);
            setSops(res.data);
        } catch (err) {
            console.error("Failed to fetch SOPs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSops(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            mandatory_keywords: formData.mandatory_keywords.split(',').map(k => k.trim()).filter(k => k)
        };

        try {
            if (editingSop) {
                await axios.put(`${API_URL}/${editingSop._id || editingSop.id}`, payload);
            } else {
                await axios.post(API_URL, payload);
            }
            fetchSops();
            closeModal();
        } catch (err) {
            alert("Error saving SOP");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this SOP?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchSops();
        } catch (err) {
            alert("Error deleting SOP");
        }
    };

    const openModal = (sop = null) => {
        if (sop) {
            setEditingSop(sop);
            setFormData({
                title: sop.title,
                department: sop.department,
                content: sop.content,
                mandatory_keywords: (sop.mandatory_keywords || []).join(', ')
            });
        } else {
            setEditingSop(null);
            setFormData({ title: '', department: 'General', content: '', mandatory_keywords: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSop(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">SOP Manager</h1>
                    <p className="text-gray-400 mt-2">Create and manage your Standard Operating Procedures.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                    <Plus size={20} /> New SOP
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-500 font-medium">Loading Procedures...</div>
                ) : sops.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#161920]/30 border border-dashed border-white/10 rounded-2xl text-center">
                        <FileText size={48} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-500">No procedures found. Create your first one!</p>
                    </div>
                ) : sops.map((sop) => (
                    <div key={sop._id || sop.id} className="group bg-[#161920]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded-lg border border-blue-500/20">
                                {sop.department}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(sop)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10">
                                    <Edit3 size={14} />
                                </button>
                                <button onClick={() => handleDelete(sop._id || sop.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white/5 rounded-lg border border-white/10">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{sop.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-3 mb-4">{sop.content}</p>
                        <div className="flex flex-wrap gap-2">
                            {sop.mandatory_keywords?.map((k, i) => (
                                <span key={i} className="text-[10px] flex items-center gap-1 text-green-400 bg-green-400/5 px-2 py-0.5 rounded border border-green-400/10">
                                    <CheckCircle size={8} /> {k}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1c1f26] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleSave}>
                            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">{editingSop ? 'Edit SOP' : 'Create New SOP'}</h2>
                                <button type="button" onClick={closeModal} className="text-gray-400 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                                        <input
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Department</label>
                                        <select
                                            className="w-full bg-[#1c1f26] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            <option>General</option>
                                            <option>Support</option>
                                            <option>Sales</option>
                                            <option>Technical</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Mandatory Keywords (comma separated)</label>
                                    <input
                                        placeholder="greeting, identification, empathy..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.mandatory_keywords}
                                        onChange={(e) => setFormData({ ...formData, mandatory_keywords: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Content (Markdown)</label>
                                    <textarea
                                        required
                                        rows={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2"
                                >
                                    <Save size={20} /> {editingSop ? 'Update Procedure' : 'Save Procedure'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SOPManager;
