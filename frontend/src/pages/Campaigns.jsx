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
    const [metaAnalytics, setMetaAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
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
        csvMapping: { countryCode: '', phone: '', variables: [] },
        scheduled: false,
        scheduled_at: null,
        mediaFile: null
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
            csvMapping: { countryCode: '', phone: '', variables: new Array(uniqueVarCount).fill('') },
            mediaFile: null
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

    const downloadSampleCsv = () => {
        const selectedTemplate = templates.find(t => t.id === parseInt(newCampaign.template_id));
        const category = (selectedTemplate?.category || 'MARKETING').toUpperCase();

        // Extract body variables from the template body text
        let bodyText = '';
        if (Array.isArray(selectedTemplate?.content)) {
            bodyText = selectedTemplate.content.find(c => c.type === 'BODY')?.text || '';
        }
        const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
        const varCount = new Set(matches).size;

        // NOTE: We always use separate "Country Code" and "Phone Number" columns
        // to avoid Excel showing long numbers in scientific notation (e.g. 9.19E+11).
        // Country Code = e.g. 91 (India), Phone Number = 10-digit local number.

        let headers = '';
        let sampleRow = '';

        if (category === 'AUTHENTICATION') {
            // Authentication only needs phone + OTP
            headers = 'Country Code,Phone Number,OTP Code';
            sampleRow = '91,9876543210,482910';
        } else if (category === 'UTILITY') {
            // Named columns matching typical utility template variables
            const utilityVarNames = ['Customer Name', 'Order Number', 'Amount', 'Date', 'Status', 'Tracking ID'];
            const varHeaders = Array.from({ length: varCount }, (_, i) => utilityVarNames[i] || `Var ${i + 1}`).join(',');
            headers = `Country Code,Phone Number${varCount > 0 ? ',' + varHeaders : ''}`;
            const sampleVals = Array.from({ length: varCount }, (_, i) => {
                const vals = ['Rahul Sharma', 'ORD-29821', '2499', 'July 5 2026', 'Shipped', 'TRK-881234'];
                return `"${vals[i] || 'Value'}"`;
            }).join(',');
            sampleRow = `91,9876543210${varCount > 0 ? ',' + sampleVals : ''}`;
        } else {
            // Marketing — generic var columns
            const varHeaders = Array.from({ length: varCount }, (_, i) => `Var ${i + 1}`).join(',');
            headers = `Country Code,Phone Number,Name${varCount > 0 ? ',' + varHeaders : ''}`;
            const sampleVals = Array.from({ length: varCount }, () => 'Value').join(',');
            sampleRow = `91,9876543210,"Priya Mehta"${varCount > 0 ? ',' + sampleVals : ''}`;
        }

        const csvContent = `${headers}\n${sampleRow}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const templateName = selectedTemplate?.name || 'campaign';
        a.download = `sample_${category.toLowerCase()}_${templateName.replace(/\s+/g, '_')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

    };

    const handleLaunch = async () => {
        setFormLoading(true);
        setMessage({ type: '', text: '' });

        try {
            let finalAudience = [];
            if (newCampaign.audienceType === 'manual') {
                finalAudience = newCampaign.audience.map(a => ({
                    phone: String(a.phone || '').replace(/[^0-9+]/g, ''),
                    variables: a.variables || []
                })).filter(a => a.phone);
            } else {
                if (!newCampaign.csvData || !newCampaign.csvData.rows) {
                    throw new Error("Please upload a CSV file and map the columns.");
                }
                // Map CSV rows using mapping state
                finalAudience = newCampaign.csvData.rows.map(row => {
                    const countryCodeStr = newCampaign.csvMapping.countryCode ? row[newCampaign.csvMapping.countryCode] : '';
                    const phoneStr = newCampaign.csvMapping.phone ? row[newCampaign.csvMapping.phone] : '';
                    
                    const countryCode = String(countryCodeStr || '').replace(/[^0-9+]/g, '');
                    const rawPhone = String(phoneStr || '').replace(/[^0-9+]/g, '');
                    
                    return {
                        phone: countryCode + rawPhone,
                        variables: (newCampaign.csvMapping.variables || []).map(header => header ? (row[header] || '') : '')
                    };
                }).filter(a => a.phone);
            }

            if (finalAudience.length === 0) {
                throw new Error("No valid phone numbers found in audience. Please check your CSV mapping.");
            }

            const formData = new FormData();
            formData.append('name', newCampaign.name);
            formData.append('template_id', newCampaign.template_id);
            formData.append('audience', JSON.stringify(finalAudience));
            
            if (newCampaign.scheduled && newCampaign.scheduled_at) {
                formData.append('scheduled_at', new Date(newCampaign.scheduled_at).toISOString());
            }

            if (newCampaign.mediaFile) {
                formData.append('file', newCampaign.mediaFile);
            }

            await api.post('/campaigns', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Campaign launched successfully!' });
            setTimeout(() => {
                setShowModal(false);
                setStep(1);
                setNewCampaign(initialCampaignState);
                fetchCampaigns();
            }, 1500);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to launch campaign' });
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

    const renderFormattedText = (text) => {
        if (!text) return null;
        
        let parts = text.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_|~.*?~)/g);
        
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <strong key={i}>{part.slice(1, -1)}</strong>;
            }
            if (part.startsWith('_') && part.endsWith('_')) {
                return <em key={i}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('~') && part.endsWith('~')) {
                return <del key={i}>{part.slice(1, -1)}</del>;
            }
            return part;
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
                                                campaign.status === 'running' ? 'bg-sky-50 text-sky-700 animate-pulse' : 
                                                campaign.status === 'scheduled' ? 'bg-amber-50 text-amber-700' :
                                                'bg-surface-container-highest text-on-surface-variant'
                                            }`}>
                                                <span className="material-symbols-outlined text-xs">
                                                    {campaign.status === 'completed' ? 'check_circle' : 
                                                     campaign.status === 'running' ? 'sync' : 
                                                     campaign.status === 'scheduled' ? 'schedule' : 'draft'}
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
                                                onClick={async () => {
                                                    setSelectedCampaign(campaign);
                                                    setMetaAnalytics(null);
                                                    setShowStatsModal(true);
                                                    setAnalyticsLoading(true);
                                                    try {
                                                        const res = await api.get(`/campaigns/${campaign.id}/analytics`);
                                                        setMetaAnalytics(res.data.meta_analytics || null);
                                                        // Merge fresh logs into campaign
                                                        setSelectedCampaign(prev => ({
                                                            ...prev,
                                                            logs: res.data.local_logs || prev.logs
                                                        }));
                                                    } catch (err) {
                                                        console.error('Analytics fetch failed:', err);
                                                    } finally {
                                                        setAnalyticsLoading(false);
                                                    }
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
            {showStatsModal && selectedCampaign && (() => {
                const logs = selectedCampaign.logs || [];
                const audience = selectedCampaign.audience || [];
                const totalAudience = selectedCampaign.audience_count || 0;

                // --- Use pre-parsed data from backend (summary + daily + button_clicks) ---
                // Backend now returns: { summary:{sent,delivered,read,replied,clicked}, daily:[{date,sent,delivered,read,clicked}], button_clicks:[{label,type,count}] }
                const summary      = metaAnalytics?.summary || null;
                const metaDaily    = metaAnalytics?.daily   || [];
                const metaBtns     = metaAnalytics?.button_clicks || [];

                const hasMeta = summary && (summary.sent > 0 || summary.delivered > 0 || summary.read > 0);

                // Stat numbers — prefer Meta, fallback to local DB
                const sentCount      = hasMeta ? summary.sent      : logs.filter(l => l.status !== 'failed').length;
                const deliveredCount = hasMeta ? summary.delivered : logs.filter(l => l.status === 'delivered' || l.status === 'read').length;
                const readCount      = hasMeta ? summary.read      : logs.filter(l => l.status === 'read').length;
                const clickedCount   = hasMeta ? (summary.clicked || 0) : 0;
                const failedCount    = logs.filter(l => l.status === 'failed').length;
                const readRate       = sentCount > 0 ? ((readCount / sentCount) * 100).toFixed(0) : 0;

                // Chart data — prefer Meta daily breakdown, else local DB logs
                let chartDates, chartData;
                if (hasMeta && metaDaily.length > 0) {
                    chartDates = metaDaily.map(d => d.date);
                    chartData  = metaDaily; // each: {date, sent, delivered, read, clicked}
                } else {
                    const dateMap = {};
                    logs.forEach(l => {
                        const date = l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
                        if (!dateMap[date]) dateMap[date] = { sent: 0, delivered: 0, read: 0, clicked: 0 };
                        if (l.status !== 'failed') dateMap[date].sent++;
                        if (l.status === 'delivered' || l.status === 'read') dateMap[date].delivered++;
                        if (l.status === 'read') dateMap[date].read++;
                    });
                    chartDates = Object.keys(dateMap);
                    chartData  = chartDates.map(d => dateMap[d]);
                }

                const maxVal = Math.max(...chartData.map(d => Math.max(d.sent || 0, d.delivered || 0, d.read || 0)), 1);

                const chartW = 600, chartH = 180, padL = 36, padR = 20, padT = 10, padB = 30;
                const innerW = chartW - padL - padR;
                const innerH = chartH - padT - padB;
                const toX = (i) => padL + (chartDates.length <= 1 ? innerW / 2 : (i / (chartDates.length - 1)) * innerW);
                const toY = (v) => padT + innerH - ((v || 0) / maxVal) * innerH;
                const makePath = (key) => {
                    if (chartDates.length === 0) return '';
                    if (chartDates.length === 1) {
                        const y = toY(chartData[0][key] || 0).toFixed(1);
                        return `M ${padL} ${y} L ${padL + innerW} ${y}`;
                    }
                    return chartDates.map((_, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(chartData[i][key] || 0).toFixed(1)}`).join(' ');
                };

                // Error breakdown from local DB logs
                const errorMap = {};
                logs.filter(l => l.status === 'failed' && l.error_message).forEach(l => {
                    errorMap[l.error_message] = (errorMap[l.error_message] || 0) + 1;
                });
                const errors = Object.entries(errorMap).map(([msg, count]) => ({ msg, count }));

                // Button clicks — from Meta if available, else template buttons list
                const templateContent = selectedCampaign.template?.content || [];
                const templateButtons = templateContent.find(c => c.type === 'BUTTONS')?.buttons?.filter(b => b.type === 'URL') || [];

                const downloadLogsCsv = (type) => {
                    let filteredAudience = audience;
                    if (type === 'failed') {
                        filteredAudience = audience.filter(entry => {
                            const log = logs.find(l => l.number === entry.phone);
                            return log && log.status === 'failed';
                        });
                    }

                    if (filteredAudience.length === 0) {
                        alert(`No ${type} records found to download.`);
                        return;
                    }

                    // Build headers dynamically based on variables length
                    const maxVars = Math.max(...filteredAudience.map(a => a.variables?.length || 0));
                    const varHeaders = Array.from({length: maxVars}, (_, i) => `Var ${i + 1}`).join(',');
                    const headers = `Phone Number${varHeaders ? ',' + varHeaders : ''}${type === 'all' ? ',Status,Error Message' : ''}`;

                    const csvRows = filteredAudience.map(entry => {
                        const log = logs.find(l => l.number === entry.phone);
                        const vars = (entry.variables || []).map(v => `"${(v||'').replace(/"/g, '""')}"`).join(',');
                        let row = `"${entry.phone}"${vars ? ',' + vars : ''}`;
                        
                        const missingVarsCount = maxVars - (entry.variables?.length || 0);
                        if (missingVarsCount > 0) {
                            row += ','.repeat(missingVarsCount);
                        }

                        if (type === 'all') {
                            row += `,"${log?.status || 'pending'}","${(log?.error_message || '').replace(/"/g, '""')}"`;
                        }
                        return row;
                    });

                    const csvContent = headers + '\n' + csvRows.join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedCampaign.name}_${type}_logs.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                };

                return (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[2rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)] bg-surface border border-outline-variant/10">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-outline-variant/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                                    <span className="material-symbols-outlined text-lg text-primary">trending_up</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-on-surface tracking-tight leading-tight">{selectedCampaign.name}</h3>
                                        {analyticsLoading ? (
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full animate-pulse bg-amber-500/10 text-amber-600 dark:text-amber-400">Fetching from Meta…</span>
                                        ) : metaAnalytics ? (
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary">✓ Live from Meta</span>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-surface-container-highest text-on-surface-variant">Local Data</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Delivery Performance & Logs</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => downloadLogsCsv('failed')}
                                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                                        title="Download CSV for failed numbers only"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                        Failed Report
                                    </button>
                                    <button 
                                        onClick={() => downloadLogsCsv('all')}
                                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5"
                                        title="Download full CSV report"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                        Full Report
                                    </button>
                                </div>
                                <div className="h-6 w-px bg-outline-variant/20"></div>
                                <button 
                                    onClick={() => setShowStatsModal(false)} 
                                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-surface-container hover:bg-surface-container-highest text-on-surface-variant"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: 'var(--color-outline-variant) transparent'}}>
                            <div className="p-7 space-y-6">

                                {/* Stat Cards */}
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {analyticsLoading ? (
                                        Array.from({length: 6}).map((_, i) => (
                                            <div key={i} className="rounded-2xl p-5 animate-pulse bg-surface-container-low border border-outline-variant/10 min-h-[80px]"></div>
                                        ))
                                    ) : [
                                        { label: 'Total Audience', count: totalAudience, color: 'text-on-surface' },
                                        { label: 'Sent', count: sentCount, color: 'text-fuchsia-500' },
                                        { label: 'Delivered', count: deliveredCount, color: 'text-sky-500' },
                                        { label: 'Read', count: readCount, color: 'text-emerald-500', sub: `${readRate}%` },
                                        { label: 'Clicked', count: clickedCount, color: 'text-orange-500' },
                                        { label: 'Failed', count: failedCount, color: 'text-rose-500' },
                                    ].map((stat, i) => (
                                        <div key={i} className="rounded-2xl p-5 bg-surface-container-low border border-outline-variant/10">
                                            <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-on-surface-variant/70">{stat.label}</p>
                                            <div className="flex items-end gap-2">
                                                <span className={`text-3xl font-black leading-none ${stat.color}`}>{stat.count}</span>
                                                {stat.sub && <span className="text-sm font-bold mb-0.5 text-on-surface-variant/70">{stat.sub}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Performance Chart */}
                                <div className="rounded-2xl p-6 bg-surface-container-low border border-outline-variant/10">
                                    <h4 className="text-sm font-black text-on-surface mb-1">Performance</h4>
                                    <p className="text-[10px] font-medium mb-5 text-on-surface-variant/70">Message delivery trend over time</p>
                                    
                                    {chartDates.length > 0 ? (
                                        <div>
                                            {/* Mini stat row */}
                                            <div className="grid grid-cols-4 gap-4 mb-6">
                                                {[
                                                    { label: 'Messages sent', val: sentCount, color: '#d946ef' },
                                                    { label: 'Messages delivered', val: deliveredCount, color: '#0ea5e9' },
                                                    { label: 'Messages read', val: `${readCount} (${readRate}%)`, color: '#10b981' },
                                                    { label: 'Button clicks', val: clickedCount || '—', color: '#f97316' },
                                                ].map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-3 h-0.5 rounded-full flex-shrink-0" style={{background: m.color}}></div>
                                                        <div>
                                                            <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/70">{m.label}</p>
                                                            <p className="text-base font-black text-on-surface">{m.val}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* SVG Chart */}
                                            <div className="overflow-x-auto">
                                                <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{width: '100%', minWidth: '320px', height: `${chartH}px`}}>
                                                    {/* Grid lines */}
                                                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                                                        <g key={i}>
                                                            <line x1={padL} y1={padT + innerH * (1-pct)} x2={padL + innerW} y2={padT + innerH * (1-pct)} stroke="var(--color-outline-variant)" opacity="0.2" strokeWidth="1"/>
                                                            <text x={padL - 4} y={padT + innerH * (1-pct) + 4} textAnchor="end" fontSize="8" fill="var(--color-on-surface-variant)" opacity="0.6">{Math.round(maxVal * pct)}</text>
                                                        </g>
                                                    ))}
                                                    {/* X-axis labels */}
                                                    {chartDates.map((date, i) => (
                                                        <text key={i} x={toX(i)} y={chartH - 4} textAnchor="middle" fontSize="8" fill="var(--color-on-surface-variant)" opacity="0.6">{date}</text>
                                                    ))}
                                                    {/* Lines */}
                                                    <path d={makePath('sent')} fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d={makePath('delivered')} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d={makePath('read')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    {/* Dots */}
                                                    {chartDates.map((_, i) => (
                                                        <g key={i}>
                                                            <circle cx={toX(i)} cy={toY(chartData[i].sent)} r="3" fill="#d946ef"/>
                                                            <circle cx={toX(i)} cy={toY(chartData[i].delivered)} r="3" fill="#0ea5e9"/>
                                                            <circle cx={toX(i)} cy={toY(chartData[i].read)} r="3" fill="#10b981"/>
                                                        </g>
                                                    ))}
                                                </svg>
                                            </div>
                                            {/* Legend */}
                                            <div className="flex gap-6 mt-3">
                                                {[['#d946ef','Messages sent'],['#0ea5e9','Messages delivered'],['#10b981','Messages read'],['#22c55e','Unique replies']].map(([c,l],i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <div className="w-6 h-0.5 rounded-full" style={{background: c}}></div>
                                                        <span className="text-[9px] font-medium text-on-surface-variant/70">{l}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 text-on-surface-variant/40">
                                            <div className="text-center">
                                                <span className="material-symbols-outlined text-4xl block mb-2">bar_chart</span>
                                                <p className="text-xs font-bold">No data yet — logs will appear once messages are sent</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Error Messages Breakdown */}
                                {errors.length > 0 && (
                                    <div className="rounded-2xl p-6 bg-surface-container-low border border-outline-variant/10">
                                        <h4 className="text-sm font-black text-on-surface mb-1">Error Messages</h4>
                                        <p className="text-[10px] font-medium mb-5 text-on-surface-variant/70">Breakdown of failed message reasons</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {errors.map((err, i) => {
                                                const colors = ['#f43f5e','#f97316','#eab308','#a855f7'];
                                                const col = colors[i % colors.length];
                                                return (
                                                    <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-surface-container border border-outline-variant/10">
                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background: col}}></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-on-surface truncate">{err.msg}</p>
                                                        </div>
                                                        <span className="text-base font-black flex-shrink-0" style={{color: col}}>{err.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Button Clicks */}
                                {(metaBtns.length > 0 || templateButtons.length > 0) && (
                                    <div className="rounded-2xl p-6 bg-surface-container-low border border-outline-variant/10">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-black text-on-surface">Button Clicks</h4>
                                            {metaBtns.length > 0 && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary">From Meta</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-medium mb-4 text-on-surface-variant/70">URL button click performance</p>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-outline-variant/10">
                                                    {['Label','Type','Total Clicks','Click Rate'].map(h => (
                                                        <th key={h} className="pb-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/70">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metaBtns.length > 0 ? metaBtns.map((btn, i) => {
                                                    const clickRate = sentCount > 0 ? ((btn.count / sentCount) * 100).toFixed(2) + '%' : '—';
                                                    return (
                                                        <tr key={i} className="border-b border-outline-variant/5 last:border-0">
                                                            <td className="py-3 text-sm font-bold text-on-surface">{btn.label}</td>
                                                            <td className="py-3 text-xs font-medium text-on-surface-variant/70">{btn.type}</td>
                                                            <td className="py-3 text-sm font-black text-orange-500">{btn.count}</td>
                                                            <td className="py-3 text-xs font-bold text-primary">{clickRate}</td>
                                                        </tr>
                                                    );
                                                }) : templateButtons.map((btn, i) => (
                                                    <tr key={i} className="border-b border-outline-variant/5 last:border-0">
                                                        <td className="py-3 text-sm font-bold text-on-surface">{btn.text}</td>
                                                        <td className="py-3 text-xs font-medium text-on-surface-variant/70">Website click</td>
                                                        <td className="py-3 text-sm font-bold text-on-surface-variant/40">—</td>
                                                        <td className="py-3 text-xs font-medium text-on-surface-variant/40">—</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}


                                {/* Recipient Logs Table */}
                                <div className="rounded-2xl overflow-hidden border border-outline-variant/10">
                                    <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/10">
                                        <h4 className="text-sm font-black text-on-surface">Recipient Logs</h4>
                                        <p className="text-[10px] font-medium text-on-surface-variant/70">Individual delivery status per contact</p>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-surface-container-highest/30 border-b border-outline-variant/10">
                                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/70">Recipient</th>
                                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/70">Variables</th>
                                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/70">Status</th>
                                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-right text-on-surface-variant/70">Message ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {audience.map((entry, idx) => {
                                                const log = logs.find(l => l.number === entry.phone);
                                                const statusColors = {
                                                    read: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
                                                    delivered: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20' },
                                                    failed: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
                                                    sent: { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', border: 'border-outline-variant/10' },
                                                };
                                                const sc = statusColors[log?.status] || statusColors.sent;
                                                return (
                                                    <tr key={idx} className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/50 last:border-0">
                                                        <td className="px-6 py-4 text-sm font-bold text-on-surface">{entry.phone}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {(entry.variables || []).map((v, vi) => (
                                                                    <span key={vi} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-container-highest text-on-surface-variant">
                                                                        {v}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${sc.bg} ${sc.text} ${sc.border}`}>
                                                                    {log?.status || 'Pending'}
                                                                </span>
                                                                {log?.status === 'failed' && log?.error_message && (
                                                                    <span className="text-[10px] font-medium leading-tight max-w-[220px] text-rose-500">
                                                                        {log.error_message}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-[10px] text-on-surface-variant/40">
                                                            {log?.message_id ? `${log.message_id.substring(0, 40)}…` : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 flex justify-end flex-shrink-0 border-t border-outline-variant/10 bg-surface-container-low">
                            <button 
                                onClick={() => setShowStatsModal(false)}
                                className="px-8 py-3 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80 border border-outline-variant/10"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}



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
                                            {(() => {
                                                const selectedTemplate = getSelectedTemplate();
                                                const hasMedia = selectedTemplate?.content?.some(c => c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format));
                                                if (!hasMedia) return null;
                                                return (
                                                    <div className="space-y-2 animate-in fade-in">
                                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Attach Media for Template</label>
                                                        <input 
                                                            type="file" 
                                                            className="w-full bg-surface-container-low border-none rounded-[1.5rem] py-5 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                                            onChange={(e) => setNewCampaign({...newCampaign, mediaFile: e.target.files[0]})}
                                                        />
                                                    </div>
                                                );
                                            })()}
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
                                                    
                                                    {newCampaign.mediaFile && newCampaign.mediaFile.type.startsWith('image/') && (
                                                        <img 
                                                            src={URL.createObjectURL(newCampaign.mediaFile)} 
                                                            alt="Preview" 
                                                            className="w-full h-auto rounded-xl mb-2 max-h-48 object-cover"
                                                        />
                                                    )}
                                                    {newCampaign.mediaFile && newCampaign.mediaFile.type.startsWith('video/') && (
                                                        <video 
                                                            src={URL.createObjectURL(newCampaign.mediaFile)} 
                                                            controls
                                                            className="w-full h-auto rounded-xl mb-2 max-h-48 object-cover"
                                                        />
                                                    )}

                                                    <p className="text-sm text-on-surface leading-normal whitespace-pre-wrap font-medium">
                                                        {renderFormattedText(getSelectedTemplate()?.content?.find(c => c.type === 'BODY')?.text)}
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
                                                    <div className="space-y-6 animate-in fade-in duration-500">
                                                        <div className="flex justify-between items-center px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-xl">description</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-headline font-extrabold text-on-surface">Data Format Requirement</p>
                                                                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Format your CSV properly for automatic mapping</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={downloadSampleCsv}
                                                                className="px-6 py-3 rounded-2xl bg-surface-container-low text-primary font-headline font-bold text-xs hover:bg-surface-container-highest transition-all flex items-center gap-2 border border-primary/20 shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">download</span>
                                                                Download Sample Format
                                                            </button>
                                                        </div>

                                                        <div className="border-4 border-dashed border-outline-variant/20 rounded-[3rem] p-24 flex flex-col items-center justify-center gap-8 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden bg-surface-container-lowest">
                                                            <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleCsvUpload} />
                                                            <div className="w-24 h-24 rounded-[2.5rem] bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-inner">
                                                                <span className="material-symbols-outlined text-5xl font-light">upload_file</span>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-headline font-black text-on-surface tracking-tight">Drop your audience file here</p>
                                                                <p className="text-sm text-on-surface-variant mt-2 font-medium">Max 10,000 rows • First row must be headers</p>
                                                            </div>
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
                                                                    <label className="text-[11px] font-black text-on-surface uppercase tracking-tight ml-1">Country Code Column</label>
                                                                    <select 
                                                                        className="w-full bg-white border border-outline-variant/10 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                                                                        value={newCampaign.csvMapping.countryCode}
                                                                        onChange={(e) => setNewCampaign({...newCampaign, csvMapping: {...newCampaign.csvMapping, countryCode: e.target.value}})}
                                                                    >
                                                                        <option value="">-- No Country Code Column --</option>
                                                                        {newCampaign.csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                                                                    </select>
                                                                </div>
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

                                        <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-on-surface">Schedule Campaign</h4>
                                                    <p className="text-[10px] text-on-surface-variant font-medium">Choose when to start the broadcast</p>
                                                </div>
                                                <button 
                                                    onClick={() => setNewCampaign({...newCampaign, scheduled: !newCampaign.scheduled})}
                                                    className={`w-14 h-8 rounded-full transition-all relative ${newCampaign.scheduled ? 'bg-primary' : 'bg-surface-container-highest'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${newCampaign.scheduled ? 'left-7' : 'left-1'}`}></div>
                                                </button>
                                            </div>

                                            {newCampaign.scheduled && (
                                                <div className="animate-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block ml-1">Dispatch Date & Time</label>
                                                    <input 
                                                        type="datetime-local" 
                                                        className="w-full bg-white border border-outline-variant/10 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                                                        value={newCampaign.scheduled_at || ''}
                                                        onChange={(e) => setNewCampaign({...newCampaign, scheduled_at: e.target.value})}
                                                    />
                                                </div>
                                            )}
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
