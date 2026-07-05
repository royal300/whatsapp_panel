import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Rule type icon mapping
const RULE_ICONS = [
    { icon: 'chat_bubble', color: '#16a34a', bg: '#f0fdf4' },
    { icon: 'person_add', color: '#2563eb', bg: '#eff6ff' },
    { icon: 'label', color: '#d97706', bg: '#fffbeb' },
    { icon: 'warning', color: '#dc2626', bg: '#fef2f2' },
    { icon: 'schedule', color: '#7c3aed', bg: '#f5f3ff' },
    { icon: 'reply', color: '#0d9488', bg: '#f0fdfa' },
];

const Automation = () => {
    const [rules, setRules] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [togglingAI, setTogglingAI] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', trigger_keyword: '', template_id: '' });
    const [editingRule, setEditingRule] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const renderFormattedText = (text) => {
        if (!text) return null;
        return text.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_|~.*?~)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) return <strong key={i}>{part.slice(1,-1)}</strong>;
            if (part.startsWith('_') && part.endsWith('_')) return <em key={i}>{part.slice(1,-1)}</em>;
            if (part.startsWith('~') && part.endsWith('~')) return <del key={i}>{part.slice(1,-1)}</del>;
            return part;
        });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, settingsRes, templatesRes] = await Promise.all([
                api.get('/automation-rules'),
                api.get('/tenant/settings'),
                api.get('/templates'),
            ]);
            setRules(rulesRes.data);
            setAiEnabled(!!settingsRes.data.ai_quick_replies_enabled);
            setTemplates(templatesRes.data);
            if (templatesRes.data.length > 0) {
                setNewRule(prev => ({ ...prev, template_id: templatesRes.data[0].id }));
            }
        } catch (err) { console.error('Failed to fetch automation config', err); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const toggleAIStatus = async () => {
        setTogglingAI(true);
        try {
            const newVal = !aiEnabled;
            await api.post('/tenant/settings', { ai_quick_replies_enabled: newVal });
            setAiEnabled(newVal);
            setMessage({ type: 'success', text: `Smart Reply AI ${newVal ? 'enabled' : 'disabled'} successfully!` });
        } catch { setMessage({ type: 'error', text: 'Failed to update AI setting' }); }
        setTogglingAI(false);
    };

    const toggleRuleStatus = async (id, current) => {
        try {
            const updated = await api.put(`/automation-rules/${id}`, { is_active: !current });
            setRules(rules.map(r => r.id === id ? updated.data : r));
        } catch { alert('Failed to update rule status'); }
    };

    const handleCreateRuleSubmit = async (e) => {
        e.preventDefault();
        if (!newRule.template_id) { alert('Please select a template first.'); return; }
        setFormLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.post('/automation-rules', {
                name: newRule.name, trigger_keyword: newRule.trigger_keyword,
                trigger_type: 'keyword', action_type: 'send_message', template_id: newRule.template_id
            });
            setRules([...rules, res.data]);
            setShowCreateModal(false);
            setNewRule({ name: '', trigger_keyword: '', template_id: templates[0]?.id || '' });
            setMessage({ type: 'success', text: 'Automation rule created successfully!' });
        } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create rule' }); }
        setFormLoading(false);
    };

    const handleEditRuleClick = (rule) => {
        setEditingRule({ id: rule.id, name: rule.name, trigger_keyword: rule.trigger_keyword, template_id: rule.template_id || '', is_active: rule.is_active });
        setShowEditModal(true);
    };

    const handleEditRuleSubmit = async (e) => {
        e.preventDefault();
        if (!editingRule) return;
        setFormLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.put(`/automation-rules/${editingRule.id}`, {
                name: editingRule.name, trigger_keyword: editingRule.trigger_keyword,
                template_id: editingRule.template_id, is_active: editingRule.is_active
            });
            setRules(rules.map(r => r.id === editingRule.id ? res.data : r));
            setShowEditModal(false);
            setEditingRule(null);
            setMessage({ type: 'success', text: 'Rule updated successfully!' });
        } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update rule' }); }
        setFormLoading(false);
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await api.delete(`/automation-rules/${id}`);
            setRules(rules.filter(r => r.id !== id));
            setMessage({ type: 'success', text: 'Rule deleted.' });
        } catch { setMessage({ type: 'error', text: 'Failed to delete rule' }); }
    };

    // ── Rule Form Modal ────────────────────────────────────────────────────────
    const RuleModal = ({ title, rule, setRule, onSubmit, onClose }) => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900">{title}</h3>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-base text-gray-500">close</span>
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-8 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Rule Name</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                            placeholder="e.g. Out of Office Reply" required value={rule.name}
                            onChange={e => setRule({ ...rule, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Trigger Keyword</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                            placeholder="e.g. hello, pricing, help" required value={rule.trigger_keyword}
                            onChange={e => setRule({ ...rule, trigger_keyword: e.target.value })} />
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-0.5">Case-insensitive. Fires when an incoming message matches exactly.</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Action: Send Template</label>
                        <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none appearance-none transition-all"
                            required value={rule.template_id}
                            onChange={e => setRule({ ...rule, template_id: e.target.value })}>
                            {templates.length === 0
                                ? <option value="">No templates available</option>
                                : templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                        </select>
                    </div>
                    {rule.template_id && templates.find(t => t.id == rule.template_id) && (
                        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 text-sm text-gray-600 italic leading-relaxed">
                            {renderFormattedText(templates.find(t => t.id == rule.template_id)?.content?.find(c => c.type === 'BODY')?.text) || 'No preview.'}
                        </div>
                    )}
                    {rule.hasOwnProperty('is_active') && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Rule Active</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={rule.is_active}
                                    onChange={() => setRule({ ...rule, is_active: !rule.is_active })} />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">Cancel</button>
                        <button type="submit" disabled={formLoading}
                            className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50">
                            {formLoading ? 'Saving…' : title}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-2 pb-12">
            {/* Header */}
            <header className="flex items-start justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        <span>Panel</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                        <span style={{ color: '#16a34a' }}>Automation</span>
                    </nav>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Automation Rules</h1>
                    <p className="text-gray-400 mt-1 text-sm font-medium">Manage your automated workflows and auto-replies.</p>
                </div>
                <button
                    onClick={() => { setShowCreateModal(true); if (templates.length > 0 && !newRule.template_id) setNewRule(p => ({ ...p, template_id: templates[0].id })); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
                    style={{ background: '#16a34a' }}
                >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                    New Rule
                </button>
            </header>

            {/* Flash message */}
            {message.text && (
                <div className={`mb-6 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border animate-in slide-in-from-top-2 duration-200 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
                    <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'warning'}</span>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            )}

            {/* Rules List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                {loading ? (
                    <div className="py-16 text-center text-gray-400 font-semibold animate-pulse">Loading rules…</div>
                ) : rules.length === 0 ? (
                    <div className="py-24 flex flex-col items-center gap-4 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-200">smart_toy</span>
                        <p className="text-gray-400 font-semibold text-sm">No automation rules yet.</p>
                        <button onClick={() => { setShowCreateModal(true); }} className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all" style={{ background: '#16a34a' }}>
                            Create your first rule →
                        </button>
                    </div>
                ) : (
                    rules.map((rule, idx) => {
                        const iconInfo = RULE_ICONS[idx % RULE_ICONS.length];
                        return (
                            <div key={rule.id} className="flex items-center gap-5 px-6 py-5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                {/* Icon badge */}
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: iconInfo.bg }}>
                                    <span className="material-symbols-outlined text-[20px]" style={{ color: iconInfo.color, fontVariationSettings: "'FILL' 1" }}>{iconInfo.icon}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{rule.name}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">bolt</span>
                                            Trigger: <span className="font-semibold text-gray-600 ml-0.5">"{rule.trigger_keyword}"</span>
                                        </span>
                                        <span className="text-gray-200">•</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">reply</span>
                                            Action: <span className="font-semibold text-gray-600 ml-0.5">Send "{rule.template?.name || 'Deleted Template'}"</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Active toggle */}
                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                    <span className={`text-xs font-semibold ${rule.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {rule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={rule.is_active}
                                            onChange={() => toggleRuleStatus(rule.id, rule.is_active)} />
                                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Edit / Delete */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleEditRuleClick(rule)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDeleteRule(rule.id)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Smart Reply AI Card */}
                <div className="rounded-3xl p-7 flex flex-col justify-between min-h-[180px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)' }}>
                    <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="absolute -right-2 bottom-4 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="relative z-10">
                        <h4 className="text-xl font-black text-white mb-2">Smart Reply AI</h4>
                        <p className="text-sm text-white/70 leading-relaxed max-w-xs">
                            Our AI engine analyzes incoming messages to automatically suggest the best rules. You currently have {rules.length} automation rule{rules.length !== 1 ? 's' : ''} active.
                        </p>
                    </div>
                    <div className="relative z-10 flex items-center justify-between mt-5">
                        <button className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-white hover:bg-white/90 transition-all">
                            View Suggestions
                        </button>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={aiEnabled} disabled={togglingAI} onChange={toggleAIStatus} />
                            <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40 bg-white/20"></div>
                        </label>
                    </div>
                </div>

                {/* Fast Execution stat */}
                <div className="rounded-3xl p-7 bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px]">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f0fdf4' }}>
                        <span className="material-symbols-outlined text-3xl" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                    <h4 className="text-base font-black text-gray-900 mb-1">Fast Execution</h4>
                    <p className="text-sm text-gray-400 font-medium">Average rule execution time: 0.2s</p>
                    {aiEnabled && (
                        <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                            AI Responder Live
                        </span>
                    )}
                    <p className="text-xs text-gray-300 mt-2 font-semibold">{rules.length} keyword rule{rules.length !== 1 ? 's' : ''} active</p>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <RuleModal
                    title="New Rule"
                    rule={newRule}
                    setRule={setNewRule}
                    onSubmit={handleCreateRuleSubmit}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingRule && (
                <RuleModal
                    title="Save Changes"
                    rule={editingRule}
                    setRule={setEditingRule}
                    onSubmit={handleEditRuleSubmit}
                    onClose={() => { setShowEditModal(false); setEditingRule(null); }}
                />
            )}
        </div>
    );
};

export default Automation;
