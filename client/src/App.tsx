import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Deals from './pages/Deals';
import PriceDrops from './pages/PriceDrops';
import Diagnostics from './pages/Diagnostics';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/drops" element={<PriceDrops />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
          </Routes>
        </main>
        
        {/* Simple Footer */}
        <footer className="py-12 border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="bg-primary text-white p-1.5 rounded-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                    <span className="font-black text-xl tracking-tighter">DealSniper <span className="text-primary text-xs uppercase font-black ml-1">v4.0</span></span>
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">© 2026 Elite Discovery Engine. All rights reserved.</p>
            </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
