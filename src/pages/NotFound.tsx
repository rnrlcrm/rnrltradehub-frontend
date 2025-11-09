
import React from 'react';
import { Button } from '../components/ui/Form';

const NotFound: React.FC = () => {
  const goHome = () => {
    window.location.hash = '#dashboard';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-6xl font-bold text-blue-700">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-slate-800">Page Not Found</h2>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist or has been moved.</p>
      <Button onClick={goHome} className="mt-8">
        Go to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;
