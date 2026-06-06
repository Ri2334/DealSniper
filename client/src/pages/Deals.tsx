import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Flame, Award } from 'lucide-react';

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      // Fetch only products with at least 50% discount or high deal score
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products?minDiscount=50&sortBy=dealScore_desc&limit=50`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
          <Flame size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Hot Deals</h1>
          <p className="text-gray-500">The biggest price drops across all tracked brands.</p>
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
              No mega deals found yet. Keep tracking!
            </div>
          ) : (
            products.map((product: any) => (
              <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 group">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300x400'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1">
                      <Award size={10} /> {product.dealScore} SCORE
                    </div>
                    <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                      Hot Deal
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                    {product.discountPercent}% OFF
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{product.brand}</p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 h-10 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-black text-gray-900">₹{product.currentPrice}</span>
                    <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
                  </div>
                  
                  {product.lowestPrice && product.currentPrice <= product.lowestPrice && (
                    <div className="mb-3 flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                      <TrendingDown size={12} /> LOWEST PRICE EVER
                    </div>
                  )}

                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-blue-200"
                  >
                    Buy on Myntra <ExternalLink size={14} />
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

// Internal component for TrendingDown since it was not imported in this specific file but mentioned in logic
const TrendingDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);

export default Deals;
