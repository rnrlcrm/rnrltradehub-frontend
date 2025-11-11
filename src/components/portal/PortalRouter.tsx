/**
 * PortalRouter Component
 * Routes users to appropriate portal based on their user type
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

// Import portal components (these will be created or already exist)
import { ClientPortal } from '../../pages/ClientPortal';
import { VendorPortal } from '../../pages/VendorPortal';
import BackOfficePortal from './BackOfficePortal';

export const PortalRouter: React.FC = () => {
  const { user, isAuthenticated } = useUser();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user's portal type
  switch (user.portal) {
    case 'back_office':
      return <BackOfficePortal />;
    case 'client':
      return <ClientPortal />;
    case 'vendor':
      return <VendorPortal />;
    default:
      return <Navigate to="/login" replace />;
  }
};
