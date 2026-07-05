import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const Agents = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', role: 'agent' });
    const [editingAgent, setEditingAgent] = useState(null);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/agents');
            setAgents(res.data);
        } catch (err) {
            console.error('Failed to fetch agents', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleAddAgent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/agents', newAgent);
            setIsAddModalOpen(false);
            setNewAgent({ name: '', email: '', password: '', role: 'agent' });
            fetchAgents();
        } catch (err) {
            alert('Failed to add agent: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditAgentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/agents/${editingAgent.id}`, {
                name: editingAgent.name,
                email: editingAgent.email,
                role: editingAgent.role,
                password: editingAgent.password || undefined
            });
            setIsEditModalOpen(false);
            setEditingAgent(null);
            fetchAgents();
        } catch (err) {
            alert('Failed to update agent: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteAgent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this agent?')) return;
        try {
            await api.delete(`/admin/agents/${id}`);
            fetchAgents();
        } catch (err) {
            alert('Failed to delete agent: ' + (err.response?.data?.message || err.message));
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="px-10 pb-12">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-tighter mb-2">
                        <span>Panel</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                        <span className="text-primary">Team Directory</span>
                    </nav>
                    <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Agents & Team</h2>
                    <p className="text-on-surface-variant font-body">Create, manage, and assign team agents to handle specific customer chats.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl font-headline font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Add Agent
                </button>
            </div>

            {/* Table UI */}
            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_20px_40px_rgba(20,29,36,0.06)] border border-outline-variant/10">
                {loading ? (
                    <div className="py-20 text-center text-on-surface-variant font-bold animate-pulse">Loading Team Directory...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Name / Contact</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Email Address</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Role</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Created At</th>
                                <th className="px-8 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-0 text-sm">
                            {agents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-10 text-center text-on-surface-variant italic">No agents found in your team</td>
                                </tr>
                            ) : (
                                agents.map((agent, index) => (
                                    <tr key={agent.id} className={`group hover:bg-surface-container-low/30 transition-colors ${index % 2 !== 0 ? 'bg-surface-container-low/10' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline">
                                                    {getInitials(agent.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface leading-tight">{agent.name}</p>
                                                    <p className="text-xs text-on-surface-variant capitalize">{agent.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-medium font-body text-on-surface-variant">{agent.email}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1 rounded-full w-fit ${
                                                agent.role === 'admin' 
                                                ? 'text-primary bg-primary-container/10' 
                                                : 'text-secondary bg-secondary-container/10'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${agent.role === 'admin' ? 'bg-primary-container' : 'bg-secondary'}`}></div>
                                                {agent.role ? agent.role.toUpperCase() : 'AGENT'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-on-surface-variant font-medium">
                                            {new Date(agent.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => {
                                                        setEditingAgent({ ...agent, password: '' });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteAgent(agent.id)}
                                                    className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-error/5 rounded-lg"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Agent Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-surface-container-lowest w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl"
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined text-2xl">person_add</span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black font-headline text-on-surface">New Agent</h3>
                                                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Add team member to workspace</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-high transition-all flex items-center justify-center text-on-surface-variant">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddAgent} className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Agent Name</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="John Agent"
                                                    value={newAgent.name}
                                                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Email Address</label>
                                                <input 
                                                    required
                                                    type="email" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="agent@royal300.com"
                                                    value={newAgent.email}
                                                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Password</label>
                                                <input 
                                                    required
                                                    type="password" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="******"
                                                    value={newAgent.password}
                                                    onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Role</label>
                                                <select 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                                    value={newAgent.role}
                                                    onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                                                >
                                                    <option value="agent">Agent (Inbox Access Only)</option>
                                                    <option value="admin">Admin (Full Control)</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsAddModalOpen(false)}
                                                className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className="px-8 py-3 rounded-xl bg-primary text-white font-headline font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Save Agent
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Agent Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingAgent && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingAgent(null);
                            }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-surface-container-lowest w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl"
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined text-2xl">edit</span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black font-headline text-on-surface">Edit Agent</h3>
                                                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Update team member details</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setIsEditModalOpen(false);
                                                setEditingAgent(null);
                                            }} 
                                            className="w-10 h-10 rounded-full hover:bg-surface-container-high transition-all flex items-center justify-center text-on-surface-variant"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <form onSubmit={handleEditAgentSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Agent Name</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={editingAgent.name}
                                                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Email Address</label>
                                                <input 
                                                    required
                                                    type="email" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={editingAgent.email}
                                                    onChange={(e) => setEditingAgent({ ...editingAgent, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Password (Leave blank to keep current)</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="New Password"
                                                    value={editingAgent.password || ''}
                                                    onChange={(e) => setEditingAgent({ ...editingAgent, password: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Role</label>
                                                <select 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                                    value={editingAgent.role}
                                                    onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value })}
                                                >
                                                    <option value="agent">Agent (Inbox Access Only)</option>
                                                    <option value="admin">Admin (Full Control)</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setIsEditModalOpen(false);
                                                    setEditingAgent(null);
                                                }}
                                                className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className="px-8 py-3 rounded-xl bg-primary text-white font-headline font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Agents;
