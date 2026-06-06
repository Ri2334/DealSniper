import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Database, Cpu, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

const Diagnostics = () => {
  const [health, setHealth] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><RefreshCw className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="text-primary" size={32} />
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Diagnostics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
                    <span className="text-sm font-black">{health?.totalProducts}</span>
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

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
                    <span className="text-sm font-bold text-gray-500">Alerts Today</span>
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
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Tracked Brands</h3>
              <div className="flex flex-wrap gap-2">
                  {diag?.brands?.map((b: string) => (
                      <span key={b} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase">{b}</span>
                  ))}
              </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Detected Categories</h3>
              <div className="flex flex-wrap gap-2">
                  {diag?.categories?.map((c: string) => (
                      <span key={c} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase">{c}</span>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Diagnostics;
