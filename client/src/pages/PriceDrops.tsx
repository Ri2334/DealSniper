import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, TrendingDown, ArrowDown } from 'lucide-react';

const PriceDrops = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrops = async () => {
    setLoading(true);
    try {
      // Fetch products with a dropPercentage > 0, sorted by biggest drop
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products?sortBy=discount_desc&limit=50`);
      // We'll filter and sort by true price drop on client side for now or add a server sort
      // To strictly follow "True Price Drop", let's assume we want products with dropPercentage > 10
      const filtered = (data.products || []).filter((p: any) => p.dropPercentage > 0)
        .sort((a: any, b: any) => b.dropPercentage - a.dropPercentage);
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-red-100 p-2 rounded-lg text-red-600">
          <ArrowDown size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">True Price Drops</h1>
          <p className="text-gray-500">Real-time tracking of prices falling from their previously observed values.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              No recent price drops detected from last observation. Monitoring in progress...
            </div>
          ) : (
            products.map((product: any) => (
              <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300x400'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                    <TrendingDown size={12} /> {product.dropPercentage}% DROP
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{product.brand}</p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 h-10 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-col mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-gray-900">₹{product.currentPrice}</span>
                        <span className="text-xs text-gray-400 font-medium">from ₹{product.lastPrice}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                        Dropped {new Date(product.lastDropDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {product.currentPrice <= product.lowestPrice && (
                    <div className="mb-3 flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                      NEW LOWEST PRICE EVER
                    </div>
                  )}

                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all shadow-md"
                  >
                    Grab It Now <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PriceDrops;
