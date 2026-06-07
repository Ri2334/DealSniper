import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, Zap, Search, LayoutDashboard, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Price Drops', path: '/drops', icon: Zap, badge: 'NEW', badgeColor: 'bg-green-500' },
    { name: 'Deals', path: '/deals', icon: ShieldAlert, badge: 'HOT', badgeColor: 'bg-red-500', animate: true },
    { name: 'Explorer', path: '/explorer', icon: Search },
    { name: 'Admin', path: '/diagnostics', icon: ShieldCheck },
  ];


  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="bg-primary text-white p-1.5 rounded font-black text-sm tracking-tighter">DS</span>
              <span className="text-xl font-black text-gray-900 tracking-tight">DealSniper</span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  isActive(link.path)
                    ? 'bg-gray-100 text-primary'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <link.icon size={16} />
                {link.name}
                {link.badge && (
                  <span className={`${link.badgeColor} text-white text-[9px] px-1.5 py-0.5 rounded-full ${link.animate ? 'animate-pulse' : ''}`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-50 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 pb-4 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-black ${
                  isActive(link.path)
                    ? 'bg-gray-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <link.icon size={20} />
                {link.name}
                {link.badge && (
                  <span className={`${link.badgeColor} text-white text-[10px] px-2 py-0.5 rounded-full ${link.animate ? 'animate-pulse' : ''}`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
