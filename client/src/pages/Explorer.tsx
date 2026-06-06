import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ExternalLink, Award } from 'lucide-react';

const Explorer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('dealScore_desc');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (brand) params.append('brand', brand);
      if (category) params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);

      // Using absolute URL for local dev, should use env in prod
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, brand, category, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Explorer</h1>
          <p className="text-gray-500">Discover and filter tracked fashion deals.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-xs uppercase"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">All Brands</option>
            <option value="H&M">H&M</option>
            <option value="Levis">Levi's</option>
            <option value="RARE RABBIT">Rare Rabbit</option>
            <option value="Tommy Hilfiger">Tommy Hilfiger</option>
            <option value="Calvin Klein">Calvin Klein</option>
            <option value="Puma">Puma</option>
            <option value="Adidas">Adidas</option>
            <option value="Nike">Nike</option>
          </select>

          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-xs uppercase"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Shirts">Shirts</option>
            <option value="T-Shirts">T-Shirts</option>
            <option value="Jeans">Jeans</option>
            <option value="Shoes">Shoes</option>
            <option value="Jackets">Jackets</option>
            <option value="Accessories">Accessories</option>
          </select>

          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-xs uppercase"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dealScore_desc">Intelligence (Score)</option>
            <option value="discount_desc">Highest Discount</option>
            <option value="price_asc">Lowest Price</option>
            <option value="newest">Newly Tracked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 font-bold uppercase text-xs border border-dashed border-gray-300 rounded-xl">No products found.</div>
          ) : (
            products.map((product: any) => (
              <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300x400'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1">
                      <Award size={10} /> {product.dealScore} SCORE
                    </div>
                  </div>
                  {product.discountPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{product.brand} • {product.category}</p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 h-10 mb-2" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900">₹{product.currentPrice}</span>
                    {product.mrp > product.currentPrice && (
                      <span className="text-sm text-gray-400 line-through font-medium">₹{product.mrp}</span>
                    )}
                  </div>
                  
                  {product.lowestPrice && product.currentPrice <= product.lowestPrice && (
                    <div className="mb-3 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded w-fit uppercase">
                      Lowest Price Ever
                    </div>
                  )}

                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-primary hover:text-white text-gray-700 text-xs font-black rounded uppercase transition-colors"
                  >
                    View Deal <ExternalLink size={12} />
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

export default Explorer;
