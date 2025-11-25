import React from 'react';

interface SpeckleViewerProps {
  embedUrl: string;
}

const SpeckleViewer: React.FC<SpeckleViewerProps> = ({ embedUrl }) => {
  return (
    <div className="w-full h-full relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <iframe 
        title="Speckle Viewer" 
        src={embedUrl} 
        width="100%" 
        height="100%" 
        frameBorder="0"
        className="absolute inset-0 w-full h-full"
      ></iframe>
      
      {/* Overlay Badge */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200 z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-xs font-semibold text-slate-700">Live Model</span>
      </div>
    </div>
  );
};

export default SpeckleViewer;
