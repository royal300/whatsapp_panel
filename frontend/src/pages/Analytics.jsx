import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Analytics = () => {
    const [stats, setStats] = useState({
        totalSent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        campaigns: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.get('/campaigns');
                const campaigns = res.data || [];
                
                let totalSent = 0;
                let delivered = 0;
                let read = 0;
                let failed = 0;

                campaigns.forEach(c => {
                    totalSent += (c.audience_count || 0);
                    delivered += (c.logs?.filter(l => l.status === 'delivered').length || 0);
                    read += (c.logs?.filter(l => l.status === 'read').length || 0);
                    failed += (c.logs?.filter(l => l.status === 'failed').length || 0);
                });

                setStats({
                    totalSent,
                    delivered,
                    read,
                    failed,
                    campaigns
                });
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, []);

    const kpiCards = [
        { label: 'Total Volume', value: stats.totalSent, icon: 'analytics', color: 'text-primary' },
        { label: 'Delivery Rate', value: stats.totalSent ? ((stats.delivered / stats.totalSent) * 100).toFixed(1) + '%' : '0%', icon: 'local_shipping', color: 'text-blue-500' },
        { label: 'Read Rate', value: stats.totalSent ? ((stats.read / stats.totalSent) * 100).toFixed(1) + '%' : '0%', icon: 'visibility', color: 'text-emerald-500' },
        { label: 'Failure Rate', value: stats.totalSent ? ((stats.failed / stats.totalSent) * 100).toFixed(1) + '%' : '0%', icon: 'error_outline', color: 'text-rose-500' },
    ];

    return (
        <div className="px-10 pb-12 animate-fade-in">
            <header className="mb-12">
                <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Performance Analytics</h2>
                <p className="text-on-surface-variant font-body">Deep dive into your campaign delivery and engagement metrics.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {kpiCards.map((card, i) => (
                    <div key={i} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center ${card.color}`}>
                                <span className="material-symbols-outlined">{card.icon}</span>
                            </div>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{card.label}</p>
                        <h3 className="text-3xl font-headline font-black text-on-surface">{loading ? '...' : card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/10 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-outline-variant/5 bg-surface-container-low/30">
                    <h3 className="text-lg font-bold font-headline">Campaign Breakdowns</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Campaign Name</th>
                                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Sent</th>
                                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Delivered</th>
                                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Read</th>
                                <th className="px-6 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/5">
                            {loading ? (
                                <tr><td colSpan="5" className="px-8 py-20 text-center animate-pulse font-bold text-on-surface-variant">Compiling performance data...</td></tr>
                            ) : stats.campaigns.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-20 text-center text-on-surface-variant italic">No campaign data available yet</td></tr>
                            ) : (
                                stats.campaigns.map(c => (
                                    <tr key={c.id} className="hover:bg-surface-container-low transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-on-surface">{c.name}</p>
                                            <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-tighter opacity-40">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-5 font-headline font-bold text-on-surface">{c.audience_count}</td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-blue-500">{c.logs?.filter(l => l.status === 'delivered').length || 0}</span>
                                            <span className="text-[10px] ml-1 opacity-40">({c.audience_count ? (((c.logs?.filter(l => l.status === 'delivered').length || 0) / c.audience_count) * 100).toFixed(0) : 0}%)</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-emerald-500">{c.logs?.filter(l => l.status === 'read').length || 0}</span>
                                            <span className="text-[10px] ml-1 opacity-40">({c.audience_count ? (((c.logs?.filter(l => l.status === 'read').length || 0) / c.audience_count) * 100).toFixed(0) : 0}%)</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                c.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container-highest text-on-surface-variant'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
