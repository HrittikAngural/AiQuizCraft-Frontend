import React from 'react';

const Loader = ({ className = '' }) => {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${className}`}></div>
  );
};

export default Loader;