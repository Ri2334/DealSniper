import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Flame, Award, TrendingDown, Filter, X, Search, RotateCcw, Check } from 'lucide-react';

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [priceMax, setPriceMax] = useState('');
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
      if (gender) params.append('gender', gender);
      if (priceMax) params.append('priceMax', priceMax);

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`);
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...(data.products || [])]);
      } else {
        setProducts(data.products || []);
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
    setPage(1);
    fetchDeals(1, false);
  }, [selectedCategories, selectedBrands, gender, priceMax]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeals(nextPage, true);
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
    setSelectedCategories([]);
    setSelectedBrands([]);
    setGender('');
    setPriceMax('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
            <Flame size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">HOT DEALS</h1>
            <p className="text-gray-500 font-medium">Biggest price drops across premium brands.</p>
          </div>
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
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-black text-gray-900 flex items-center gap-2 tracking-tighter"><Filter size={20} className="text-primary"/> DEAL FILTERS</h3>
             {isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full">
                    <X size={20}/>
                </button>
             )}
          </div>

          <div className="space-y-6">
            <div>
                <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Price: ₹{priceMax || '∞'}</label>
                </div>
                <input type="range" min="0" max="5000" step="100" className="w-full accent-primary" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Brands ({selectedBrands.length})</label>
              <div className="max-h-48 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                 {brandsList.map(b => (
                    <button 
                        key={b} 
                        onClick={() => toggleBrand(b)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedBrands.includes(b) ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {b}
                        {selectedBrands.includes(b) && <Check size={12}/>}
                    </button>
                 ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Categories ({selectedCategories.length})</label>
              <div className="grid grid-cols-2 gap-2">
                 {categoriesList.map(c => (
                    <button 
                        key={c} 
                        onClick={() => toggleCategory(c)}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold text-center border transition-all ${selectedCategories.includes(c) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                    >
                        {c}
                    </button>
                 ))}
              </div>
            </div>

            <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Gender</label>
                <select className="w-full px-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Any</option>
                    {['Men', 'Women', 'Unisex', 'Boys', 'Girls'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <button 
               onClick={clearFilters}
               className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              <RotateCcw size={14} /> RESET
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Hunting for mega deals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <Flame size={48} className="text-gray-100 mb-4" />
                    <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No mega deals found yet.</p>
                    <button onClick={clearFilters} className="mt-4 text-primary font-bold text-sm underline">Reset filters</button>
                </div>
              ) : (
                products.map((product: any) => (
                  <a href={product.url} target="_blank" rel="noopener noreferrer" key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col cursor-pointer h-full">
                    <div className="relative h-72 overflow-hidden bg-gray-50">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300x400'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <div className="bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight shadow-sm flex items-center gap-1.5 border border-primary/20">
                          <Award size={12} /> {product.dealScore} INTEL
                        </div>
                        <div className="bg-orange-600 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg uppercase tracking-tighter w-fit">
                          HOT DEAL
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-xl animate-pulse">
                        {product.discountPercent}% OFF
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{product.brand}</p>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 h-10 mb-4 group-hover:text-primary transition-colors leading-tight">
                        {product.name}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{product.currentPrice}</span>
                          <span className="text-sm text-gray-400 line-through font-bold opacity-60">₹{product.mrp}</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary group-hover:bg-blue-700 text-white text-xs font-black rounded-xl uppercase transition-all shadow-lg shadow-blue-100 group-hover:shadow-blue-300">
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
            <div className="mt-12 flex justify-center">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-primary text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:shadow-primary/30 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loadingMore ? 'SEARCHING FOR MORE...' : 'LOAD MORE DEALS'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deals;

