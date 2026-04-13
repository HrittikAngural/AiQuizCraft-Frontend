import React from 'react';

const BentoGrid = ({ children }) => (
  <div className="grid grid-cols-3 grid-rows-3 gap-4 h-[600px]">
    {children}
  </div>
);

const BentoItem = ({ children, className = '', colSpan = 1, rowSpan = 1 }) => (
  <div className={`rounded-xl p-6 bg-white shadow-md ${className}`} 
       style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}>
    {children}
  </div>
);

export { BentoGrid, BentoItem };