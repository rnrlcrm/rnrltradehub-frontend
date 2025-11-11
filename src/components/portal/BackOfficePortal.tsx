/**
 * BackOfficePortal Component
 * Wrapper for the existing back office application
 */

import React from 'react';
import App from '../../App';

const BackOfficePortal: React.FC = () => {
  // The existing App.tsx already handles the back office portal
  // This is just a wrapper component for consistency
  return <App />;
};

export default BackOfficePortal;
