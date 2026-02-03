import React, { useState } from 'react';
import { Moon, Sun, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (password: string) => Promise<boolean>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, theme, toggleTheme }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    const success = await onLogin(password);
    if (!success) {
        setError(true);
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        {/* Absolute Theme Toggle for Login Page */}
        <button 
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 dark:bg-black/20 text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-black/30 backdrop-blur-md transition-all border border-slate-200 dark:border-slate-700"
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-full max-w-md">
            <div className="text-center mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4 border border-white/10">
                    <Moon size={32} className="text-white fill-white/20" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Markaz Masjid</h1>
                <p className="text-slate-500 dark:text-slate-400">Community Contribution Tracker</p>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 text-slate-700 dark:text-slate-200">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <ShieldCheck size={16} />
                        </div>
                        <span className="text-sm font-medium">Secure Access Required</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Access Code</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(false);
                                    }}
                                    className={`w-full bg-slate-50 dark:bg-[#0f172a] border ${error ? 'border-red-500 focus:border-red-600' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'} rounded-xl py-3 pl-10 pr-12 text-slate-900 dark:text-white focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} transition-all placeholder-slate-400 dark:placeholder-slate-600`}
                                    placeholder="Enter access code"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {error && (
                                <p className="text-xs text-red-500 dark:text-red-400 ml-1 animate-in slide-in-from-left-2">
                                    Incorrect access code. Please try again.
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Access Dashboard</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                <div className="px-8 py-4 bg-slate-50 dark:bg-[#0f172a]/50 border-t border-slate-200 dark:border-slate-700/50 text-center">
                    <p className="text-xs text-slate-500">Authorized personnel only.</p>
                </div>
            </div>
            
            <p className="text-center text-slate-500 dark:text-slate-600 text-xs mt-6">
                Built by <span className="font-semibold text-slate-600 dark:text-slate-400">BlackScale Digital</span>
            </p>
        </div>
    </div>
  );
};

export default LoginPage;