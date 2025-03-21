import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border-4 border-t-yellow-500 border-r-yellow-400 border-b-yellow-300 border-l-yellow-200 animate-spin" />
        <div className="absolute w-24 h-24 rounded-full border-4 border-t-yellow-200 border-r-yellow-300 border-b-yellow-400 border-l-yellow-500 animate-ping opacity-30" />
        <div className="absolute text-yellow-500 font-bold text-3xl animate-pulse">
          ⚡
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
