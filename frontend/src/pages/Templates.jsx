import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncLoading, setSyncLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const initialFormState = {
        name: '',
        language: 'en_US',
        category: 'MARKETING',
        header_type: 'NONE',
        header_text: '',
        body_text: '',
        footer_text: '',
        button_type: 'NONE',
        button_text: '',
        button_url: ''
    };

    const [newTemplate, setNewTemplate] = useState(initialFormState);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // New states for test sending
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [testForm, setTestForm] = useState({ phone: '', variables: [] });
    const [testLoading, setTestLoading] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error('Failed to fetch templates', err);
        }
        setLoading(false);
    };

    const handleRefresh = async (id) => {
        try {
            const res = await api.get(`/templates/${id}/refresh`);
            setTemplates(templates.map(t => t.id === id ? res.data : t));
            setMessage({ type: 'success', text: `Status refreshed: ${res.data.status}` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Refresh failed' });
        }
    };

    const handleTestSend = async (e) => {
        e.preventDefault();
        setTestLoading(true);
        try {
            await api.post(`/templates/${selectedTemplate.id}/test`, {
                phone: testForm.phone,
                variables: testForm.variables 
            });
            setMessage({ type: 'success', text: 'Test message sent successfully!' });
            setShowTestModal(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Test send failed' });
        }
        setTestLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSync = async () => {
        setSyncLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.post('/templates/sync');
            setMessage({ type: 'success', text: `Successfully synced ${res.data.count} templates!` });
            fetchTemplates();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Sync failed' });
        }
        setSyncLoading(false);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage({ type: '', text: '' });

        // Build components array for Meta
        const components = [];
        
        if (newTemplate.header_type !== 'NONE') {
            const header = { type: 'HEADER', format: newTemplate.header_type };
            if (newTemplate.header_type === 'TEXT') {
                header.text = newTemplate.header_text;
            }
            components.push(header);
        }

        components.push({ type: 'BODY', text: newTemplate.body_text });

        if (newTemplate.footer_text) {
            components.push({ type: 'FOOTER', text: newTemplate.footer_text });
        }

        if (newTemplate.button_type !== 'NONE') {
            const btn = {
                type: newTemplate.button_type === 'URL' ? 'URL' : 'QUICK_REPLY',
                text: newTemplate.button_text
            };
            if (newTemplate.button_type === 'URL') btn.url = newTemplate.button_url;
            
            components.push({
                type: 'BUTTONS',
                buttons: [btn]
            });
        }

        try {
            await api.post('/templates', {
                ...newTemplate,
                components: components
            });
            setMessage({ type: 'success', text: 'Template submitted to Meta successfully!' });
            setShowCreateModal(false);
            setNewTemplate(initialFormState);
            fetchTemplates();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create template' });
        }
        setFormLoading(false);
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-primary/10 text-primary';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const navigate = useNavigate();
    const isTokenError = message.text.toLowerCase().includes('access token') || message.text.toLowerCase().includes('expired');

    return (
        <div className="px-10 pb-12">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-tighter mb-2">
                        <span>Panel</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                        <span className="text-primary">WhatsApp Templates</span>
                    </nav>
                    <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">WhatsApp Templates</h2>
                    <p className="text-on-surface-variant mt-2 max-w-xl">Manage your Meta-approved message templates for campaigns and automated responses.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSync}
                        disabled={syncLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-headline font-semibold text-sm text-secondary border-2 border-secondary/20 hover:bg-secondary/5 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-lg ${syncLoading ? 'animate-spin' : ''}`}>sync</span>
                        {syncLoading ? 'Syncing...' : 'Sync with Meta'}
                    </button>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full font-headline font-semibold text-sm text-white bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary-container/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Create Template
                    </button>
                </div>
            </section>

            {message.text && (
                <div className={`mb-8 p-5 rounded-[2rem] flex flex-col md:flex-row md:items-center gap-4 border shadow-sm transition-all animate-in slide-in-from-top-2 duration-300 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}>
                    <div className="flex items-center gap-3 flex-1">
                        <span className="material-symbols-outlined text-2xl">{message.type === 'success' ? 'check_circle' : 'warning'}</span>
                        <span className="text-sm font-bold leading-relaxed">{message.text}</span>
                    </div>
                    {isTokenError && (
                        <button 
                            onClick={() => navigate('/settings')}
                            className="px-6 py-2 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                        >
                            Update Token in Settings
                        </button>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-surface-container-highest cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-headline font-bold">{templates.length}</p>
                    </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-surface-container-highest cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Approved</p>
                        <p className="text-2xl font-headline font-bold">{templates.filter(t => t.status?.toLowerCase() === 'approved').length}</p>
                    </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-surface-container-highest cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm">
                        <span className="material-symbols-outlined">hourglass_top</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Pending</p>
                        <p className="text-2xl font-headline font-bold">{templates.filter(t => t.status?.toLowerCase() === 'pending').length}</p>
                    </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-surface-container-highest cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-500 shadow-sm">
                        <span className="material-symbols-outlined">cancel</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Rejected</p>
                        <p className="text-2xl font-headline font-bold">{templates.filter(t => t.status?.toLowerCase() === 'rejected').length}</p>
                    </div>
                </div>
            </section>

            {/* Templates Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-on-surface-variant font-bold animate-pulse">Fetching Templates...</div>
                ) : templates.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-surface-container-low/50 rounded-[2.5rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant">
                        No templates found. Click "Sync with Meta" to fetch your WhatsApp templates.
                    </div>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className="group relative bg-surface-container-lowest rounded-[2rem] p-6 shadow-[0px_20px_40px_rgba(20,29,36,0.06)] transition-all hover:-translate-y-1 hover:shadow-xl border border-outline-variant/5">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-secondary-fixed text-on-secondary-fixed">
                                    {template.category || 'MARKETING'}
                                </span>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${getStatusStyle(template.status)}`}>
                                    <span className="material-symbols-outlined text-xs">
                                        {template.status?.toLowerCase() === 'approved' ? 'verified' : 'history'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{template.status}</span>
                                </div>
                            </div>
                            <h3 className="font-headline font-bold text-lg mb-1 group-hover:text-primary transition-colors truncate">{template.name}</h3>
                            <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-sm">language</span> {template.language}
                            </p>
                            <div className="bg-surface-container-low p-4 rounded-2xl mb-6 relative overflow-hidden min-h-[6rem]">
                                <p className="text-sm text-on-surface italic line-clamp-3">
                                    "{template.content?.find(c => c.type === 'BODY')?.text || 'No content preview available'}"
                                </p>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest">ID: {template.whatsapp_template_id?.slice(-8)}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleRefresh(template.id)}
                                        title="Refresh status"
                                        className="w-8 h-8 rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm">sync</span>
                                    </button>
                                    {template.status?.toLowerCase() === 'approved' && (
                                        <button 
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                const body = template.content?.find(c => c.type === 'BODY')?.text || '';
                                                const variableCount = (body.match(/{{[0-9]+}}/g) || []).length;
                                                setTestForm({ phone: '', variables: Array(variableCount).fill('') });
                                                setShowTestModal(true);
                                            }}
                                            title="Send Test"
                                            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm">send</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="group relative bg-surface-container-low/50 border-2 border-dashed border-outline-variant/30 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white hover:border-primary-container min-h-[220px]"
                >
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:shadow-lg transition-all">
                        <span className="material-symbols-outlined text-3xl">add_box</span>
                    </div>
                    <div className="text-center">
                        <p className="font-headline font-bold text-on-surface">New Template</p>
                        <p className="text-xs text-on-surface-variant">Click to draft a new WhatsApp message</p>
                    </div>
                </button>
            </section>

            {/* Create Template Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-surface/20 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-surface-container-low flex justify-between items-center border-b border-outline-variant/10">
                            <h3 className="text-2xl font-headline font-black text-on-surface">New Template</h3>
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant ml-1">Template Name</label>
                                    <input 
                                        className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="lowercase_with_underscores"
                                        required
                                        value={newTemplate.name}
                                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '')})}
                                    />
                                </div>
                                <div className="flex gap-4 flex-1">
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant ml-1">Category</label>
                                        <select 
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={newTemplate.category}
                                            onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                                        >
                                            <option value="MARKETING">Marketing</option>
                                            <option value="UTILITY">Utility</option>
                                            <option value="AUTHENTICATION">Authentication</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant ml-1">Language</label>
                                        <select 
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={newTemplate.language}
                                            onChange={(e) => setNewTemplate({...newTemplate, language: e.target.value})}
                                        >
                                            <option value="en_US">English (US)</option>
                                            <option value="hi">Hindi</option>
                                            <option value="es">Spanish</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Header Section */}
                            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-lg">view_headline</span>
                                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Header (Optional)</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select 
                                        className="bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        value={newTemplate.header_type}
                                        onChange={(e) => setNewTemplate({...newTemplate, header_type: e.target.value})}
                                    >
                                        <option value="NONE">None</option>
                                        <option value="TEXT">Text</option>
                                        {/* Disabling these for now as Meta requires media handles/uploaded IDs */}
                                        {/* <option value="IMAGE">Image</option>
                                        <option value="VIDEO">Video</option>
                                        <option value="DOCUMENT">Document</option> */}
                                    </select>
                                    {newTemplate.header_type === 'TEXT' && (
                                        <input 
                                            className="bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Header text..."
                                            value={newTemplate.header_text}
                                            onChange={(e) => setNewTemplate({...newTemplate, header_text: e.target.value})}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Body Section */}
                            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-lg">article</span>
                                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Message Body *</label>
                                </div>
                                <textarea 
                                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                                    placeholder="Enter your message here..."
                                    required
                                    value={newTemplate.body_text}
                                    onChange={(e) => setNewTemplate({...newTemplate, body_text: e.target.value})}
                                ></textarea>
                                <p className="text-[10px] text-on-surface-variant italic px-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">info</span> 
                                    Use {'{{1}}'}, {'{{2}}'} etc. for variables.
                                </p>
                            </div>

                            {/* Footer Section */}
                            <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-lg">short_text</span>
                                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Footer (Optional)</label>
                                </div>
                                <input 
                                    className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Footer text (gray, small)..."
                                    value={newTemplate.footer_text}
                                    onChange={(e) => setNewTemplate({...newTemplate, footer_text: e.target.value})}
                                />
                            </div>

                            {/* Buttons Section */}
                            <div className="space-y-4 pt-4 border-t border-outline-variant/10 pb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-lg">smart_button</span>
                                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Interactive Button (Optional)</label>
                                </div>
                                <div className="space-y-4">
                                    <select 
                                        className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        value={newTemplate.button_type}
                                        onChange={(e) => setNewTemplate({...newTemplate, button_type: e.target.value})}
                                    >
                                        <option value="NONE">None</option>
                                        <option value="QUICK_REPLY">Quick Reply (User taps to send text)</option>
                                        <option value="URL">Visit Website (External link)</option>
                                    </select>
                                    
                                    {newTemplate.button_type !== 'NONE' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                                            <input 
                                                className="bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="Button label..."
                                                required
                                                value={newTemplate.button_text}
                                                onChange={(e) => setNewTemplate({...newTemplate, button_text: e.target.value})}
                                            />
                                            {newTemplate.button_type === 'URL' && (
                                                <input 
                                                    className="bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="URL (e.g. https://google.com)"
                                                    required
                                                    value={newTemplate.button_url}
                                                    onChange={(e) => setNewTemplate({...newTemplate, button_url: e.target.value})}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>

                        <div className="p-10 bg-surface-container-low flex gap-4 border-t border-outline-variant/10">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-full font-headline font-bold text-sm bg-surface-container-highest text-on-surface-variant hover:bg-surface-container transition-all">Cancel</button>
                            <button 
                                onClick={handleCreateSubmit}
                                disabled={formLoading}
                                className="flex-1 py-4 rounded-full font-headline font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary-container/30 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                {formLoading ? 'Submitting...' : 'Submit to Meta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Send Modal */}
            {showTestModal && selectedTemplate && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-on-surface/20 backdrop-blur-md">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-surface-container-low flex justify-between items-center border-b border-outline-variant/10">
                            <h3 className="text-xl font-headline font-black text-on-surface">Test Template: {selectedTemplate.name}</h3>
                            <button onClick={() => setShowTestModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleTestSend} className="p-10 space-y-6">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant ml-1">Recipient Phone Number</label>
                                <input 
                                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="e.g. 919331XXXXXX"
                                    required
                                    value={testForm.phone}
                                    onChange={(e) => setTestForm({...testForm, phone: e.target.value})}
                                />
                                <p className="text-[10px] text-on-surface-variant italic mt-1 px-1">Include country code (e.g. 91 for India).</p>
                            </div>

                            {testForm.variables.map((v, i) => (
                                <div key={i} className="space-y-1.5 text-left animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant ml-1">Variable {'{{'}{i + 1}{'}}'}</label>
                                    <input 
                                        className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder={`Value for {{${i+1}}}`}
                                        required
                                        value={v}
                                        onChange={(e) => {
                                            const newVars = [...testForm.variables];
                                            newVars[i] = e.target.value;
                                            setTestForm({...testForm, variables: newVars});
                                        }}
                                    />
                                </div>
                            ))}

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setShowTestModal(false)} className="flex-1 py-4 rounded-full font-headline font-bold text-sm bg-surface-container-highest text-on-surface-variant hover:bg-surface-container transition-all">Cancel</button>
                                <button 
                                    type="submit"
                                    disabled={testLoading}
                                    className="flex-1 py-4 rounded-full font-headline font-bold text-sm bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {testLoading ? 'Sending...' : 'Send Test Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;
