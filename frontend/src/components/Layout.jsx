import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="ml-64 min-h-screen relative flex-1">
                {/* TopNavBar */}
                <header className="fixed top-0 right-0 left-64 z-40 bg-white/70 backdrop-blur-xl shadow-premium border-b border-slate-200/20">
                    <div className="flex justify-between items-center h-16 px-8 w-full">
                        <div className="flex items-center flex-1 max-w-md">
                            <div className="relative w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input 
                                    className="w-full bg-surface-container-highest border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body" 
                                    placeholder="Search conversations or campaigns..." 
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100/50 transition-all duration-200 active:scale-95">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 leading-none">Admin User</p>
                                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Enterprise</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-emerald-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600">person</span>
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
