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
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <DashboardHeader />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: 3D Model & Overlays */}
        <div className="flex-1 relative bg-slate-100 min-w-0">
          <SpeckleViewer embedUrl="https://app.speckle.systems/projects/0876633ea1/models/1e05934141?embedToken=3d3c2e0ab4878e7d01b16a1608e78e03848887eed4#embed=%7B%22isEnabled%22%3Atrue%7D" />

          {/* Status Overlay (Top Left) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
             <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 pointer-events-auto">
               <div className={`w-2 h-2 rounded-full ${activeElements.length < allElements.length ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
               <div>
                 <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Visibility</p>
                 <p className="text-sm font-semibold text-slate-800">{activeElements.length} / {allElements.length} Elements</p>
               </div>
             </div>
          </div>

          {/* Current Active Filter Tags (Bottom Left) */}
          {currentFilter && currentFilter.operation !== 'RESET' && (
            <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 max-w-md pointer-events-none">
               {currentFilter.operation && (
                 <span className="px-3 py-1 bg-slate-900 text-white text-xs font-mono rounded-md shadow-lg">
                   CMD: {currentFilter.operation}
                 </span>
               )}
               {currentFilter.category && (
                 <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-lg">
                   {currentFilter.category}
                 </span>
               )}
            </div>
          )}
        </div>

        {/* Right Side: Dialog State */}
        <ControlPanel 
          onCommandProcessed={handleCommand}
          filteredCount={activeElements.length}
        />
      </main>
    </div>
  );
};

export default App;