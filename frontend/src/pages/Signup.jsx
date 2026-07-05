import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [step, setStep] = useState('details'); // 'details' | 'otp'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const res = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
                company_name: formData.company_name
            });
            if (res.requires_otp) {
                setStep('otp');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyOtp(formData.email, formData.otp);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
            <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between">
                <div className="text-2xl font-black tracking-tighter text-on-surface font-headline">Royal300</div>
                <div className="hidden md:block">
                    <span className="text-sm font-medium text-on-surface-variant mr-2">Already have an account?</span>
                    <Link to="/login" className="text-sm font-bold text-primary hover:opacity-80 transition-all">Log In</Link>
                </div>
            </nav>

            <main className="min-h-screen flex flex-col md:flex-row">
                {/* Left Side: Professional Sidebar */}
                <aside className="hidden md:flex md:w-5/12 lg:w-1/2 glass-sidebar relative overflow-hidden flex-col justify-center px-12 lg:px-24 text-white bg-gradient-to-br from-[#128C7E] to-[#006d2f]">
                    <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary-container/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider uppercase">
                            Platform Excellence
                        </div>
                        <h1 className="font-headline text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                            The world's most powerful WhatsApp API panel
                        </h1>
                        <p className="text-xl text-white/80 max-w-lg leading-relaxed">
                            Join 5,000+ businesses automating their communication and scaling customer engagement with Royal300.
                        </p>
                    </div>
                </aside>

                {/* Right Side: Signup Form */}
                <section className="flex-1 flex flex-col justify-center items-center px-6 py-24 md:px-12 lg:px-24 bg-surface relative">
                    {step === 'details' ? (
                        <div className="w-full max-w-md space-y-10 animate-fade-in">
                            <div className="space-y-3">
                                <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Create Your Account</h2>
                                <p className="text-on-surface-variant font-medium">Start your 14-day free trial. No credit card required.</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleRegisterSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="name">Full Name</label>
                                    <input 
                                        className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" 
                                        id="name" 
                                        placeholder="John Doe" 
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="company">Company / Business Name</label>
                                    <input 
                                        className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" 
                                        id="company" 
                                        placeholder="Acme Inc." 
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Work Email</label>
                                    <input 
                                        className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" 
                                        id="email" 
                                        placeholder="name@company.com" 
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="password">Password</label>
                                    <input 
                                        className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" 
                                        id="password" 
                                        placeholder="••••••••" 
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="password_confirmation">Confirm Password</label>
                                    <input 
                                        className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" 
                                        id="password_confirmation" 
                                        placeholder="••••••••" 
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                        required
                                    />
                                </div>

                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50" 
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Create My Account'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-on-surface-variant">
                                Already have an account? <Link to="/login" className="text-primary font-bold ml-1">Log In</Link>
                            </p>
                        </div>
                    ) : (
                        <div className="w-full max-w-md space-y-10 animate-fade-in">
                            <div className="space-y-3 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                    <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                                </div>
                                <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Verify your email</h2>
                                <p className="text-on-surface-variant font-medium">We've sent a 6-digit code to <br/><span className="text-on-surface font-bold">{formData.email}</span></p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleOtpSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1 text-center block" htmlFor="otp">Enter 6-digit code</label>
                                    <input 
                                        className="w-full bg-surface-container-highest/50 border-none rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" 
                                        id="otp" 
                                        placeholder="------" 
                                        type="text"
                                        maxLength={6}
                                        value={formData.otp}
                                        onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})}
                                        required
                                    />
                                </div>

                                <button 
                                    className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50" 
                                    type="submit"
                                    disabled={loading || formData.otp.length !== 6}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Log In'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setStep('details')}
                                    className="w-full py-4 px-6 bg-transparent text-on-surface-variant font-bold rounded-xl hover:bg-surface-container-highest transition-all duration-300"
                                >
                                    Back to details
                                </button>
                            </form>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Signup;
