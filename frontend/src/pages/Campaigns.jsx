import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const Campaigns = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingTemplates, setFetchingTemplates] = useState(false);
    
    // Modal & Stepper State
    const [showModal, setShowModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [stats, setStats] = useState({ totalSent: 0, deliveredRate: 0 });
    const [step, setStep] = useState(1);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const initialCampaignState = {
        name: '',
        template_id: '',
        audienceType: 'manual', // manual | csv
        audience: [{ phone: '', variables: [] }],
        csvData: null,
        csvMapping: { phone: '', variables: [] }
    };

    const [newCampaign, setNewCampaign] = useState(initialCampaignState);

    // Handle deep link
    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowModal(true);
            // Clean up URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('create');
            setSearchParams(newParams);
        }
    }, [searchParams, setSearchParams]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/campaigns');
            const data = res.data || [];
            setCampaigns(data);
            
            const totalSent = data.reduce((acc, c) => acc + (c.audience_count || 0), 0);
            const totalDelivered = data.reduce((acc, c) => acc + (c.logs?.filter(l => l.status === 'delivered').length || 0), 0);
            const deliveredRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
            
            setStats({ totalSent, deliveredRate });
        } catch (err) {
            console.error('Failed to fetch campaigns', err);
        }
        setLoading(false);
    };

    const fetchTemplates = async () => {
        setFetchingTemplates(true);
        try {
            const res = await api.get('/templates');
            // Only show approved templates for campaigns
            setTemplates((res.data || []).filter(t => t.status?.toLowerCase() === 'approved'));
        } catch (err) {
            console.error('Failed to fetch templates', err);
        }
        setFetchingTemplates(false);
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (showModal) fetchTemplates();
    }, [showModal]);

    const handleTemplateChange = (templateId) => {
        const template = templates.find(t => t.id === parseInt(templateId));
        if (!template) return;

        // Try to get body text from content array
        let bodyText = '';
        if (Array.isArray(template.content)) {
            bodyText = template.content.find(c => c.type === 'BODY')?.text || '';
        }

        const matches = bodyText.match(/{{[0-9]+}}/g) || [];
        const uniqueVarCount = new Set(matches).size;

        setNewCampaign({
            ...newCampaign,
            template_id: templateId,
            audience: [{ phone: '', variables: new Array(uniqueVarCount).fill('') }],
            csvMapping: { phone: '', variables: new Array(uniqueVarCount).fill('') }
        });
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                headers.forEach((h, i) => row[h] = values[i]);
                return row;
            });
            setNewCampaign({ ...newCampaign, csvData: { headers, rows } });
        };
        reader.readAsText(file);
    };

    const handleLaunch = async () => {
        setFormLoading(true);
        setMessage({ type: '', text: '' });

        let finalAudience = [];
        if (newCampaign.audienceType === 'manual') {
            finalAudience = newCampaign.audience.filter(a => a.phone);
        } else {
            // Map CSV rows using mapping state
            finalAudience = newCampaign.csvData.rows.map(row => ({
                phone: row[newCampaign.csvMapping.phone],
                variables: newCampaign.csvMapping.variables.map(header => row[header] || '')
            })).filter(a => a.phone);
        }

        try {
            await api.post('/campaigns', {
                name: newCampaign.name,
                template_id: newCampaign.template_id,
                audience: finalAudience
            });
            setMessage({ type: 'success', text: 'Campaign launched successfully!' });
            setTimeout(() => {
                setShowModal(false);
                setStep(1);
                setNewCampaign(initialCampaignState);
                fetchCampaigns();
            }, 1500);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to launch campaign' });
        }
        setFormLoading(false);
    };

    const addManualRow = () => {
        const varCount = newCampaign.audience[0]?.variables?.length || 0;
        setNewCampaign({
            ...newCampaign,
            audience: [...newCampaign.audience, { phone: '', variables: new Array(varCount).fill('') }]
        });
    };

    const getSelectedTemplate = () => templates.find(t => t.id === parseInt(newCampaign.template_id));

    return (
        <div className="px-12 pb-12">
            {/* Header */}
            <header className="max-w-6xl mx-auto mb-12">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">Campaigns</h1>
                        <p className="text-on-surface-variant font-medium">Design and personalize your automated message flow.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-on-surface">
                    <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 hover:shadow-lg transition-all cursor-default">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined">send</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Audience</p>
                            <p className="text-2xl font-headline font-bold">{loading ? '...' : stats.totalSent.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 hover:shadow-lg transition-all cursor-default text-on-surface">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                            <span className="material-symbols-outlined">done_all</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Read Rate</p>
                            <p className="text-2xl font-headline font-bold">{loading ? '...' : stats.deliveredRate.toFixed(1)}%</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-3xl flex items-center justify-center gap-4 text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-3xl">add</span>
                        <span className="font-headline font-bold">Create New Campaign</span>
                    </button>
                </div>
            </header>

            {/* Campaign List */}
            <div className="max-w-6xl mx-auto">
                <div className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden shadow-[0px_20px_40px_rgba(20,29,36,0.06)] border border-outline-variant/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Campaign Name</th>
                                <th className="px-6 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Status</th>
                                <th className="px-6 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Template</th>
                                <th className="px-6 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Stats</th>
                                <th className="px-8 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-0 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="py-24 text-center text-on-surface-variant font-bold animate-pulse">Loading Campaigns...</td></tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                                            <span className="material-symbols-outlined text-7xl">campaign</span>
                                            <p className="font-headline font-bold text-lg">No campaigns created yet</p>
                                            <p className="text-xs">Click the green button to start your first broadcast.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign, idx) => (
                                    <tr key={campaign.id} className={`group hover:bg-surface-container-low/30 transition-colors ${idx % 2 !== 0 ? 'bg-surface-container-low/10' : ''}`}>
                                        <td className="px-8 py-6 border-b border-outline-variant/5">
                                            <div>
                                                <p className="font-bold text-on-surface leading-tight text-base">{campaign.name}</p>
                                                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black mt-1.5 opacity-60">
                                                    {new Date(campaign.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 border-b border-outline-variant/5">
                                            <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full w-fit ${
                                                campaign.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                                                campaign.status === 'running' ? 'bg-sky-50 text-sky-700 animate-pulse' : 'bg-surface-container-highest text-on-surface-variant'
                                            }`}>
                                                <span className="material-symbols-outlined text-xs">
                                                    {campaign.status === 'completed' ? 'check_circle' : campaign.status === 'running' ? 'sync' : 'draft'}
                                                </span>
                                                {campaign.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 border-b border-outline-variant/5 font-bold text-on-surface-variant">
                                            {campaign.template?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-6 border-b border-outline-variant/5">
                                            <div className="flex gap-6 text-[11px] font-black">
                                                <div className="flex flex-col">
                                                    <span className="text-on-surface-variant opacity-40 uppercase tracking-tighter mb-0.5">Audience</span>
                                                    <span className="text-on-surface text-sm">{campaign.audience_count || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-on-surface-variant opacity-40 uppercase tracking-tighter mb-0.5">Read</span>
                                                    <span className="text-primary text-sm">{(campaign.logs?.filter(l => l.status === 'read').length) || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 border-b border-outline-variant/5 text-right">
                                            <button 
                                                onClick={() => {
                                                    setSelectedCampaign(campaign);
                                                    setShowStatsModal(true);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-surface-container hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-symbols-outlined text-lg">bar_chart</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Campaign Stats Modal */}
            {showStatsModal && selectedCampaign && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-on-surface/30 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 bg-surface-container-low flex justify-between items-center border-b border-outline-variant/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">insights</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-headline font-black text-on-surface tracking-tight">{selectedCampaign.name}</h3>
                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-0.5">Delivery Performance & Logs</p>
                                </div>
                            </div>
                            <button onClick={() => setShowStatsModal(false)} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container transition-all">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-surface-container-low/20">
                            <div className="grid grid-cols-4 gap-6 mb-10">
                                {[
                                    { label: 'Sent', count: selectedCampaign.audience_count || 0, color: 'text-on-surface' },
                                    { label: 'Delivered', count: selectedCampaign.logs?.filter(l => l.status === 'delivered').length || 0, color: 'text-sky-600' },
                                    { label: 'Read', count: selectedCampaign.logs?.filter(l => l.status === 'read').length || 0, color: 'text-emerald-600' },
                                    { label: 'Failed', count: selectedCampaign.logs?.filter(l => l.status === 'failed').length || 0, color: 'text-rose-600' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-outline-variant/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-1">{stat.label}</p>
                                        <h4 className={`text-2xl font-headline font-black ${stat.color}`}>{stat.count}</h4>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-outline-variant/10 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low/50 border-b border-outline-variant/10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recipient</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Variables</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Message ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/5">
                                        {(selectedCampaign.audience || []).map((entry, idx) => {
                                            const log = selectedCampaign.logs?.find(l => l.number === entry.phone);
                                            return (
                                                <tr key={idx} className="hover:bg-surface-container-low/30 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-on-surface text-sm">{entry.phone}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            {(entry.variables || []).map((v, vIdx) => (
                                                                <span key={vIdx} className="px-2 py-0.5 bg-surface-container text-[10px] font-medium rounded-lg text-on-surface-variant">
                                                                    {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                log?.status === 'read' ? 'bg-emerald-50 text-emerald-700' :
                                                                log?.status === 'delivered' ? 'bg-sky-50 text-sky-700' :
                                                                log?.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                                                                'bg-slate-50 text-slate-500'
                                                            }`}>
                                                                {log?.status || 'Pending'}
                                                            </span>
                                                            {log?.status === 'failed' && log?.error_message && (
                                                                <span className="text-[10px] text-rose-500 font-medium leading-tight max-w-[200px]">
                                                                    {log.error_message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-[10px] font-mono text-on-surface-variant opacity-40">
                                                        {log?.message_id || '---'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-8 bg-surface-container-low border-t border-outline-variant/10 flex justify-end">
                            <button 
                                onClick={() => setShowStatsModal(false)}
                                className="px-10 py-4 rounded-full font-headline font-bold text-sm bg-on-surface text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-on-surface/10"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Campaign Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-surface/30 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 bg-surface-container-low flex justify-between items-center border-b border-outline-variant/10">
                            <div>
                                <h3 className="text-3xl font-headline font-black text-on-surface tracking-tight">Create Campaign</h3>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Step {step} of 3</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-surface-container transition-all">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex flex-col h-[65vh]">
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                {message.text && (
                                    <div className={`mb-8 p-5 rounded-3xl flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                        <span className="material-symbols-outlined text-2xl">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                                        <p className="font-bold text-sm tracking-tight">{message.text}</p>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Campaign Name</label>
                                                <input 
                                                    className="w-full bg-surface-container-low border-none rounded-[1.5rem] py-5 px-6 text-lg font-bold focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                                                    placeholder="E.g. Summer Promo 2024"
                                                    value={newCampaign.name}
                                                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Select Template</label>
                                                <select 
                                                    className="w-full bg-surface-container-low border-none rounded-[1.5rem] py-5 px-6 text-lg font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer shadow-sm"
                                                    value={newCampaign.template_id}
                                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                                >
                                                    <option value="">Choose an approved template...</option>
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                                                    ))}
                                                </select>
                                                {fetchingTemplates && <p className="text-[10px] text-primary animate-pulse ml-2 font-bold tracking-widest uppercase">Fetching templates from Meta...</p>}
                                            </div>
                                        </div>
                                        <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/10">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">preview</span>
                                                Template Preview
                                            </h4>
                                            {newCampaign.template_id ? (
                                                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-3 relative">
                                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">WhatsApp Business</div>
                                                    <p className="text-sm text-on-surface leading-normal whitespace-pre-wrap font-medium">
                                                        {getSelectedTemplate()?.content?.find(c => c.type === 'BODY')?.text}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="h-40 flex flex-col items-center justify-center gap-3 text-on-surface-variant opacity-30 italic">
                                                    <span className="material-symbols-outlined text-4xl">text_snippet</span>
                                                    <p className="text-sm">Select a template to preview</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-10">
                                        <div className="flex gap-4 p-1.5 bg-surface-container-low rounded-2xl w-fit">
                                            <button 
                                                onClick={() => setNewCampaign({...newCampaign, audienceType: 'manual'})}
                                                className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${newCampaign.audienceType === 'manual' ? 'bg-white shadow-md text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                                            >
                                                Manual Entry
                                            </button>
                                            <button 
                                                onClick={() => setNewCampaign({...newCampaign, audienceType: 'csv'})}
                                                className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${newCampaign.audienceType === 'csv' ? 'bg-white shadow-md text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                                            >
                                                CSV Upload
                                            </button>
                                        </div>

                                        {newCampaign.audienceType === 'manual' ? (
                                            <div className="space-y-4">
                                                <div className="bg-surface-container-low rounded-[2rem] p-8 overflow-hidden">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="border-b border-outline-variant/10">
                                                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Phone Number (with code)</th>
                                                                {newCampaign.audience[0]?.variables.map((_, i) => (
                                                                    <th key={i} className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-4">Var {i + 1}</th>
                                                                ))}
                                                                <th></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-outline-variant/5">
                                                            {newCampaign.audience.map((row, idx) => (
                                                                <tr key={idx} className="group">
                                                                    <td className="py-4">
                                                                        <input 
                                                                            className="w-full bg-white border border-outline-variant/10 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                                            placeholder="+919876543210"
                                                                            value={row.phone}
                                                                            onChange={(e) => {
                                                                                const updated = [...newCampaign.audience];
                                                                                updated[idx].phone = e.target.value;
                                                                                setNewCampaign({...newCampaign, audience: updated});
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    {row.variables.map((v, vIdx) => (
                                                                        <td key={vIdx} className="py-4 px-4">
                                                                            <input 
                                                                                className="w-full bg-white border border-outline-variant/10 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                                                placeholder="Value..."
                                                                                value={v}
                                                                                onChange={(e) => {
                                                                                    const updated = [...newCampaign.audience];
                                                                                    updated[idx].variables[vIdx] = e.target.value;
                                                                                    setNewCampaign({...newCampaign, audience: updated});
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <button 
                                                        onClick={addManualRow}
                                                        className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">add_circle</span>
                                                        Add New Row
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                {!newCampaign.csvData ? (
                                                    <div className="border-4 border-dashed border-outline-variant/20 rounded-[3rem] p-20 flex flex-col items-center justify-center gap-6 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                                                        <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleCsvUpload} />
                                                        <div className="w-24 h-24 rounded-[2.5rem] bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                                                            <span className="material-symbols-outlined text-5xl">upload_file</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xl font-headline font-black text-on-surface">Upload Audience CSV</p>
                                                            <p className="text-sm text-on-surface-variant mt-1 font-medium italic">Max 10k rows • First row must be headers</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4">
                                                        <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/10">
                                                            <div className="flex justify-between items-center mb-6">
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">CSV Headers Mapping</h4>
                                                                <button onClick={() => setNewCampaign({...newCampaign, csvData: null})} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline">Clear CSV</button>
                                                            </div>
                                                            <div className="space-y-6">
                                                                <div className="space-y-2">
                                                                    <label className="text-[11px] font-black text-on-surface uppercase tracking-tight ml-1">Phone Number Column</label>
                                                                    <select 
                                                                        className="w-full bg-white border border-outline-variant/10 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                                                                        value={newCampaign.csvMapping.phone}
                                                                        onChange={(e) => setNewCampaign({...newCampaign, csvMapping: {...newCampaign.csvMapping, phone: e.target.value}})}
                                                                    >
                                                                        <option value="">-- Select Column --</option>
                                                                        {newCampaign.csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                                                                    </select>
                                                                </div>
                                                                {newCampaign.csvMapping.variables.map((v, vIdx) => (
                                                                    <div key={vIdx} className="space-y-2">
                                                                        <label className="text-[11px] font-black text-on-surface uppercase tracking-tight ml-1">Variable {'{{' + (vIdx + 1) + '}}'} Column</label>
                                                                        <select 
                                                                            className="w-full bg-white border border-outline-variant/10 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                                                                            value={v}
                                                                            onChange={(e) => {
                                                                                const updatedVars = [...newCampaign.csvMapping.variables];
                                                                                updatedVars[vIdx] = e.target.value;
                                                                                setNewCampaign({...newCampaign, csvMapping: {...newCampaign.csvMapping, variables: updatedVars}});
                                                                            }}
                                                                        >
                                                                            <option value="">-- Select Column --</option>
                                                                            {newCampaign.csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                                                                        </select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="bg-surface-container-low rounded-[2rem] p-8">
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-6">Data Preview</h4>
                                                            <div className="space-y-3 overflow-hidden">
                                                                {newCampaign.csvData.rows.slice(0, 5).map((row, i) => (
                                                                    <div key={i} className="bg-white/50 p-4 rounded-xl text-xs flex justify-between gap-4 border border-outline-variant/5">
                                                                        <span className="font-bold truncate flex-1">{row[newCampaign.csvMapping.phone] || '(Pending Phone)'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="max-w-2xl mx-auto space-y-12 py-10">
                                        <div className="text-center space-y-3">
                                            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                                                <span className="material-symbols-outlined text-5xl">rocket_launch</span>
                                            </div>
                                            <h4 className="text-3xl font-headline font-black text-on-surface tracking-tight">Ready to launch?</h4>
                                            <p className="text-on-surface-variant font-medium">Please review the details below before starting the broadcast.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 text-center">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-2">Campaign Size</p>
                                                <p className="text-4xl font-headline font-black text-on-surface">
                                                    {newCampaign.audienceType === 'manual' ? newCampaign.audience.filter(a => a.phone).length : newCampaign.csvData?.rows.length || 0}
                                                </p>
                                                <p className="text-[10px] font-bold text-on-surface uppercase tracking-tight mt-2 italic">Total Recipients</p>
                                            </div>
                                            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 text-center">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-2">Template</p>
                                                <p className="text-xl font-headline font-black text-on-surface truncate">{getSelectedTemplate()?.name}</p>
                                                <p className="text-[10px] font-bold text-on-surface uppercase tracking-tight mt-2 italic">{getSelectedTemplate()?.language?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-surface-container-low flex justify-between items-center border-t border-outline-variant/10">
                                <button 
                                    onClick={() => setStep(step - 1)}
                                    disabled={step === 1 || formLoading}
                                    className="px-10 py-4 rounded-full font-headline font-bold text-sm bg-surface-container-highest text-on-surface-variant hover:bg-surface-container transition-all"
                                >
                                    Back
                                </button>
                                <div className="flex gap-4">
                                    {step < 3 ? (
                                        <button 
                                            onClick={() => setStep(step + 1)}
                                            disabled={step === 1 && (!newCampaign.name || !newCampaign.template_id)}
                                            className="px-12 py-4 rounded-full font-headline font-bold text-sm bg-on-surface text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                                        >
                                            Next Step
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleLaunch}
                                            disabled={formLoading}
                                            className="px-12 py-4 rounded-full font-headline font-bold text-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {formLoading ? 'Launching...' : 'Confirm & Launch'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
