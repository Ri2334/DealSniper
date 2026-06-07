import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Flame, Award, Filter, X, RotateCcw, Check, IndianRupee } from 'lucide-react';
import PremiumLoader from '../components/PremiumLoader';

const Deals = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchDeals = async (pageToFetch = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('minDiscount', '50');
      params.append('sortBy', 'dealScore_desc');
      params.append('page', pageToFetch.toString());
      params.append('limit', '24');
      
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (selectedBrands.length > 0) params.append('brand', selectedBrands.join(','));
      if (gender && gender !== '') params.append('gender', gender);
      if (priceMax && priceMax !== '0' && priceMax !== '') params.append('priceMax', priceMax);
      if (priceMin && priceMin !== '0' && priceMin !== '') params.append('priceMin', priceMin);

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`;
      console.log(`[DEBUG] Fetching Deals: ${apiUrl}`);
      
      const { data } = await axios.get(apiUrl);
      
      const newItems = data.products || [];
      if (isLoadMore) {
        setProducts(prev => [...prev, ...newItems]);
      } else {
        setProducts(newItems);
      }
      
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    console.log('%c[DEALSNIPER] Deals v4.0 Active', 'color: white; background: #ea580c; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    setPage(1);
    fetchDeals(1, false);
  }, [selectedCategories, selectedBrands, gender, priceMax, priceMin]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeals(nextPage, true);
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
    setSelectedCategories([]);
    setSelectedBrands([]);
    setGender('');
    setPriceMax('');
    setPriceMin('');
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
            <Flame size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">HOT DEALS</h1>
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">PREMIUM BUILD</span>
            </div>
            <p className="text-gray-500 font-medium">Showing {products.length} of {totalProducts} massive price drops.</p>
          </div>
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
             <h3 className="font-black text-gray-900 flex items-center gap-2 tracking-tighter uppercase text-sm"><Filter size={18} className="text-primary"/> Deal Filters</h3>
             {isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full">
                    <X size={20}/>
                </button>
             )}
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><IndianRupee size={12}/> Budget Range</label>
                <div className="grid grid-cols-2 gap-3">
                    <input 
                        type="number" 
                        placeholder="Min ₹" 
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black shadow-inner"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <input 
                        type="number" 
                        placeholder="Max ₹" 
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black shadow-inner"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium Brands ({selectedBrands.length})</label>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                 {brandsList.sort().map(b => (
                    <button 
                        key={b} 
                        onClick={() => toggleBrand(b)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-bold transition-all ${selectedBrands.includes(b) ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
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
                        className={`px-2 py-3 rounded-xl text-[10px] font-black text-center border transition-all ${selectedCategories.includes(c) ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                    >
                        {c}
                    </button>
                 ))}
              </div>
            </div>

            <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Gender</label>
                <select className="w-full px-2 py-3 bg-gray-50 border-none rounded-2xl text-[10px] font-black text-center cursor-pointer shadow-inner" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Any</option>
                    {['Men', 'Women', 'Unisex', 'Boys', 'Girls'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <button 
               onClick={clearFilters}
               className="w-full py-5 bg-gray-900 text-white font-black rounded-3xl text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-95"
            >
              <RotateCcw size={14} /> RESET FILTERS
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <PremiumLoader message="Hunting for elite mega deals..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-40 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-inner">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Flame size={40} className="text-gray-100" />
                    </div>
                    <p className="text-gray-500 font-black uppercase text-xs tracking-[0.2em]">No mega deals found yet.</p>
                    <button onClick={clearFilters} className="mt-6 text-primary font-black text-sm underline tracking-tighter hover:text-blue-700 transition-colors">WIPE FILTERS</button>
                </div>
              ) : (
                products.map((product: any) => (
                  <a href={product.url} target="_blank" rel="noopener noreferrer" key={product._id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 group flex flex-col cursor-pointer h-full border-b-4 border-b-transparent hover:border-b-orange-500">
                    <div className="relative h-80 overflow-hidden bg-gray-50">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300x400'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="bg-white/95 backdrop-blur-md text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tight shadow-sm flex items-center gap-1.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Award size={12} /> {product.dealScore} INTEL
                        </div>
                        <div className="bg-orange-600 text-white text-[9px] font-black px-3 py-1 rounded-xl shadow-lg uppercase tracking-widest w-fit animate-pulse border border-white/20">
                          HOT DEAL
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-2 rounded-2xl shadow-xl border-2 border-white/20">
                        {product.discountPercent}% OFF
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{product.brand}</p>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 h-10 mb-6 group-hover:text-primary transition-colors leading-tight tracking-tight">
                        {product.name}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{product.currentPrice.toLocaleString()}</span>
                          <span className="text-sm text-gray-400 line-through font-bold opacity-40">₹{product.mrp.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 w-full py-4 bg-primary group-hover:bg-blue-700 text-white text-xs font-black rounded-2xl uppercase transition-all shadow-lg shadow-blue-100 group-hover:shadow-blue-300 active:scale-95">
                          Buy on Myntra <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {products.length > 0 && products.length < totalProducts && (
            <div className="mt-20 flex flex-col items-center gap-6 pb-20">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] animate-pulse">Sync available: {totalProducts - products.length} deals</p>
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-primary text-white px-24 py-6 rounded-3xl font-black text-lg shadow-2xl shadow-blue-200 hover:shadow-primary/50 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 border-8 border-white group"
              >
                {loadingMore ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        HUNTING...
                    </div>
                ) : (
                    <div className="flex items-center gap-3 font-black uppercase tracking-tighter">
                        LOAD MORE DEALS
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

export default Deals;
