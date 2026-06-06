import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Deals from './pages/Deals';
import PriceDrops from './pages/PriceDrops';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-1 rounded">DS</span>
            DealSniper
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-600 hover:text-primary font-medium">Dashboard</Link>
            <Link to="/drops" className="text-gray-600 hover:text-primary font-medium flex items-center gap-1">
              Price Drops <span className="bg-green-500 text-white text-[10px] px-1 rounded-full">NEW</span>
            </Link>
            <Link to="/deals" className="text-gray-600 hover:text-primary font-medium flex items-center gap-1">
              Deals <span className="bg-red-500 text-white text-[10px] px-1 rounded-full animate-pulse">HOT</span>
            </Link>
            <Link to="/explorer" className="text-gray-600 hover:text-primary font-medium">Explorer</Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/drops" element={<PriceDrops />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/explorer" element={<Explorer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
