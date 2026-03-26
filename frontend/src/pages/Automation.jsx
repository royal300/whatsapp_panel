import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Automation = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const res = await api.get('/automation-rules');
                setRules(res.data);
            } catch (err) {
                console.error('Failed to fetch automation rules', err);
            }
            setLoading(false);
        };
        fetchRules();
    }, []);

    const toggleRuleStatus = async (id, currentStatus) => {
        // Mock toggle for UI update
        setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    };

    return (
        <div className="px-10 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Automation Rules</h1>
                    <p className="text-on-surface-variant mt-2 font-medium">Manage your automated workflows and auto-replies.</p>
                </div>
                <button className="bg-primary-container text-on-primary-container hover:shadow-xl hover:shadow-emerald-500/10 px-6 py-3 rounded-xl font-headline font-bold flex items-center gap-2 transition-all active:scale-95">
                    <span className="material-symbols-outlined">add_circle</span>
                    New Rule
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4 mb-12">
                {loading ? (
                    <div className="py-20 text-center font-bold animate-pulse text-on-surface-variant">Loading Rules...</div>
                ) : rules.length === 0 ? (
                    <div className="bg-surface-container-lowest p-20 rounded-[3rem] border-2 border-dashed border-outline-variant/30 text-center flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 italic">smart_toy</span>
                        <p className="text-on-surface-variant font-medium">No automation rules defined yet.</p>
                        <button className="text-primary font-bold hover:underline">Create your first keyword responder &rarr;</button>
                    </div>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className="group bg-surface-container-lowest p-6 rounded-[2rem] shadow-[0px_20px_40px_rgba(20,29,36,0.04)] border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5 flex-1 w-full">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">chat_bubble</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-headline font-bold text-lg text-on-surface">{rule.name}</h3>
                                    <div className="flex flex-wrap gap-4 mt-1">
                                        <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">bolt</span> 
                                            Trigger: <span className="text-primary font-bold px-1.5 py-0.5 bg-primary/5 rounded">{rule.trigger_keyword}</span>
                                        </span>
                                        <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">reply</span> 
                                            Action: <span className="text-on-surface-variant font-bold">Send Template</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-semibold ${rule.is_active ? 'text-primary' : 'text-on-surface-variant'}`}>
                                        {rule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={rule.is_active} 
                                            onChange={() => toggleRuleStatus(rule.id, rule.is_active)}
                                        />
                                        <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container rounded-lg transition-colors">
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button className="p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* AI Suggestion Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-900/10 flex flex-col justify-center overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <h4 className="font-headline font-bold text-2xl relative z-10">Smart Reply AI</h4>
                    <p className="mt-2 opacity-90 text-sm leading-relaxed max-w-md relative z-10">Our AI engine analyzes incoming messages to automatically suggest the best rules. Save time and improve response quality.</p>
                    <div className="mt-6 flex gap-4 relative z-10">
                        <button className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-xl font-bold text-sm hover:bg-white/30 transition-all">View AI Insights</button>
                    </div>
                </div>
                <div className="bg-surface-container-highest p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">bolt</span>
                    <h4 className="font-headline font-bold text-lg text-on-surface">Execution State</h4>
                    <p className="text-sm text-on-surface-variant">{loading ? 'Checking...' : `${rules.length} Active Rules`}</p>
                </div>
            </div>
        </div>
    );
};

export default Automation;
