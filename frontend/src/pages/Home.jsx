import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FloatingCard = ({ children, className, style, delay = 0 }) => (
    <motion.div
        initial={{ y: 50, opacity: 0, rotateX: 45, rotateZ: -15 }}
        animate={{ y: 0, opacity: 1, rotateX: 0, rotateZ: 0 }}
        transition={{ duration: 1, delay, type: "spring", bounce: 0.3 }}
        whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5, zIndex: 50 }}
        className={`absolute rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl preserve-3d overflow-hidden ${className}`}
        style={style}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
        {children}
    </motion.div>
);

const BackgroundOrbs = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 100, 0],
                y: [0, -50, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-emerald-500/20 blur-[120px]"
        />
        <motion.div
            animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
                x: [0, -100, 0],
                y: [0, 100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[40%] -right-[10%] w-[40%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]"
        />
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.3, 0.1],
                rotate: [0, 90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[140px]"
        />
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // If user is already logged in, redirect them
        if (user) {
            navigate('/dashboard');
        }
        
        // Force dark mode for the landing page body
        document.documentElement.classList.add('dark');
        
        // Cleanup function to remove dark mode if user's actual preference isn't dark
        // But since this is a landing page, we want it explicitly dark. 
        // We'll rely on Layout.jsx and ThemeContext to fix it on inner pages.
    }, [user, navigate]);

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20; // max rotation 10deg
        const y = (clientY / window.innerHeight - 0.5) * -20;
        setMousePosition({ x, y });
    };

    return (
        <div 
            className="relative min-h-screen bg-[#0c1017] text-white overflow-hidden perspective-1000 selection:bg-emerald-500/30"
            onMouseMove={handleMouseMove}
        >
            <BackgroundOrbs />

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006d2f] to-[#25d366] flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,211,102,0.4)]">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-br from-[#006d2f] to-[#25d366] bg-clip-text text-transparent leading-none">Royal300</h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">WhatsApp SaaS</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4"
                >
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => navigate('/signup')}
                        className="px-6 py-2 text-sm font-bold bg-white text-[#0c1017] rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95"
                    >
                        Get Started
                    </button>
                </motion.div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-16 min-h-[calc(100vh-100px)]">
                
                {/* Text Content */}
                <div className="flex-1 space-y-8 z-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            The Ultimate Platform
                        </span>
                        <h1 className="font-headline text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
                            Scale your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#25d366]">
                                WhatsApp 
                            </span> 
                            <br/> Business.
                        </h1>
                    </motion.div>

                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-xl leading-relaxed"
                    >
                        Engage customers, automate marketing campaigns, and manage team inbox seamlessly with our premium official WhatsApp Cloud API integration.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex items-center gap-4 pt-4"
                    >
                        <button 
                            onClick={() => navigate('/signup')}
                            className="px-8 py-4 text-base font-bold bg-gradient-to-r from-[#006d2f] to-[#25d366] text-white rounded-full hover:shadow-[0_10px_30px_-5px_rgba(37,211,102,0.5)] transition-all active:scale-95 flex items-center gap-2 group"
                        >
                            Start Free Trial
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 text-base font-bold bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 transition-all active:scale-95"
                        >
                            Log in
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="flex items-center gap-6 pt-12 border-t border-white/10"
                    >
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0c1017] bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-slate-400">
                            <span className="text-white font-bold">1,000+</span> businesses growing<br/>with Royal300
                        </div>
                    </motion.div>
                </div>

                {/* 3D Motion Graphics Scene */}
                <div className="flex-1 relative h-[600px] w-full preserve-3d">
                    <motion.div 
                        className="absolute inset-0 preserve-3d"
                        animate={{ rotateX: mousePosition.y, rotateY: mousePosition.x }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    >
                        {/* Main Dashboard Mockup */}
                        <FloatingCard 
                            className="w-[450px] h-[300px] top-[10%] left-[10%] bg-[#151b25]/80 z-20 flex flex-col p-4"
                            delay={0.2}
                        >
                            {/* Mock Navbar */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-4 w-24 bg-white/10 rounded-full"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-6 rounded-full bg-white/10"></div>
                                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                                </div>
                            </div>
                            {/* Mock Charts */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 h-20 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col justify-between">
                                    <div className="h-2 w-12 bg-white/20 rounded-full"></div>
                                    <div className="h-6 w-20 bg-emerald-400/80 rounded-full"></div>
                                </div>
                                <div className="flex-1 h-20 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col justify-between">
                                    <div className="h-2 w-12 bg-white/20 rounded-full"></div>
                                    <div className="h-6 w-16 bg-white/80 rounded-full"></div>
                                </div>
                            </div>
                            {/* Mock Graph */}
                            <div className="flex-1 rounded-xl bg-gradient-to-t from-emerald-500/10 to-transparent border border-white/5 flex items-end p-2 gap-2">
                                {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1.5, delay: 0.5 + (i * 0.1), type: "spring" }}
                                        className="flex-1 bg-emerald-500/40 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </FloatingCard>

                        {/* Floating Chat Bubble 1 */}
                        <FloatingCard 
                            className="w-[200px] p-3 top-[60%] left-[-5%] bg-emerald-900/40 border-emerald-500/30 z-30 flex items-center gap-3 backdrop-blur-2xl"
                            delay={0.4}
                            style={{ translateZ: '50px' }}
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-[16px]">campaign</span>
                            </div>
                            <div>
                                <div className="h-2 w-16 bg-white/80 rounded-full mb-2"></div>
                                <div className="h-1.5 w-24 bg-white/40 rounded-full"></div>
                            </div>
                        </FloatingCard>

                        {/* Floating Notification */}
                        <FloatingCard 
                            className="w-[180px] p-3 top-[5%] right-[5%] bg-blue-900/30 border-blue-500/30 z-40 backdrop-blur-2xl"
                            delay={0.6}
                            style={{ translateZ: '80px' }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-blue-400 text-sm">robot_2</span>
                                <span className="text-xs font-bold text-blue-100">Automation</span>
                            </div>
                            <div className="text-[10px] text-blue-200/70">Reply sent automatically</div>
                        </FloatingCard>
                        
                        {/* 3D Glass Layer */}
                        <FloatingCard 
                            className="w-[300px] h-[200px] top-[40%] right-[-10%] bg-white/5 border-white/10 z-10 backdrop-blur-xl"
                            delay={0.8}
                            style={{ translateZ: '-30px' }}
                        >
                            <div className="w-full h-full p-4 flex flex-col gap-3 opacity-30">
                                <div className="h-8 w-full bg-white/20 rounded-lg"></div>
                                <div className="h-8 w-full bg-white/20 rounded-lg"></div>
                                <div className="h-8 w-[70%] bg-white/20 rounded-lg"></div>
                            </div>
                        </FloatingCard>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Home;
