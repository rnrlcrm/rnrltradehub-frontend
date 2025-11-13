/**
 * PortalRouter Component
 * Routes users to appropriate portal based on their user type
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

// Import portal components
import BackOfficePortal from './BackOfficePortal';
import PartnerRegistration from '../../pages/PartnerRegistration';
import MyPartnerProfile from '../../pages/MyPartnerProfile';

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
    case 'vendor':
    case 'partner':
      // All external partners use the same profile interface
      return <MyPartnerProfile partnerId={user.id} />;
    default:
      return <Navigate to="/login" replace />;
  }
};
