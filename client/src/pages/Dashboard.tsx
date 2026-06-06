import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, TrendingDown, Award, Globe, BarChart3, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600"
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900">{value}</h3>
        {trend && <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">{trend}</p>}
      </div>
      <div className={`${colors[color]} p-4 rounded-xl`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

const ProductRankItem = ({ product, index }: any) => (
  <a 
    href={product.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
  >
    <div className="w-8 font-black text-gray-300 group-hover:text-primary transition-colors text-lg italic">
      #{index + 1}
    </div>
    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-inner group-hover:shadow-sm transition-shadow">
      <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{product.name}</h4>
      <p className="text-[10px] text-gray-500 font-bold uppercase">{product.brand} • {product.category}</p>
    </div>
    <div className="flex flex-col items-end">
      <div className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm group-hover:shadow-md transition-shadow">
        {product.dealScore} SCORE
      </div>
      <p className="text-xs font-bold text-gray-900 mt-1">₹{product.currentPrice}</p>
    </div>
  </a>
);

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/analytics`);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Deal Intelligence</h1>
          <p className="text-gray-500 font-medium mt-1">Proprietary scoring engine tracking 17 premium brands.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
           <Clock size={14} className="text-primary" />
           LAST CRAWL: {stats?.lastCrawl ? new Date(stats.lastCrawl).toLocaleTimeString() : 'N/A'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Inventory" value={stats?.totalProducts || 0} icon={Globe} trend="Total Products" color="blue" />
        <StatCard title="Hot Deals" value={stats?.activeDeals || 0} icon={Award} trend="Score > 70" color="red" />
        <StatCard title="Intelligence" value={`${stats?.averageDealScore || 0}%`} icon={BarChart3} trend="Avg Deal Score" color="purple" />
        <StatCard title="Alerts" value={stats?.alertsSent || 0} icon={Bell} trend="Telegram Dispatched" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-blue-100"><Award size={20} /></div>
            <h3 className="text-xl font-black italic">TOP 10 DEALS TODAY</h3>
          </div>
          <div className="space-y-2">
            {stats?.topDealsToday?.length === 0 ? (
              <p className="text-gray-400 text-center py-10 font-bold uppercase text-xs">Awaiting next price crash...</p>
            ) : (
              stats?.topDealsToday?.map((p: any, i: number) => <ProductRankItem key={p._id} product={p} index={i} />)
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-600 p-2 rounded-xl text-white shadow-lg shadow-green-100"><TrendingDown size={20} /></div>
            <h3 className="text-xl font-black italic">NEW LOWEST PRICES</h3>
          </div>
          <div className="space-y-2">
            {stats?.topLowestEver?.length === 0 ? (
              <p className="text-gray-400 text-center py-10 font-bold uppercase text-xs">No new records hit today.</p>
            ) : (
              stats?.topLowestEver?.map((p: any, i: number) => <ProductRankItem key={p._id} product={p} index={i} />)
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Brand Coverage</h3>
            <div className="grid grid-cols-2 gap-4">
              {stats?.brandStats?.slice(0, 6).map((b: any) => (
                <div key={b._id} className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 truncate uppercase">{b._id}</span>
                  <span className="text-lg font-black text-gray-900">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Category Pulse</h3>
            <div className="space-y-4">
              {stats?.categoryStats?.slice(0, 5).map((c: any) => (
                <div key={c._id}>
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-bold text-gray-700 uppercase">{c._id}</span>
                      <span className="text-xs font-black text-primary">{c.count}</span>
                   </div>
                   <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, (c.count / (stats.totalProducts || 1)) * 500)}%` }}></div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
