import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const Analytics = () => {
    const { darkMode } = useTheme();
    const [data, setData] = useState({
        stats: {
            totalSent: 0,
            totalDelivered: 0,
            totalRead: 0,
            totalFailed: 0,
            deliveryRate: 0,
            readRate: 0,
            engagementRate: 0,
            failureRate: 0
        },
        chartData: [],
        usage: {
            limit: 10000,
            used: 0,
            plan: 'Premium'
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.get('/analytics');
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, []);

    const usagePercentage = data.usage.limit === 'Unlimited' 
        ? 0 
        : Math.min(((data.usage.used / data.usage.limit) * 100).toFixed(0), 100);

    return (
        <div className="px-10 pb-12 animate-fade-in font-body">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-1">Campaign Performance</h2>
                    <p className="text-on-surface-variant text-sm">Real-time delivery insights across your active nodes.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-xl bg-surface-container-lowest text-sm font-bold shadow-sm hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    Last 30 Days
                </button>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 mb-12">
                {/* Left: Chart */}
                <div className="flex-1 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold font-headline">Message Delivery Rates</h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div> Delivered</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-200"></div> Read</div>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-bold animate-pulse">Loading chart data...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#eee'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }} dy={10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="delivered" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivered)" activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Right: Metrics */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="bg-[#f0f7fb] dark:bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6 flex flex-col justify-center flex-1 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 relative z-10">Total Sent</p>
                        <h3 className="text-4xl font-headline font-black text-on-surface mb-2 relative z-10">
                            {loading ? '...' : data.stats.totalSent.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-[#fcf3f3] dark:bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-6 flex flex-col justify-center flex-1 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 relative z-10">Total Failures</p>
                        <div className="flex items-end gap-3 relative z-10">
                            <h3 className="text-4xl font-headline font-black text-on-surface">
                                {loading ? '...' : data.stats.totalFailed.toLocaleString()}
                            </h3>
                            <span className="text-sm font-bold text-red-500 mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">trending_down</span>
                                {data.stats.failureRate}%
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#25D366] rounded-[2rem] p-6 flex flex-col justify-center flex-1 shadow-lg shadow-[#25D366]/20 relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2 relative z-10">Engagement Rate</p>
                        <div className="flex items-center gap-3 relative z-10">
                            <h3 className="text-4xl font-headline font-black">
                                {loading ? '...' : `${data.stats.engagementRate}%`}
                            </h3>
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded">High</span>
                        </div>
                    </div>
                </div>
            </div>

            <header className="mb-6">
                <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface mb-1">Subscription & Usage</h2>
                <p className="text-on-surface-variant text-sm">Manage your plan and API message quotas.</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Current Plan */}
                <div className="flex-1 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-8 shadow-sm relative overflow-hidden">
                    <span className="material-symbols-outlined absolute right-4 top-4 text-[120px] text-surface-container-highest/30 rotate-12 -z-0">verified</span>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined">workspace_premium</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-headline">Current Plan: {data.usage.plan}</h3>
                                <p className="text-xs text-on-surface-variant mt-0.5">Billed monthly</p>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span> Unlimited Campaign Groups
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span> Advanced Logic Automations
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span> Priority 24/7 API Support
                            </li>
                        </ul>

                        <button className="w-full py-4 bg-emerald-200/50 hover:bg-emerald-300/50 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl transition-colors">
                            Upgrade Plan
                        </button>
                    </div>
                </div>

                {/* API Credit Usage */}
                <div className="flex-1 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold font-headline">WhatsApp API Credit Usage</h3>
                        <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly Quota</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-5xl font-black font-headline text-on-surface mb-1">
                            {loading ? '...' : data.usage.used.toLocaleString()}
                        </h2>
                        <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            <span>Messages Used</span>
                            <span>{data.usage.limit === 'Unlimited' ? 'Unlimited' : `${data.usage.limit.toLocaleString()} max`}</span>
                        </div>
                    </div>

                    <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden mb-4">
                        <div 
                            className="h-full bg-[#25D366] transition-all duration-1000 ease-out" 
                            style={{ width: `${usagePercentage}%` }}
                        ></div>
                    </div>

                    <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 mb-8">
                        <span className="material-symbols-outlined text-red-500 text-[14px]">info</span>
                        You have used {usagePercentage}% of your available credits.
                    </p>

                    <button className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        Buy More Credits
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
