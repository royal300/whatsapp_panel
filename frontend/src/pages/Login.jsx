import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen">
            <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between">
                <div className="text-2xl font-black tracking-tighter text-on-surface font-headline">Royal300</div>
                <div className="hidden md:block">
                    <span className="text-sm font-medium text-on-surface-variant mr-2">Don't have an account?</span>
                    <Link to="/signup" className="text-sm font-bold text-primary hover:opacity-80 transition-all">Sign Up</Link>
                </div>
            </nav>

            <main className="min-h-screen flex flex-col md:flex-row overflow-hidden">
                {/* Left Side: Branding Sidebar */}
                <aside className="hidden lg:flex w-1/2 glass-sidebar relative flex-col justify-center p-20 text-white overflow-hidden bg-gradient-to-br from-[#006d2f] to-[#128C7E]">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
                    <div className="relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 text-xs font-bold tracking-widest uppercase font-headline">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            Enterprise Grade
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tighter leading-[0.9] mb-8">
                            Empower your business with WhatsApp automation
                        </h1>
                        <p className="text-xl text-white/80 font-body leading-relaxed mb-12 max-w-md">
                            Team Inbox & Chatbots for scaling your sales. Engage customers on their favorite platform with precision.
                        </p>
                        
                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary-container">smart_toy</span>
                                </div>
                                <div>
                                    <div className="text-sm font-bold font-headline">Active Chatbots</div>
                                    <div className="text-xs text-white/60">Automated responses running</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-container w-[75%]"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/40">
                                    <span>Performance</span>
                                    <span>98% Accuracy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Side: Login Form */}
                <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-surface">
                    <div className="w-full max-w-md">
                        <div className="text-center md:text-left mb-10">
                            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Welcome Back</h2>
                            <p className="text-on-surface-variant text-sm font-body">Sign in to manage your WhatsApp workspace.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="group">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1 transition-colors group-focus-within:text-primary" htmlFor="email">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">mail</span>
                                    <input 
                                        className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body text-sm" 
                                        id="email" 
                                        placeholder="name@company.com" 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <div className="flex justify-between items-end mb-1.5 ml-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors group-focus-within:text-primary" htmlFor="password">Password</label>
                                    <Link to="/forgot-password" title="Forgot Password" icon="link" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-70">Forgot Password?</Link>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">lock</span>
                                    <input 
                                        className="w-full pl-12 pr-12 py-4 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 font-body text-sm" 
                                        id="password" 
                                        placeholder="••••••••" 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                className="w-full bg-[#25D366] text-on-primary-container py-4 rounded-xl font-headline font-extrabold text-sm tracking-tight shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50" 
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Checking...' : 'Sign In to Panel'}
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        </form>

                        <p className="text-center mt-10 text-sm text-on-surface-variant font-body">
                            Don't have an account? 
                            <Link to="/signup" className="text-primary font-bold hover:underline ml-1">Get Started for free</Link>
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Login;
