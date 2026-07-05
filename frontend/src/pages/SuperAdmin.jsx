import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SuperAdmin = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [validityDates, setValidityDates] = useState({});
    const { darkMode } = useTheme();

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data);
            const initialDates = {};
            res.data.forEach(t => {
                if (t.valid_until) {
                    initialDates[t.id] = t.valid_until.split('T')[0];
                }
            });
            setValidityDates(initialDates);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const toggleFeature = async (tenantId, featureKey, currentValue) => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        const newFeatures = { ...tenant.features, [featureKey]: !currentValue };
        
        // Optimistic UI update
        setTenants(tenants.map(t => t.id === tenantId ? { ...t, features: newFeatures } : t));

        try {
            await api.put(`/super-admin/tenants/${tenantId}/features`, { features: newFeatures });
        } catch (error) {
            console.error('Failed to update features:', error);
            // Revert on error
            setTenants(tenants.map(t => t.id === tenantId ? { ...t, features: tenant.features } : t));
        }
    };

    const updateValidity = async (tenantId) => {
        const dateStr = validityDates[tenantId];
        try {
            const res = await api.put(`/super-admin/tenants/${tenantId}/validity`, { valid_until: dateStr || null });
            setTenants(tenants.map(t => t.id === tenantId ? { ...t, valid_until: res.data.tenant.valid_until } : t));
            alert('Validity updated successfully');
        } catch (error) {
            console.error('Failed to update validity:', error);
            alert('Failed to update validity');
        }
    };

    const FEATURES = [
        { key: 'flow_builder', label: 'Flow Builder' },
        { key: 'automation', label: 'Automation' },
        { key: 'campaigns', label: 'Campaigns' },
        { key: 'templates', label: 'Templates' },
        { key: 'team_inbox', label: 'Team Inbox' },
        { key: 'agents', label: 'Agents' },
        { key: 'analytics', label: 'Analytics' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 pb-12">
            <header className="flex flex-col mb-8">
                <nav className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span>Super Admin</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-emerald-600">Tenants Management</span>
                </nav>
                <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-on-surface)' }}>Tenants & Features</h1>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Manage access control and feature availability for all registered tenants.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {tenants.map(tenant => (
                    <div key={tenant.id} className="rounded-3xl border shadow-sm p-6 overflow-hidden transition-all duration-300" 
                         style={{ 
                             backgroundColor: 'var(--color-surface)',
                             borderColor: 'var(--color-outline-variant)'
                         }}>
                        <div className="flex items-center justify-between mb-6 pb-6 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl font-bold">corporate_fare</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--color-on-surface)' }}>{tenant.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                            ID: {tenant.id}
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            Domain: {tenant.domain}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Owner</p>
                                {tenant.users && tenant.users.length > 0 ? (
                                    <>
                                        <p className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>{tenant.users[0].name}</p>
                                        <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{tenant.users[0].email}</p>
                                    </>
                                ) : (
                                    <p className="text-sm italic text-gray-400">No owner found</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Module Access
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {FEATURES.map(feature => {
                                    // Default to true if not explicitly set to false
                                    const isEnabled = tenant.features && tenant.features[feature.key] !== false;
                                    
                                    return (
                                        <div key={feature.key} 
                                             className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                                             style={{
                                                 backgroundColor: isEnabled 
                                                    ? (darkMode ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4') 
                                                    : (darkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb'),
                                                 borderColor: isEnabled
                                                    ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0')
                                                    : 'var(--color-outline-variant)'
                                             }}>
                                            <span className="text-sm font-semibold" style={{ color: isEnabled ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                                                {feature.label}
                                            </span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={isEnabled}
                                                    onChange={() => toggleFeature(tenant.id, feature.key, isEnabled)} 
                                                />
                                                <div className="w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--color-outline-variant)' }}>
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Portal Validity
                            </h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <input 
                                    type="date"
                                    value={validityDates[tenant.id] || ''}
                                    onChange={(e) => setValidityDates({...validityDates, [tenant.id]: e.target.value})}
                                    className="px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-transparent text-sm font-medium"
                                    style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                                />
                                <button 
                                    onClick={() => updateValidity(tenant.id)}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    Update Date
                                </button>
                                <button 
                                    onClick={() => {
                                        setValidityDates({...validityDates, [tenant.id]: ''});
                                        // Immediately submit empty to set to lifetime
                                        api.put(`/super-admin/tenants/${tenant.id}/validity`, { valid_until: null })
                                            .then(res => {
                                                setTenants(tenants.map(t => t.id === tenant.id ? { ...t, valid_until: null } : t));
                                                alert('Tenant is now set to Lifetime Access');
                                            })
                                            .catch(err => {
                                                console.error('Failed to update validity:', err);
                                                alert('Failed to update validity');
                                            });
                                    }}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-bold rounded-xl transition-colors"
                                    style={{ color: 'var(--color-on-surface)' }}
                                >
                                    Set Lifetime
                                </button>
                                {tenant.valid_until ? (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                                        Expires: {new Date(tenant.valid_until).toLocaleDateString()}
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                                        Lifetime Access
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {tenants.length === 0 && (
                    <div className="text-center py-20 rounded-3xl border border-dashed" style={{ borderColor: 'var(--color-outline-variant)' }}>
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">corporate_fare</span>
                        <p className="text-gray-500 font-medium">No tenants registered yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdmin;
