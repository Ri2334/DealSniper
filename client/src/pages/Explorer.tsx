import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ExternalLink, Award, Filter, X } from 'lucide-react';

const Explorer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [sortBy, setSortBy] = useState('dealScore_desc');
  const [lowestPriceOnly, setLowestPriceOnly] = useState(false);
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (brand) params.append('brand', brand);
      if (category) params.append('category', category);
      if (gender) params.append('gender', gender);
      if (ageGroup) params.append('ageGroup', ageGroup);
      if (sortBy) params.append('sortBy', sortBy);
      if (lowestPriceOnly) params.append('lowestPriceOnly', 'true');

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, brand, category, gender, ageGroup, sortBy, lowestPriceOnly]);

  const brandsList = ['H&M', "Levi's", 'Rare Rabbit', 'U.S. Polo Assn.', 'Van Heusen', 'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe', 'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike', 'Flying Machine', 'Pepe Jeans', 'Celio'];
  const categoriesList = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Shorts', 'Jackets', 'Sweatshirts', 'Shoes', 'Accessories', 'Other'];

  const clearFilters = () => {
    setBrand('');
    setCategory('');
    setGender('');
    setAgeGroup('');
    setLowestPriceOnly(false);
    setKeyword('');
    setSortBy('dealScore_desc');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Explorer</h1>
          <p className="text-gray-500">Discover and filter across 5,000+ tracked fashion deals.</p>
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Keyword..." 
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Sort By</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dealScore_desc">Deal Score (High - Low)</option>
                <option value="discount_desc">Discount (High - Low)</option>
                <option value="price_asc">Price (Low - High)</option>
                <option value="price_desc">Price (High - Low)</option>
                <option value="newest">Recently Updated</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer bg-green-50 p-2 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded text-primary focus:ring-primary accent-green-600"
                  checked={lowestPriceOnly}
                  onChange={(e) => setLowestPriceOnly(e.target.checked)}
                />
                <span className="text-sm font-bold text-green-800">Lowest Price Ever Only</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Brand</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">All Brands</option>
                {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Gender</label>
              <div className="flex flex-wrap gap-2">
                 {['Men', 'Women', 'Unisex', 'Boys', 'Girls'].map(g => (
                    <button 
                      key={g}
                      onClick={() => setGender(gender === g ? '' : g)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${gender === g ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {g}
                    </button>
                 ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Age Group</label>
              <div className="flex gap-2">
                 {['Adult', 'Kids'].map(a => (
                    <button 
                      key={a}
                      onClick={() => setAgeGroup(ageGroup === a ? '' : a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${ageGroup === a ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {a}
                    </button>
                 ))}
              </div>
            </div>

            <button 
               onClick={clearFilters}
               className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-sm transition-colors"
            >
              Clear All Filters
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
                <div className="col-span-full text-center py-12 text-gray-500 font-bold uppercase text-xs border border-dashed border-gray-300 rounded-xl bg-white">No products found matching filters.</div>
              ) : (
                products.map((product: any) => (
                  <a href={product.url} target="_blank" rel="noopener noreferrer" key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 group block cursor-pointer">
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
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-md">
                          {product.discountPercent}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{product.brand} • {product.category}</p>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors" title={product.name}>
                        {product.name}
                      </h3>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-lg font-black text-gray-900">₹{product.currentPrice}</span>
                        {product.mrp > product.currentPrice && (
                          <span className="text-sm text-gray-400 line-through font-medium">₹{product.mrp}</span>
                        )}
                      </div>
                      
                      {product.lowestPrice && product.currentPrice <= product.lowestPrice && (
                        <div className="mb-3 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded w-fit uppercase border border-green-100">
                          Lowest Price Ever
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 group-hover:bg-primary group-hover:text-white text-gray-700 text-xs font-black rounded uppercase transition-colors">
                        View Deal <ExternalLink size={12} />
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

export default Explorer;