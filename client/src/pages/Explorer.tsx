import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ExternalLink, Award, Filter, X, Check, RotateCcw, Tag, IndianRupee, Layers } from 'lucide-react';
import PremiumLoader from '../components/PremiumLoader';

const Explorer = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter States
  const [keyword, setKeyword] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [sortBy, setSortBy] = useState('dealScore_desc');
  const [lowestPriceOnly, setLowestPriceOnly] = useState(false);
  const [newTodayOnly, setNewTodayOnly] = useState(false);
  const [priceMax, setPriceMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [minScore, setMinScore] = useState('');
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchProducts = async (pageToFetch = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('page', pageToFetch.toString());
      params.append('limit', '24');

      if (keyword && keyword.trim() !== '') params.append('keyword', keyword.trim());
      if (selectedBrands.length > 0) params.append('brand', selectedBrands.join(','));
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (gender && gender !== '') params.append('gender', gender);
      if (ageGroup && ageGroup !== '') params.append('ageGroup', ageGroup);
      if (sortBy) params.append('sortBy', sortBy);
      if (lowestPriceOnly) params.append('lowestPriceOnly', 'true');
      if (newTodayOnly) params.append('newTodayOnly', 'true');
      if (priceMax && priceMax !== '0' && priceMax !== '') params.append('priceMax', priceMax);
      if (priceMin && priceMin !== '0' && priceMin !== '') params.append('priceMin', priceMin);
      if (minDiscount && minDiscount !== '0' && minDiscount !== '') params.append('minDiscount', minDiscount);
      if (minScore && minScore !== '0' && minScore !== '') params.append('dealScoreMin', minScore);

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`;
      console.log(`[DEBUG] Fetching Explorer: ${apiUrl}`);
      
      const { data } = await axios.get(apiUrl);
      
      const newItems = data.products || [];
      if (isLoadMore) {
        setProducts(prev => [...prev, ...newItems]);
      } else {
        setProducts(newItems);
      }
      
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    console.log('%c[DEALSNIPER] Explorer v4.0 Active', 'color: white; background: #2563eb; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts(1, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, selectedBrands, selectedCategories, gender, ageGroup, sortBy, lowestPriceOnly, newTodayOnly, priceMax, priceMin, minDiscount, minScore]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  const brandsList = ['H&M', "Levi's", 'Rare Rabbit', 'U.S. Polo Assn.', 'Van Heusen', 'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe', 'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike', 'Flying Machine', 'Pepe Jeans', 'Celio'];
  const categoriesList = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Shorts', 'Jackets', 'Sweatshirts', 'Shoes', 'Accessories', 'Other'];

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setGender('');
    setAgeGroup('');
    setLowestPriceOnly(false);
    setNewTodayOnly(false);
    setKeyword('');
    setSortBy('dealScore_desc');
    setPriceMax('');
    setPriceMin('');
    setMinDiscount('');
    setMinScore('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Advanced Explorer</h1>
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">PREMIUM BUILD</span>
          </div>
          <p className="text-gray-500 font-medium">Showing {products.length} of {totalProducts} matches in system.</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-blue-100"
        >
          <Filter size={18} /> OPEN FILTERS
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className={`w-full md:w-72 space-y-6 ${isSidebarOpen ? 'fixed inset-0 z-[60] bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
             <h3 className="font-black text-gray-900 flex items-center gap-2 tracking-tighter"><Filter size={20} className="text-primary"/> ADVANCED FILTERS</h3>
             {isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full">
                    <X size={20}/>
                </button>
             )}
          </div>

          <div className="space-y-8">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => setLowestPriceOnly(!lowestPriceOnly)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${lowestPriceOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-transparent text-gray-500'}`}
                >
                    <IndianRupee size={18} className={lowestPriceOnly ? 'text-green-600' : 'text-gray-400'} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Record Lows Only</span>
                </button>
                <button 
                    onClick={() => setNewTodayOnly(!newTodayOnly)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${newTodayOnly ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-transparent text-gray-500'}`}
                >
                    <Tag size={18} className={newTodayOnly ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Scraped Today</span>
                </button>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><IndianRupee size={12}/> Budget Range</label>
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="number" 
                        placeholder="Min ₹" 
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <input 
                        type="number" 
                        placeholder="Max ₹" 
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Sort Strategy</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-primary text-xs font-black"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dealScore_desc">Intelligence (High to Low)</option>
                <option value="discount_desc">Price Drop % (Max first)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="newest">Latest Discovery</option>
              </select>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Discount: {minDiscount || 0}%</label>
                <div className="flex flex-wrap gap-2">
                    {[30, 50, 70, 80].map(d => (
                        <button 
                            key={d}
                            onClick={() => setMinDiscount(minDiscount === String(d) ? '' : String(d))}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all border ${minDiscount === String(d) ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                        >
                            {d}%+
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium Brands ({selectedBrands.length})</label>
              <div className="max-h-48 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                 {brandsList.sort().map(b => (
                    <button 
                        key={b} 
                        onClick={() => toggleBrand(b)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${selectedBrands.includes(b) ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {b}
                        {selectedBrands.includes(b) && <Check size={12}/>}
                    </button>
                 ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categories ({selectedCategories.length})</label>
              <div className="grid grid-cols-2 gap-2">
                 {categoriesList.map(c => (
                    <button 
                        key={c} 
                        onClick={() => toggleCategory(c)}
                        className={`px-2 py-2.5 rounded-xl text-[10px] font-bold text-center border transition-all ${selectedCategories.includes(c) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                    >
                        {c}
                    </button>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                    <select className="w-full px-2 py-2.5 bg-gray-50 border-none rounded-xl text-[10px] font-bold" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Any</option>
                        {['Men', 'Women', 'Unisex', 'Boys', 'Girls'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age</label>
                    <select className="w-full px-2 py-2.5 bg-gray-50 border-none rounded-xl text-[10px] font-bold" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                        <option value="">Any</option>
                        {['Adult', 'Kids'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <button 
               onClick={clearFilters}
               className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              <RotateCcw size={14} /> RESET FILTERS
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {loading ? (
            <PremiumLoader message="Scanning database for elite deals..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Search size={32} className="text-gray-200" />
                    </div>
                    <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No products found matching filters.</p>
                    <button onClick={clearFilters} className="mt-4 text-primary font-bold text-sm underline hover:text-blue-700 transition-colors">Reset all filters</button>
                </div>
              ) : (
                products.map((product: any) => (
                  <a href={product.url} target="_blank" rel="noopener noreferrer" key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group flex flex-col cursor-pointer h-full">
                    <div className="relative h-72 overflow-hidden bg-gray-50">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300x400'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <div className="bg-white/90 backdrop-blur-md text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight shadow-sm flex items-center gap-1.5 border border-primary/10">
                          <Award size={12} /> {product.dealScore} INTEL
                        </div>
                      </div>
                      {product.discountPercent > 0 && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-xl">
                          -{product.discountPercent}%
                        </div>
                      )}
                      {product.lowestPrice && product.currentPrice <= product.lowestPrice && (
                        <div className="absolute bottom-3 left-3 bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg uppercase tracking-tighter">
                          Record Low
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{product.brand}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{product.category}</p>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 h-10 mb-4 group-hover:text-primary transition-colors leading-tight">
                        {product.name}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{product.currentPrice}</span>
                          {product.mrp > product.currentPrice && (
                            <span className="text-sm text-gray-400 line-through font-bold opacity-60">₹{product.mrp}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-50 group-hover:bg-primary group-hover:text-white text-gray-900 text-[10px] font-black rounded-xl uppercase transition-all shadow-sm group-hover:shadow-primary/30">
                          Unlock Deal <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {products.length > 0 && products.length < totalProducts && (
            <div className="mt-16 flex flex-col items-center gap-4 pb-20">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Inventory: {totalProducts} items matched</p>
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-primary text-white px-20 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 border-4 border-white"
              >
                {loadingMore ? 'HUNTING...' : `LOAD MORE (${totalProducts - products.length} DEALS)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explorer;
