import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, billing, logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
        { name: 'Contacts', icon: 'contacts', path: '/contacts' },
        { name: 'Templates', icon: 'description', path: '/templates' },
        { name: 'Campaigns', icon: 'campaign', path: '/campaigns' },
        { name: 'Team Inbox', icon: 'inbox', path: '/inbox' },
        { name: 'Automation', icon: 'smart_toy', path: '/automation' },
        { name: 'Analytics', icon: 'analytics', path: '/analytics' },
        { name: 'Settings', icon: 'settings', path: '/settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="h-screen w-64 fixed left-0 top-0 z-50 glass-sidebar border-r border-slate-200/10 shadow-xl flex flex-col py-6 gap-2">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006d2f] to-[#25d366] flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold bg-gradient-to-br from-[#006d2f] to-[#25d366] bg-clip-text text-transparent leading-none">Royal300</h1>
                    <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mt-1">WhatsApp SaaS</p>
                </div>
            </div>
            
            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 font-headline text-[14px] font-medium transition-all duration-300 group ${
                                isActive 
                                ? 'bg-emerald-50/50 text-emerald-700 border-r-4 border-emerald-500' 
                                : 'text-slate-500 hover:bg-slate-50 hover:translate-x-1'
                            }`}
                        >
                            <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${isActive ? 'text-emerald-600' : ''}`}>
                                {item.icon}
                            </span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-3 mt-auto">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 font-headline text-[14px] font-medium text-red-500 hover:bg-red-50 hover:translate-x-1 transition-all duration-300 group rounded-lg"
                >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">logout</span>
                    Logout
                </button>
            </div>

            <div className="px-6 mt-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <p className="text-xs font-semibold text-primary mb-2">{billing?.plan_name || 'Free Plan'} Active</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mb-3">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${billing?.percentage || 0}%` }}></div>
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-tight">{billing?.percentage?.toFixed(0) || 0}% of monthly messages used.</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
