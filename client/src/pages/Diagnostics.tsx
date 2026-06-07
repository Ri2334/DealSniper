import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Database, Cpu, Activity, AlertTriangle, Lock, Key, ChevronRight } from 'lucide-react';
import PremiumLoader from '../components/PremiumLoader';

const Diagnostics = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState(false);

  const [health, setHealth] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId === 'admin' && adminPass === 'sniper2026') {
        setIsVerified(true);
        setAuthError(false);
        fetchData();
    } else {
        setAuthError(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, diagRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/system/health`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/system/diagnostics`)
      ]);
      setHealth(healthRes.data.data);
      setDiag(diagRes.data);
    } catch (error) {
      console.error('Failed to fetch diagnostics', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-gray-100 overflow-hidden">
                <div className="bg-primary p-8 text-white flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Lock size={32} />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black tracking-tight">RESTRICTED ACCESS</h2>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Admin Credentials Required</p>
                    </div>
                </div>
                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Admin ID" 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner"
                                value={adminPass}
                                onChange={(e) => setAdminPass(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {authError && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-black text-center animate-shake">
                            INVALID CREDENTIALS. ACCESS DENIED.
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-sm tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl"
                    >
                        VERIFY & ENTER <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
  }

  if (loading) return <PremiumLoader message="ACCESSING SECURE DATA..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Shield className="text-primary" size={32} />
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Diagnostics</h1>
        <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">ENCRYPTED</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Database size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Database</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Connection</span>
                    <span className="text-sm font-black text-green-600">{health?.mongodbStatus}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Total Products</span>
                    <span className="text-sm font-black">{health?.totalProducts?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Total Brands</span>
                    <span className="text-sm font-black">{diag?.brandsCount}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Total Categories</span>
                    <span className="text-sm font-black">{diag?.categoriesCount}</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Cpu size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Cron & Worker</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Status</span>
                    <span className="text-sm font-black text-primary">{health?.cronStatus}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Last Scrape</span>
                    <span className="text-sm font-black">{health?.lastCrawlEnd ? new Date(health.lastCrawlEnd).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Scrape Success</span>
                    <span className={`text-sm font-black ${health?.lastCrawlSuccess ? 'text-green-600' : 'text-red-600'}`}>{health?.lastCrawlSuccess ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Uptime</span>
                    <span className="text-sm font-black">{Math.floor(health?.uptime / 3600)}h {Math.floor((health?.uptime % 3600) / 60)}m</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Activity size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Intelligence</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Avg Deal Score</span>
                    <span className="text-sm font-black">{Math.round(diag?.avgDealScore)}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Alerts Sent</span>
                    <span className="text-sm font-black">{health?.totalAlertsSent}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-500">Last Alert</span>
                    <span className="text-sm font-black">{health?.lastTelegramAlertSent ? new Date(health.lastTelegramAlertSent).toLocaleTimeString() : 'N/A'}</span>
                </div>
            </div>
        </div>
      </div>

      {health?.lastError && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
            <AlertTriangle className="text-red-600 shrink-0" size={24} />
            <div>
                <h3 className="text-red-800 font-black text-sm uppercase">Last System Error</h3>
                <p className="text-red-600 text-xs font-bold mt-1">{health.lastError}</p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Tracked Brands</h3>
              <div className="flex flex-wrap gap-2">
                  {diag?.brands?.map((b: string) => (
                      <span key={b} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase hover:bg-primary/10 hover:text-primary transition-colors">{b}</span>
                  ))}
              </div>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Detected Categories</h3>
              <div className="flex flex-wrap gap-2">
                  {diag?.categories?.map((c: string) => (
                      <span key={c} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase hover:bg-primary/10 hover:text-primary transition-colors">{c}</span>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Diagnostics;
