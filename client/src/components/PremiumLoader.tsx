import { Activity } from 'lucide-react';

const PremiumLoader = ({ message = "SCANNING FOR DEALS..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-20 h-20 border-t-4 border-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="text-primary animate-pulse" size={32} />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <p className="text-sm font-black text-gray-900 tracking-[0.3em] uppercase">{message}</p>
        <div className="mt-2 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-[loader_2s_infinite_linear]"></div>
        </div>
      </div>
      <style>{`
        @keyframes loader {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PremiumLoader;
