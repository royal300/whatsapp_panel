import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
    const [formData, setFormData] = useState({
        meta_waba_id: '',
        meta_phone_number_id: '',
        meta_access_token: '',
        meta_app_id: '',
        meta_app_secret: '',
        pusher_app_id: '',
        pusher_app_key: '',
        pusher_app_secret: '',
        pusher_app_cluster: '',
        whatsapp_display_name: '',
        whatsapp_business_description: '',
        whatsapp_business_address: '',
        whatsapp_business_email: '',
        whatsapp_business_websites: [],
        whatsapp_business_vertical: '',
        whatsapp_profile_picture_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('profile'); // Default to profile as requested
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/tenant/settings');
                const data = response.data || {};
                setFormData({
                    meta_waba_id: String(data.meta_waba_id || ''),
                    meta_phone_number_id: String(data.meta_phone_number_id || ''),
                    meta_access_token: String(data.meta_access_token || ''),
                    meta_app_id: String(data.meta_app_id || ''),
                    meta_app_secret: String(data.meta_app_secret || ''),
                    pusher_app_id: String(data.pusher_app_id || ''),
                    pusher_app_key: String(data.pusher_app_key || ''),
                    pusher_app_secret: String(data.pusher_app_secret || ''),
                    pusher_app_cluster: String(data.pusher_app_cluster || ''),
                    whatsapp_display_name: data.whatsapp_display_name || '',
                    whatsapp_business_description: data.whatsapp_business_description || '',
                    whatsapp_business_address: data.whatsapp_business_address || '',
                    whatsapp_business_email: data.whatsapp_business_email || '',
                    whatsapp_business_websites: data.whatsapp_business_websites || [],
                    whatsapp_business_vertical: data.whatsapp_business_vertical || '',
                    whatsapp_profile_picture_url: data.whatsapp_profile_picture_url || ''
                });
            } catch (err) {
                console.error('Failed to fetch settings', err);
            }
        };
        fetchSettings();
    }, []);

    const handleSyncProfile = async () => {
        setSyncing(true);
        setMessage('');
        try {
            const response = await api.post('/tenant/settings/sync-profile');
            const data = response.data.data;
            setFormData(prev => ({
                ...prev,
                whatsapp_business_description: data.whatsapp_business_description || '',
                whatsapp_business_address: data.whatsapp_business_address || '',
                whatsapp_business_email: data.whatsapp_business_email || '',
                whatsapp_business_websites: data.whatsapp_business_websites || [],
                whatsapp_business_vertical: data.whatsapp_business_vertical || '',
                whatsapp_profile_picture_url: data.whatsapp_profile_picture_url || ''
            }));
            setMessage('Profile synced from WhatsApp successfully!');
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            console.error(err);
            setMessage('Error: Failed to sync profile. Check your API credentials.');
        }
        setSyncing(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            setMessage('Error: Please select a JPG or PNG image.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage('Error: Image size should be less than 5MB.');
            return;
        }

        setUploadingLogo(true);
        setMessage('Uploading logo to WhatsApp...');
        const data = new FormData();
        data.append('logo', file);

        try {
            const resp = await api.post('/tenant/settings/logo', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setFormData(prev => ({
                ...prev,
                whatsapp_profile_picture_url: resp.data.profile_picture_url
            }));
            setMessage('Profile picture updated successfully!');
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            console.error('Logo upload error:', error);
            setMessage('Error: ' + (error.response?.data?.message || 'Failed to upload logo.'));
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await api.post('/tenant/settings', formData);
            setMessage('Configuration updated successfully!');
            
            // Update local state with fresh data from server
            const data = res.data.data;
            setFormData(prev => ({
                ...prev,
                ...data,
                meta_waba_id: String(data.meta_waba_id || ''),
                meta_phone_number_id: String(data.meta_phone_number_id || ''),
                meta_access_token: String(data.meta_access_token || '')
            }));

            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            console.error(err);
            setMessage('Error: Unable to save configurations.');
        }
        setLoading(false);
    };

    const verticals = [
        { id: 'UNDEFINED', label: 'Undefined' },
        { id: 'OTHER', label: 'Other' },
        { id: 'AUTO', label: 'Automotive' },
        { id: 'BEAUTY', label: 'Beauty & Spa' },
        { id: 'APPAREL', label: 'Apparel & Fashion' },
        { id: 'EDU', label: 'Education' },
        { id: 'ENTERTAIN', label: 'Entertainment' },
        { id: 'EVENT_PLAN', label: 'Event Planning' },
        { id: 'FINANCE', label: 'Finance' },
        { id: 'GROCERY', label: 'Grocery' },
        { id: 'GOVT', label: 'Government' },
        { id: 'HOTEL', label: 'Hotel' },
        { id: 'INSTITUTION', label: 'Public Institution' },
        { id: 'MEDICAL', label: 'Medical & Health' },
        { id: 'NONPROFIT', label: 'Non-Profit' },
        { id: 'PROF_SERVICES', label: 'Professional Services' },
        { id: 'RETAIL', label: 'Retail' },
        { id: 'TRAVEL', label: 'Travel & Tourism' },
        { id: 'RESTAURANT', label: 'Restaurant & Hospitality' },
    ];

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
                </div>

                {/* Form Area */}
                <div className="col-span-12 lg:col-span-9">
                    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-[0px_20px_40px_rgba(20,29,36,0.06)] border border-outline-variant/10">
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-headline font-extrabold text-on-surface mb-1">Business Profile</h3>
                                        <p className="text-sm text-on-surface-variant font-medium">Update your business details that appear to customers on WhatsApp.</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleSyncProfile}
                                        disabled={syncing}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low text-primary font-bold text-xs hover:bg-surface-container-medium transition-all"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
                                        {syncing ? 'Syncing...' : 'Sync from Meta'}
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Profile Image Section */}
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-6 p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10">
                                        <div 
                                            className="relative group cursor-pointer"
                                            onClick={() => !uploadingLogo && fileInputRef.current?.click()}
                                        >
                                            <div className={`w-24 h-24 rounded-full bg-primary/10 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-all ${uploadingLogo ? 'opacity-40' : ''}`}>
                                                {formData.whatsapp_profile_picture_url ? (
                                                    <img src={formData.whatsapp_profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-4xl text-primary opacity-40">storefront</span>
                                                )}
                                                {uploadingLogo && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-3xl text-primary animate-spin">refresh</span>
                                                    </div>
                                                )}
                                            </div>
                                            {!uploadingLogo && (
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-white">photo_camera</span>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleLogoUpload}
                                                className="hidden" 
                                                accept="image/jpeg,image/png"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-headline font-extrabold text-on-surface">{formData.whatsapp_display_name || 'Business Name'}</h4>
                                            <p className="text-xs text-on-surface-variant font-medium mb-2">{formData.whatsapp_business_vertical || 'Category Not Set'}</p>
                                            <div className="flex gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-tighter">
                                                    WhatsApp Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Official Display Name</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all font-headline"
                                            placeholder="Your Business Name"
                                            value={formData.whatsapp_display_name}
                                            onChange={(e) => setFormData({...formData, whatsapp_display_name: e.target.value})}
                                        />
                                        <p className="text-[10px] text-on-surface-variant opacity-60 italic ml-1">Official name changes require Meta review and approval.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Description</label>
                                        <textarea 
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                                            placeholder="Tell customers about your business..."
                                            value={formData.whatsapp_business_description}
                                            onChange={(e) => setFormData({...formData, whatsapp_business_description: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Industry / Vertical</label>
                                            <select 
                                                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                                value={formData.whatsapp_business_vertical}
                                                onChange={(e) => setFormData({...formData, whatsapp_business_vertical: e.target.value})}
                                            >
                                                <option value="">Select an industry</option>
                                                {verticals.map(v => (
                                                    <option key={v.id} value={v.id}>{v.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Contact Email</label>
                                            <input 
                                                type="email"
                                                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="business@example.com"
                                                value={formData.whatsapp_business_email}
                                                onChange={(e) => setFormData({...formData, whatsapp_business_email: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Address</label>
                                            <input 
                                                type="text"
                                                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="Street, City, Country"
                                                value={formData.whatsapp_business_address}
                                                onChange={(e) => setFormData({...formData, whatsapp_business_address: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Websites (Max 2)</label>
                                            <div className="space-y-3">
                                                <input 
                                                    type="url"
                                                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="https://example.com"
                                                    value={formData.whatsapp_business_websites[0] || ''}
                                                    onChange={(e) => {
                                                        const newWebsites = [...formData.whatsapp_business_websites];
                                                        newWebsites[0] = e.target.value;
                                                        setFormData({...formData, whatsapp_business_websites: newWebsites});
                                                    }}
                                                />
                                                <input 
                                                    type="url"
                                                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="https://another.com (Optional)"
                                                    value={formData.whatsapp_business_websites[1] || ''}
                                                    onChange={(e) => {
                                                        const newWebsites = [...formData.whatsapp_business_websites];
                                                        newWebsites[1] = e.target.value;
                                                        setFormData({...formData, whatsapp_business_websites: newWebsites});
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
