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
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/drops" element={<PriceDrops />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/diagnostics" element={<Diagnostics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}



export default App;
