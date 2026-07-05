import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="ml-64 min-h-screen relative flex-1">
                {/* TopNavBar */}
                <header 
                    className="fixed top-0 right-0 left-64 z-40 backdrop-blur-xl shadow-premium"
                    style={{ 
                        backgroundColor: 'var(--topnav-bg)', 
                        borderBottom: `1px solid var(--topnav-border)`,
                    }}
                >
                    <div className="flex justify-between items-center h-16 px-8 w-full">
                        {/* Search Bar */}
                        <div className="flex items-center flex-1 max-w-md">
                            <div className="relative w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 text-lg">search</span>
                                <input 
                                    className="w-full bg-surface-container-highest border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body text-on-surface" 
                                    placeholder="Search conversations or campaigns..." 
                                    type="text"
                                />
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-3">
                            {/* Dark Mode Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm" style={{ color: darkMode ? '#5a6a78' : '#fbbf24', opacity: darkMode ? 0.5 : 1, transition: 'all 0.4s ease' }}>
                                    light_mode
                                </span>
                                <button
                                    onClick={toggleDarkMode}
                                    className="dark-mode-toggle"
                                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    aria-label="Toggle dark mode"
                                />
                                <span className="material-symbols-outlined text-sm" style={{ color: darkMode ? '#4ade80' : '#5a6a78', opacity: darkMode ? 1 : 0.5, transition: 'all 0.4s ease' }}>
                                    dark_mode
                                </span>
                            </div>
                            
                            {/* Notifications */}
                            <button 
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant transition-all duration-200 active:scale-95"
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--topnav-icon-hover)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined">notifications</span>
                            </button>

                            {/* Divider */}
                            <div className="h-8 w-[1px]" style={{ backgroundColor: 'var(--topnav-divider)' }} />

                            {/* User Info */}
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold leading-none" style={{ color: 'var(--topnav-name)' }}>{user?.name || 'User'}</p>
                                    <p className="text-[10px] font-semibold mt-1 uppercase tracking-wider" style={{ color: darkMode ? '#4ade80' : '#059669' }}>
                                        {user?.role === 'admin' ? 'Enterprise Admin' : 'Support Agent'}
                                    </p>
                                </div>
                                <div 
                                    className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center"
                                    style={{
                                        backgroundColor: darkMode ? 'rgba(37,211,102,0.12)' : '#ecfdf5',
                                        border: `1px solid ${darkMode ? 'rgba(37,211,102,0.15)' : 'rgba(16,185,129,0.1)'}`,
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ color: darkMode ? '#4ade80' : '#059669' }}>person</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <div className="pt-24 pb-12 px-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
