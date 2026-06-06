import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Flame, Award, TrendingDown, Filter, X } from 'lucide-react';

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [gender, setGender] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('minDiscount', '50');
      params.append('sortBy', 'dealScore_desc');
      params.append('limit', '50');
      
      if (category) params.append('category', category);
      if (brand) params.append('brand', brand);
      if (gender) params.append('gender', gender);
      if (priceMax) params.append('priceMax', priceMax);

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [category, brand, gender, priceMax]);

  const brandsList = ['H&M', "Levi's", 'Rare Rabbit', 'U.S. Polo Assn.', 'Van Heusen', 'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe', 'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike', 'Flying Machine', 'Pepe Jeans', 'Celio'];
  const categoriesList = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Shorts', 'Jackets', 'Sweatshirts', 'Shoes', 'Accessories', 'Other'];

  const clearFilters = () => {
    setCategory('');
    setBrand('');
    setGender('');
    setPriceMax('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
            <Flame size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Hot Deals</h1>
            <p className="text-gray-500">The biggest price drops across all tracked brands.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg font-bold text-sm"
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-black text-gray-900 flex items-center gap-2"><Filter size={18}/> FILTERS</h3>
             {isSidebarOpen && <button onClick={() => setIsSidebarOpen(false)}><X size={18}/></button>}
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Brand</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">All Brands</option>
                {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Gender</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">All Genders</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Max Price</label>
              <input 
                type="number" 
                placeholder="₹ Any" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>

            <button 
               onClick={clearFilters}
               className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-sm transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  No mega deals found yet. Keep tracking!
                </div>
              ) : (
                products.map((product: any) => (
                  <a href={product.url} target="_blank" rel="noopener noreferrer" key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 group block cursor-pointer">
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
                        <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg w-fit">
                          Hot Deal
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                        {product.discountPercent}% OFF
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{product.brand}</p>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors">
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

                      <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary group-hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-md group-hover:shadow-blue-200">
                        Buy on Myntra <ExternalLink size={14} />
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deals;
