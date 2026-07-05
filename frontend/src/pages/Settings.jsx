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
    const [profileData, setProfileData] = useState({
        verified_name: '',
        about: '',
        address: '',
        description: '',
        email: '',
        vertical: '',
        websites: [''],
        profile_picture_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('api'); // api, pusher, profile
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);

    const fetchProfile = async () => {
        setSyncing(true);
        try {
            const response = await api.get('/tenant/business-profile');
            if (response.data && response.data.data && response.data.data[0]) {
                const p = response.data.data[0];
                setProfileData({
                    verified_name: p.verified_name || '',
                    about: p.about || '',
                    address: p.address || '',
                    description: p.description || '',
                    email: p.email || '',
                    vertical: p.vertical || '',
                    websites: p.websites || [''],
                    profile_picture_url: p.profile_picture_url || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch business profile', err);
        } finally {
            setSyncing(false);
        }
    };

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
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            if (activeTab === 'profile') {
                if (profilePictureFile) {
                    const fd = new FormData();
                    Object.keys(profileData).forEach(key => {
                        if (key === 'websites') {
                            profileData[key].forEach(site => {
                                if (site.trim()) fd.append('websites[]', site);
                            });
                        } else {
                            fd.append(key, profileData[key]);
                        }
                    });
                    fd.append('profile_picture', profilePictureFile);
                    await api.post('/tenant/business-profile', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setProfilePictureFile(null);
                    setProfilePicturePreview(null);
                } else {
                    await api.post('/tenant/business-profile', profileData);
                }
                // Refresh profile to get updated URL
                fetchProfile();
            } else {
                await api.post('/tenant/settings', formData);
            }
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
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-headline font-extrabold text-on-surface mb-1">Business Profile</h3>
                                                <p className="text-sm text-on-surface-variant font-medium">Update your business details that appear to customers on WhatsApp.</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    type="button"
                                                    onClick={fetchProfile}
                                                    disabled={syncing}
                                                    className="px-6 py-3 rounded-2xl bg-surface-container-low text-primary font-headline font-bold text-xs hover:bg-surface-container-highest transition-all flex items-center gap-2 border border-primary/20"
                                                >
                                                    <span className={`material-symbols-outlined text-lg ${syncing ? 'animate-spin' : ''}`}>sync</span>
                                                    {syncing ? 'Fetching...' : 'Fetch from Meta'}
                                                </button>
                                                <div className="relative group cursor-pointer w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg bg-surface-container-low"
                                                     onClick={() => document.getElementById('profilePicUpload').click()}
                                                >
                                                    <img 
                                                        src={profilePicturePreview || profileData.profile_picture_url || 'https://ui-avatars.com/api/?name=W&background=random'} 
                                                        alt="Profile" 
                                                        className="w-full h-full object-cover transition-opacity group-hover:opacity-50" 
                                                        onError={(e) => {
                                                            e.target.src = 'https://ui-avatars.com/api/?name=W&background=random';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-symbols-outlined text-white drop-shadow-md">photo_camera</span>
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        id="profilePicUpload" 
                                                        className="hidden" 
                                                        accept="image/jpeg, image/png"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                const file = e.target.files[0];
                                                                setProfilePictureFile(file);
                                                                setProfilePicturePreview(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Display Name (Verified)</label>
                                        <input 
                                            type="text"
                                            readOnly
                                            className="w-full bg-surface-container-low/50 border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-0 outline-none cursor-not-allowed opacity-70"
                                            placeholder="Sync from Meta to load..."
                                            value={profileData.verified_name}
                                        />
                                        <p className="text-[10px] text-on-surface-variant font-medium px-1 italic">This name is verified by Meta and cannot be changed here.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">About (Status)</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Hello! I am using WhatsApp"
                                            value={profileData.about}
                                            onChange={(e) => setProfileData({...profileData, about: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Category</label>
                                        <select 
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={profileData.vertical}
                                            onChange={(e) => setProfileData({...profileData, vertical: e.target.value})}
                                        >
                                            <option value="">Select Category</option>
                                            <option value="APPAREL">Apparel & Accessories</option>
                                            <option value="BEAUTY">Beauty, Cosmetics & Personal Care</option>
                                            <option value="EDUCATION">Education</option>
                                            <option value="FINANCE">Finance</option>
                                            <option value="FOOD_BEVERAGE">Food & Beverage</option>
                                            <option value="HEALTH">Healthcare</option>
                                            <option value="HOTEL">Hotel & Lodging</option>
                                            <option value="PROF_SERVICES">Professional Services</option>
                                            <option value="RETAIL">Retail</option>
                                            <option value="TRAVEL">Travel & Transportation</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Description</label>
                                        <textarea 
                                            rows="3"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                            placeholder="Tell customers about your business..."
                                            value={profileData.description}
                                            onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Email</label>
                                        <input 
                                            type="email"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="contact@business.com"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Business Address</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="123 Business Way, Suite 100"
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Websites</label>
                                        {profileData.websites.map((site, idx) => (
                                            <div key={idx} className="flex gap-2 mb-2">
                                                <input 
                                                    type="text"
                                                    className="flex-1 bg-surface-container-low border-none rounded-2xl py-4 px-5 text-on-surface font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="https://..."
                                                    value={site}
                                                    onChange={(e) => {
                                                        const updated = [...profileData.websites];
                                                        updated[idx] = e.target.value;
                                                        setProfileData({...profileData, websites: updated});
                                                    }}
                                                />
                                                {profileData.websites.length > 1 && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setProfileData({...profileData, websites: profileData.websites.filter((_, i) => i !== idx)})}
                                                        className="w-14 bg-error/10 text-error rounded-2xl flex items-center justify-center hover:bg-error/20 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {profileData.websites.length < 2 && (
                                            <button 
                                                type="button"
                                                onClick={() => setProfileData({...profileData, websites: [...profileData.websites, '']})}
                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline ml-1"
                                            >
                                                + Add Another Website
                                            </button>
                                        )}
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
