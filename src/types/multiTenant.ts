/**
 * Multi-Tenant Access Control Types
 * Defines user types, portals, and sub-user management
 */

export type UserType = 'back_office' | 'client' | 'vendor';
export type PortalType = 'back_office' | 'client' | 'vendor';
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * Main User type for multi-tenant system
 */
export interface User {
  id: string;
  email: string;
  name: string;
  
  // User Type & Portal
  userType: UserType;
  portal: PortalType;
  
  // Sub-User Support
  isSubUser: boolean;
  parentUserId?: string;
  parentUser?: User;
  subUserPermissions?: Record<string, boolean>;
  
  // Affiliation
  clientId?: string;
  vendorId?: string;
  
  // Role (for back office only)
  roleId?: string;
  role?: string;
  permissions?: string[];
  
  // Status
  status: UserStatus;
  isVerified: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  deactivatedAt?: string;
}

/**
 * Sub-User type
 */
export interface SubUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  permissions: Record<string, boolean>;
  lastLoginAt?: string;
  createdAt: string;
  isActive: boolean;
}

/**
 * Sub-User Invitation
 */
export interface SubUserInvitation {
  email: string;
  name: string;
  permissions?: Record<string, boolean>;
}

/**
 * Sub-User Limits
 */
export interface SubUserLimits {
  max: number;
  current: number;
  hasReachedLimit: boolean;
}

/**
 * Activity Log Entry
 */
export interface ActivityLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Portal configuration
 */
export interface Portal {
  type: PortalType;
  name: string;
  modules: PortalModule[];
}

/**
 * Portal Module
 */
export interface PortalModule {
  id: string;
  name: string;
  path: string;
  icon?: string;
  permissions?: string[];
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * My Team Response
 */
export interface MyTeamResponse {
  subUsers: SubUser[];
  limits: SubUserLimits;
}
