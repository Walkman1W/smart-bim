import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
          B
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Smart<span className="text-blue-600">BIM</span></h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Projects</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Analytics</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Reports</span>
        </div>
        <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
          <img 
            src="https://picsum.photos/32/32" 
            alt="User" 
            className="w-8 h-8 rounded-full border border-slate-200"
          />
          <span className="hidden md:block text-sm font-semibold text-slate-700">Architect Doe</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
