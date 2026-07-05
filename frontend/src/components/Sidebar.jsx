import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { darkMode } = useTheme();

    const features = user?.tenant?.features || {};

    let menuItems = [];
    if (user?.role === 'super_admin') {
        menuItems = [
            { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
            { name: 'Tenants Management', icon: 'admin_panel_settings', path: '/super-admin' },
            { name: 'Contacts', icon: 'contacts', path: '/contacts' },
            ...(features.templates !== false ? [{ name: 'Templates', icon: 'description', path: '/templates' }] : []),
            ...(features.campaigns !== false ? [{ name: 'Campaigns', icon: 'campaign', path: '/campaigns' }] : []),
            ...(features.team_inbox !== false ? [{ name: 'Team Inbox', icon: 'inbox', path: '/inbox' }] : []),
            ...(features.automation !== false ? [{ name: 'Automation', icon: 'smart_toy', path: '/automation' }] : []),
            ...(features.flow_builder !== false ? [{ name: 'Flow Builder', icon: 'account_tree', path: '/flow-builder' }] : []),
            ...(features.agents !== false ? [{ name: 'Agents', icon: 'support_agent', path: '/agents' }] : []),
            ...(features.analytics !== false ? [{ name: 'Analytics', icon: 'analytics', path: '/analytics' }] : []),
            { name: 'Settings', icon: 'settings', path: '/settings' },
        ];
    } else if (user?.role === 'admin') {
        menuItems = [
            { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
            { name: 'Contacts', icon: 'contacts', path: '/contacts' },
            ...(features.templates !== false ? [{ name: 'Templates', icon: 'description', path: '/templates' }] : []),
            ...(features.campaigns !== false ? [{ name: 'Campaigns', icon: 'campaign', path: '/campaigns' }] : []),
            ...(features.team_inbox !== false ? [{ name: 'Team Inbox', icon: 'inbox', path: '/inbox' }] : []),
            ...(features.automation !== false ? [{ name: 'Automation', icon: 'smart_toy', path: '/automation' }] : []),
            ...(features.flow_builder !== false ? [{ name: 'Flow Builder', icon: 'account_tree', path: '/flow-builder' }] : []),
            ...(features.agents !== false ? [{ name: 'Agents', icon: 'support_agent', path: '/agents' }] : []),
            ...(features.analytics !== false ? [{ name: 'Analytics', icon: 'analytics', path: '/analytics' }] : []),
            ...(features.settings !== false ? [{ name: 'Settings', icon: 'settings', path: '/settings' }] : []),
        ];
    } else {
        menuItems = [
            ...(features.team_inbox !== false ? [{ name: 'Team Inbox', icon: 'inbox', path: '/inbox' }] : []),
            { name: 'Contacts', icon: 'contacts', path: '/contacts' },
        ];
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="h-screen w-64 fixed left-0 top-0 z-50 glass-sidebar shadow-xl flex flex-col py-6 gap-2">
            {/* Brand Logo */}
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006d2f] to-[#25d366] flex items-center justify-center text-white shadow-lg" style={{ boxShadow: darkMode ? '0 4px 15px rgba(37,211,102,0.25)' : '0 4px 15px rgba(0,109,47,0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold bg-gradient-to-br from-[#006d2f] to-[#25d366] bg-clip-text text-transparent leading-none">Royal300</h1>
                    <p className="text-[10px] font-bold tracking-widest uppercase mt-1" style={{ color: 'var(--sidebar-text)' }}>WhatsApp SaaS</p>
                </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 font-headline text-[14px] font-medium transition-all duration-300 group rounded-xl ${
                                isActive ? 'border-r-4 border-emerald-500' : 'hover:translate-x-1'
                            }`}
                            style={{
                                backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                                color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                                ...(isActive && darkMode ? { boxShadow: 'inset 0 0 20px rgba(37,211,102,0.04)' } : {})
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform" style={{ color: isActive ? 'var(--sidebar-active-text)' : undefined }}>
                                {item.icon}
                            </span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 mt-auto">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 font-headline text-[14px] font-medium text-red-500 hover:translate-x-1 transition-all duration-300 group rounded-xl"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239,68,68,0.08)' : 'rgba(254,242,242,1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">logout</span>
                    Logout
                </button>
            </div>

            {/* Pro Plan Card */}
            <div className="px-5 mt-4">
                <div 
                    className="p-4 rounded-xl border transition-all duration-400"
                    style={{
                        backgroundColor: darkMode ? 'rgba(37,211,102,0.04)' : 'var(--color-surface-container-low)',
                        borderColor: darkMode ? 'rgba(37,211,102,0.10)' : 'var(--color-outline-variant)',
                        ...(darkMode ? { boxShadow: 'inset 0 0 20px rgba(37,211,102,0.03)' } : {})
                    }}
                >
                    <p className="text-xs font-semibold mb-2" style={{ color: darkMode ? '#4ade80' : '#006d2f' }}>Pro Plan Active</p>
                    <div className="w-full h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--plan-progress-track)' }}>
                        <div 
                            className="h-1.5 rounded-full w-[85%] transition-all" 
                            style={{ 
                                background: darkMode 
                                    ? 'linear-gradient(90deg, #25d366, #4ade80)' 
                                    : '#006d2f',
                                ...(darkMode ? { boxShadow: '0 0 8px rgba(37,211,102,0.3)' } : {})
                            }}
                        />
                    </div>
                    <p className="text-[10px] leading-tight" style={{ color: 'var(--sidebar-text)' }}>85% of monthly messages used.</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
