import React from 'react';
import Loader from '../components/ui/Loader';

const LoadingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader className="w-16 h-16 text-indigo-600" />
      <h2 className="mt-4 text-xl font-medium text-gray-800">
        Generating your quiz...
      </h2>
      <p className="mt-2 text-gray-600">
        Our AI is crafting the perfect questions for you
      </p>
    </div>
  );
};

export default LoadingPage;