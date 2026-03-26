import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
    const [formData, setFormData] = useState({
        meta_waba_id: '',
        meta_phone_number_id: '',
        meta_access_token: '',
        pusher_app_id: '',
        pusher_app_key: '',
        pusher_app_secret: '',
        pusher_app_cluster: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('api'); // api, pusher, profile

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/tenant/settings');
                const data = response.data || {};
                setFormData({
                    meta_waba_id: String(data.meta_waba_id || ''),
                    meta_phone_number_id: String(data.meta_phone_number_id || ''),
                    meta_access_token: String(data.meta_access_token || ''),
                    pusher_app_id: String(data.pusher_app_id || ''),
                    pusher_app_key: String(data.pusher_app_key || ''),
                    pusher_app_secret: String(data.pusher_app_secret || ''),
                    pusher_app_cluster: String(data.pusher_app_cluster || '')
                });
            } catch (err) {
                console.error('Failed to fetch settings', err);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.post('/tenant/settings', formData);
            setMessage('Configuration updated successfully!');
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            console.error(err);
            setMessage('Error: Unable to save configurations.');
        }
        setLoading(false);
    };

    return (
        <div className="px-10 pb-12">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Settings</h2>
                    <p className="text-on-surface-variant font-body">Configure your WhatsApp API and real-time synchronization channels.</p>
                </div>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
                    message.includes('successfully') 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'bg-error/10 text-error border border-error/20'
                }`}>
                    <span className="material-symbols-outlined">{message.includes('successfully') ? 'check_circle' : 'error'}</span>
                    <span className="font-bold text-sm tracking-tight">{message}</span>
                </div>
            )}

            <div className="grid grid-cols-12 gap-10">
                {/* Navigation Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-2">
                    <button 
                        onClick={() => setActiveTab('api')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm transition-all ${
                            activeTab === 'api' 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'text-on-surface-variant hover:bg-surface-container-low grayscale'
                        }`}
                    >
                        <span className="material-symbols-outlined">api</span>
                        Meta Cloud API
                    </button>
                    <button 
                        onClick={() => setActiveTab('pusher')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm transition-all ${
                            activeTab === 'pusher' 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'text-on-surface-variant hover:bg-surface-container-low grayscale'
                        }`}
                    >
                        <span className="material-symbols-outlined">sync</span>
                        Pusher Real-time
                    </button>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm transition-all ${
                            activeTab === 'profile' 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'text-on-surface-variant hover:bg-surface-container-low grayscale'
                        }`}
                    >
                        <span className="material-symbols-outlined">person</span>
                        Business Profile
                    </button>
                </div>

                {/* Form Area */}
                <div className="col-span-12 lg:col-span-9">
                    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-[0px_20px_40px_rgba(20,29,36,0.06)] border border-outline-variant/10">
                        {activeTab === 'api' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div>
                                    <h3 className="text-xl font-headline font-extrabold text-on-surface mb-1">Meta WhatsApp Cloud API</h3>
                                    <p className="text-sm text-on-surface-variant font-medium">Link your WhatsApp Business Account credentials to start sending messages.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">WhatsApp Business Account ID</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="e.g. 17900..."
                                            value={formData.meta_waba_id}
                                            onChange={(e) => setFormData({...formData, meta_waba_id: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Phone Number ID</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="e.g. 10642..."
                                            value={formData.meta_phone_number_id}
                                            onChange={(e) => setFormData({...formData, meta_phone_number_id: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Permanent Access Token</label>
                                        <div className="relative">
                                            <input 
                                                type="password"
                                                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                                placeholder="EAAaJ..."
                                                value={formData.meta_access_token}
                                                onChange={(e) => setFormData({...formData, meta_access_token: e.target.value})}
                                            />
                                            <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-primary transition-colors">visibility</span>
                                        </div>
                                        <p className="text-[10px] text-on-surface-variant font-medium px-1 italic">This token should have <code className="text-primary font-bold">whatsapp_business_messaging</code> and <code className="text-primary font-bold">whatsapp_business_management</code> permissions.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pusher' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div>
                                    <h3 className="text-xl font-headline font-extrabold text-on-surface mb-1">Real-time Synchronization</h3>
                                    <p className="text-sm text-on-surface-variant font-medium">Configure Pusher to enable instant message updates in the Team Inbox.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">App ID</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Pusher App ID"
                                            value={formData.pusher_app_id}
                                            onChange={(e) => setFormData({...formData, pusher_app_id: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">App Key</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Pusher Key"
                                            value={formData.pusher_app_key}
                                            onChange={(e) => setFormData({...formData, pusher_app_key: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">App Secret</label>
                                        <input 
                                            type="password"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Pusher Secret"
                                            value={formData.pusher_app_secret}
                                            onChange={(e) => setFormData({...formData, pusher_app_secret: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">App Cluster</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="e.g. ap2"
                                            value={formData.pusher_app_cluster}
                                            onChange={(e) => setFormData({...formData, pusher_app_cluster: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div>
                                    <h3 className="text-xl font-headline font-extrabold text-on-surface mb-1">Business Profile</h3>
                                    <p className="text-sm text-on-surface-variant font-medium">Update your business details that appear to customers on WhatsApp.</p>
                                </div>
                                
                                <div className="p-12 border-2 border-dashed border-outline-variant/30 rounded-[2rem] text-center flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant opacity-20">
                                        <span className="material-symbols-outlined text-5xl">storefront</span>
                                    </div>
                                    <p className="text-on-surface-variant font-bold text-sm">Business profile management coming soon.</p>
                                    <p className="text-xs text-on-surface-variant/60 max-w-[240px]">This feature will allow you to sync your WhatsApp display name and profile picture directly from here.</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-on-surface-variant opacity-60">
                                <span className="material-symbols-outlined text-lg">verified_user</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Storage</span>
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-headline font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:grayscale disabled:opacity-50 flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined">{loading ? 'sync' : 'save'}</span>
                                {loading ? 'Saving Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
