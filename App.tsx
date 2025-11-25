import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import SpeckleViewer from './components/SpeckleViewer';
import ControlPanel from './components/ControlPanel';
import { BIMQueryResponse, BIMOperation, MockBIMElement } from './types';

// Mock data generator for simulation
const generateMockElements = (count: number): MockBIMElement[] => {
  const categories = ['Walls', 'Columns', 'Slabs', 'Windows', 'Doors', 'Beams', 'HVAC'];
  const levels = ['Foundation', 'Level 1', 'Level 2', 'Roof'];
  const materials = ['Concrete', 'Brick', 'Glass', 'Steel', 'Timber'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `el-${i}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    name: `Element ${i + 1}`,
    material: materials[Math.floor(Math.random() * materials.length)]
  }));
};

const App: React.FC = () => {
  const [allElements] = useState<MockBIMElement[]>(generateMockElements(500));
  const [activeElements, setActiveElements] = useState<MockBIMElement[]>([]);
  const [currentFilter, setCurrentFilter] = useState<BIMQueryResponse | null>(null);

  useEffect(() => {
    setActiveElements(allElements);
  }, [allElements]);

  // Logic to simulate filtering based on AI response
  const handleCommand = (response: BIMQueryResponse) => {
    setCurrentFilter(response);
    
    if (response.operation === BIMOperation.RESET) {
      setActiveElements(allElements);
      return;
    }

    let filtered = [...allElements];

    if (response.category) {
      filtered = filtered.filter(e => e.category.toLowerCase().includes(response.category!.toLowerCase()));
    }
    
    if (response.level) {
      filtered = filtered.filter(e => e.level.toLowerCase().includes(response.level!.toLowerCase()));
    }

    if (response.material) {
      filtered = filtered.filter(e => e.material.toLowerCase().includes(response.material!.toLowerCase()));
    }

    setActiveElements(filtered);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <DashboardHeader />
      
      <main className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-4">
          
          {/* Top Status Bar (Simulated SDK State) */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between min-h-[60px]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Command</span>
              {currentFilter ? (
                <div className="flex gap-2">
                   <span className="px-2 py-1 bg-slate-800 text-white text-xs rounded-md font-mono">
                     {currentFilter.operation}
                   </span>
                   {currentFilter.category && (
                     <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200">
                       Cat: {currentFilter.category}
                     </span>
                   )}
                   {currentFilter.level && (
                     <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md border border-purple-200">
                       Lvl: {currentFilter.level}
                     </span>
                   )}
                </div>
              ) : (
                <span className="text-sm text-slate-500 italic">System Ready. Waiting for input...</span>
              )}
            </div>
            
            {/* Visual indicator of filtered count vs total */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>Showing {activeElements.length} / {allElements.length} Objects</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${(activeElements.length / allElements.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Speckle Viewer Area */}
          <div className="flex-1 min-h-0 relative">
             {/* 
                NOTE: In a production environment, we would use the Speckle Viewer SDK directly.
                However, to make this work instantly in a generated React environment without complex build steps,
                we use the Embed Iframe provided by the user. 
                
                The filtering logic above (activeElements) simulates what we would pass to:
                viewer.isolate(activeElements.map(e => e.id))
             */}
            <SpeckleViewer embedUrl="https://app.speckle.systems/projects/0876633ea1/models/1e05934141?embedToken=3d3c2e0ab4878e7d01b16a1608e78e03848887eed4#embed=%7B%22isEnabled%22%3Atrue%7D" />
            
            {/* Simulated Data Overlay - visual feedback since we can't control iframe internals directly here */}
            {activeElements.length < allElements.length && activeElements.length > 0 && (
               <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-64 bg-white/95 backdrop-blur shadow-lg border border-slate-200 rounded-lg p-3 max-h-[200px] overflow-y-auto custom-scrollbar z-10 transition-all">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Filtered Objects</h3>
                  <ul className="space-y-1">
                    {activeElements.slice(0, 10).map((el) => (
                      <li key={el.id} className="text-xs flex justify-between items-center text-slate-700 border-b border-slate-100 pb-1 last:border-0">
                        <span>{el.category}</span>
                        <span className="text-slate-400">{el.id}</span>
                      </li>
                    ))}
                    {activeElements.length > 10 && (
                      <li className="text-xs text-center text-blue-600 font-medium pt-1">
                        + {activeElements.length - 10} more items...
                      </li>
                    )}
                  </ul>
               </div>
            )}
          </div>
        </div>

        {/* Right Control Panel (Collapsible on mobile via css usually, kept visible for demo) */}
        <ControlPanel 
          onCommandProcessed={handleCommand} 
          filteredCount={activeElements.length}
        />
      </main>
    </div>
  );
};

export default App;
