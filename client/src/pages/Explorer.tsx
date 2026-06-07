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
  const categoriesList = [
    'Shirts', 'Polo T-Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Cargo Trousers', 'Joggers & Track Pants', 'Shorts', 
    'Jackets', 'Hoodies', 'Sweatshirts', 'Sweaters', 'Shoes', 'Sneakers', 'Sports Shoes', 'Formal Shoes', 
    'Sandals & Sliders', 'Boots', 'Watches', 'Smart Watches', 'Fragrance', 'Sunglasses', 'Belts', 'Wallets', 
    'Backpacks', 'Handbags', 'Bags', 'Kurtas', 'Ethnic Wear', 'Formal Wear', 'Underwear', 'Socks', 'Activewear', 'Other'
  ];

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
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Explorer</h1>
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm shadow-red-100">PREMIUM BUILD</span>
          </div>
          <p className="text-gray-500 font-medium">Syncing with {totalProducts.toLocaleString()} fashion deals across target stores.</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-blue-100"
        >
          <Filter size={18} /> OPEN FILTERS
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        
        {/* Sidebar Filters */}
        <aside className={`w-full md:w-80 shrink-0 space-y-6 md:sticky md:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar ${isSidebarOpen ? 'fixed inset-0 z-[60] bg-white p-6' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
             <h3 className="font-black text-gray-900 flex items-center gap-2 tracking-tighter uppercase text-sm"><Filter size={18} className="text-primary"/> Precision Control</h3>
             {isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20}/>
                </button>
             )}
          </div>

          <div className="space-y-8 pb-10">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Keyword Search..." 
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold shadow-inner transition-all placeholder:text-gray-300"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => setLowestPriceOnly(!lowestPriceOnly)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${lowestPriceOnly ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                    <IndianRupee size={18} className={lowestPriceOnly ? 'text-green-600' : 'text-gray-400 group-hover:scale-110 transition-transform'} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Record Lows Only</span>
                </button>
                <button 
                    onClick={() => setNewTodayOnly(!newTodayOnly)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${newTodayOnly ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                    <Tag size={18} className={newTodayOnly ? 'text-blue-600' : 'text-gray-400 group-hover:scale-110 transition-transform'} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Discovery Today</span>
                </button>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><IndianRupee size={12}/> Budget Bracket</label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-gray-300 px-1 uppercase tracking-tighter">Min ₹</span>
                        <input 
                            type="number" 
                            placeholder="0" 
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black shadow-inner focus:ring-1 focus:ring-primary"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-gray-300 px-1 uppercase tracking-tighter">Max ₹</span>
                        <input 
                            type="number" 
                            placeholder="Max" 
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black shadow-inner focus:ring-1 focus:ring-primary"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Order Strategy</label>
              <div className="relative group">
                <select 
                    className="w-full px-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary text-xs font-black appearance-none cursor-pointer group-hover:border-primary/20 transition-colors"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="dealScore_desc">Best Intel First</option>
                    <option value="discount_desc">Price Drop %</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Latest Found</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Price Drop</label>
                <div className="flex flex-wrap gap-2">
                    {[30, 50, 70, 80].map(d => (
                        <button 
                            key={d}
                            onClick={() => setMinDiscount(minDiscount === String(d) ? '' : String(d))}
                            className={`flex-1 min-w-[60px] py-3 rounded-xl text-[10px] font-black transition-all border ${minDiscount === String(d) ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:scale-105 active:scale-95'}`}
                        >
                            {d}%+
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>Premium Brands</span>
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[8px]">{selectedBrands.length}</span>
              </label>
              <div className="max-h-64 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar scroll-smooth">
                 {brandsList.sort().map(b => (
                    <button 
                        key={b} 
                        onClick={() => toggleBrand(b)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${selectedBrands.includes(b) ? 'bg-primary text-white shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-[0.98]'}`}
                    >
                        {b}
                        {selectedBrands.includes(b) && <Check size={12}/>}
                    </button>
                 ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Store Sections</label>
              <div className="grid grid-cols-2 gap-2">
                 {categoriesList.map(c => (
                    <button 
                        key={c} 
                        onClick={() => toggleCategory(c)}
                        className={`px-2 py-3.5 rounded-xl text-[10px] font-black text-center border transition-all ${selectedCategories.includes(c) ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 active:scale-95'}`}
                    >
                        {c}
                    </button>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block leading-none">Gender</label>
                    <select className="w-full px-2 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-black text-center cursor-pointer shadow-inner appearance-none focus:ring-2 focus:ring-primary" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Any</option>
                        {['Men', 'Women', 'Unisex', 'Boys', 'Girls'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block leading-none">Age Group</label>
                    <select className="w-full px-2 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-black text-center cursor-pointer shadow-inner appearance-none focus:ring-2 focus:ring-primary" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                        <option value="">Any</option>
                        {['Adult', 'Kids'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <button 
               onClick={clearFilters}
               className="w-full py-5 bg-gray-900 text-white font-black rounded-3xl text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] active:scale-95 group border-2 border-gray-800"
            >
              <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> RESET FILTERS
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <PremiumLoader message="Syncing with elite inventory..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-48 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-inner">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 animate-pulse">
                        <Search size={40} className="text-gray-200" />
                    </div>
                    <p className="text-gray-500 font-black uppercase text-xs tracking-[0.3em]">Zero results in target</p>
                    <button onClick={clearFilters} className="mt-8 bg-primary/10 text-primary px-8 py-3 rounded-full font-black text-sm tracking-tighter hover:bg-primary hover:text-white transition-all active:scale-95">WIPE ALL FILTERS</button>
                </div>
              ) : (
                products.map((product: any) => (
                  <a href={product.url} target="_blank" rel="noopener noreferrer" key={product._id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.15)] transition-all duration-700 transform hover:-translate-y-4 group flex flex-col cursor-pointer h-full relative">
                    <div className="relative h-80 overflow-hidden bg-gray-50">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300x400'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute top-5 left-5 flex flex-col gap-2">
                        <div className="bg-white/95 backdrop-blur-md text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tight shadow-sm flex items-center gap-1.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <Award size={12} /> {product.dealScore} INTEL
                        </div>
                      </div>
                      {product.discountPercent > 0 && (
                        <div className="absolute top-5 right-5 bg-red-600 text-white text-[11px] font-black px-4 py-2 rounded-2xl shadow-2xl border-2 border-white/20 transform rotate-3 group-hover:rotate-0 transition-transform">
                          -{product.discountPercent}%
                        </div>
                      )}
                      {product.lowestPrice && product.currentPrice <= product.lowestPrice && (
                        <div className="absolute bottom-5 left-5 bg-green-600 text-white text-[9px] font-black px-4 py-1.5 rounded-xl shadow-lg uppercase tracking-widest border border-white/20">
                          Record Low
                        </div>
                      )}
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-[11px] text-primary font-black uppercase tracking-[0.2em]">{product.brand}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase bg-gray-50 px-2.5 py-1 rounded-md">{product.category}</p>
                      </div>
                      <h3 className="text-base font-black text-gray-900 line-clamp-2 h-12 mb-8 group-hover:text-primary transition-colors leading-tight tracking-tight">
                        {product.name}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-center gap-3 mb-8">
                          <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{product.currentPrice.toLocaleString()}</span>
                          {product.mrp > product.currentPrice && (
                            <span className="text-base text-gray-300 line-through font-bold opacity-60">₹{product.mrp.toLocaleString()}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center gap-3 w-full py-5 bg-gray-50 group-hover:bg-primary group-hover:text-white text-gray-900 text-[11px] font-black rounded-3xl uppercase transition-all shadow-sm group-hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 group-hover:scale-[1.02]">
                          Unlock Deal <ExternalLink size={16} />
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {products.length > 0 && products.length < totalProducts && (
            <div className="mt-24 flex flex-col items-center gap-6 pb-32">
                <div className="flex items-center gap-4 w-full px-12">
                    <div className="flex-1 h-px bg-gray-100"></div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] animate-pulse">Sync available: {totalProducts - products.length} deals</p>
                    <div className="flex-1 h-px bg-gray-100"></div>
                </div>
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-primary text-white px-28 py-7 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-200 hover:shadow-primary/50 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 border-[10px] border-white group"
              >
                {loadingMore ? (
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        SYNCING...
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        LOAD MORE DEALS <ChevronRight size={28} className="group-hover:translate-x-3 transition-transform duration-500"/>
                    </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 18l6-6-6-6"/>
    </svg>
);

export default Explorer;
