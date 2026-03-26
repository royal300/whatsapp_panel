import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ 
        contacts: 0, 
        totalSent: 0, 
        readRate: 0, 
        campaigns: [] 
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [contactsRes, campaignsRes] = await Promise.all([
                    api.get('/contacts'),
                    api.get('/campaigns')
                ]);
                
                const campaigns = campaignsRes.data || [];
                const totalSent = campaigns.reduce((acc, c) => acc + (c.audience_count || 0), 0);
                const totalRead = campaigns.reduce((acc, c) => acc + (c.logs?.filter(l => l.status === 'read').length || 0), 0);
                const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

                setStats({
                    contacts: contactsRes.data.length || 0,
                    totalSent,
                    readRate,
                    campaigns: campaigns.slice(0, 3) 
                });
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            }
            setLoading(false);
        };
        if (user) fetchData();
    }, [user]);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Operations Overview</h2>
                    <p className="text-on-surface-variant mt-1">Real-time performance across your WhatsApp channels.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low text-on-surface-variant rounded-xl font-semibold text-sm hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        Live Dashboard
                    </button>
                    <button 
                        onClick={() => navigate('/campaigns?create=true')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Campaign
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium border border-outline-variant/5 premium-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </div>
                        <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                            <span className="material-symbols-outlined text-sm mr-1">check</span>
                            Active
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-sm font-medium">Total Messages Sent</p>
                    <h3 className="text-3xl font-extrabold text-on-surface mt-1">{loading ? '...' : formatNumber(stats.totalSent)}</h3>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium border border-outline-variant/5 premium-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                        </div>
                        <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                            <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                            Grow
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-sm font-medium">Total Audience</p>
                    <h3 className="text-3xl font-extrabold text-on-surface mt-1">{loading ? '...' : stats.contacts}</h3>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium border border-outline-variant/5 premium-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                        </div>
                        <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                            <span className="material-symbols-outlined text-sm mr-1">insights</span>
                            Healthy
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-sm font-medium">Avg Read Rate</p>
                    <h3 className="text-3xl font-extrabold text-on-surface mt-1">{loading ? '...' : stats.readRate.toFixed(1)}%</h3>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium border border-outline-variant/5 premium-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                        </div>
                        <span className="flex items-center text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full">
                            Quota
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-sm font-medium">Active Campaigns</p>
                    <h3 className="text-3xl font-extrabold text-on-surface mt-1">{loading ? '...' : stats.campaigns.length}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-premium border border-outline-variant/5">
                    <h3 className="text-xl font-bold font-headline mb-4">Performance Trends</h3>
                    <div className="h-64 flex items-end gap-2 px-2">
                         {loading ? (
                             <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20">Analyzing trends...</div>
                         ) : stats.campaigns.length === 0 ? (
                             <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                                 <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                                 <p className="text-xs font-bold">Launch a campaign to see insights</p>
                             </div>
                         ) : (
                             stats.campaigns.concat(stats.campaigns).slice(0, 12).map((c, i) => (
                                 <div 
                                    key={i} 
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t-lg transition-all group relative cursor-pointer" 
                                    style={{height: `${Math.max(30, (c.logs?.filter(l => l.status === 'read').length / (c.audience_count || 1)) * 100)}%`}}
                                 >
                                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                         {c.name}
                                     </div>
                                 </div>
                             ))
                         )}
                    </div>
                    <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                        <span>Past Campaigns</span>
                        <span>Latest Actions</span>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-premium border border-outline-variant/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold font-headline">Recent Broadcasts</h3>
                        <button className="text-xs font-bold text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 animate-pulse text-on-surface-variant">Retrieving history...</div>
                        ) : stats.campaigns.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-2xl text-center text-on-surface-variant/40">
                                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                <p className="text-xs font-bold italic">No recent activity detected</p>
                            </div>
                        ) : (
                            stats.campaigns.map(campaign => (
                                <div key={campaign.id} className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-transparent hover:border-primary/10">
                                     <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold text-on-surface">{campaign.name}</p>
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                                     </div>
                                     <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                         {new Date(campaign.created_at).toLocaleDateString()} • {campaign.audience_count || 0} Audiance • {((campaign.logs?.filter(l => l.status === 'read').length / (campaign.audience_count || 1)) * 100).toFixed(0)}% Read
                                     </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
