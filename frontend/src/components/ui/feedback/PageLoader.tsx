import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-tiny text-rosewood/60 font-medium tracking-widest uppercase">Loading...</span>
      </div>
    </div>
  );
};

export default PageLoader;
