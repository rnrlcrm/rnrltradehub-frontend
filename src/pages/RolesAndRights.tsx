
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { User, Module, Permission, UserRole } from '../types';
import { mockPermissions as initialPermissions } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface RolesAndRightsProps {
  currentUser: User;
}

const allModules: Module[] = [
  'Sales Contracts', 
  'Invoices', 
  'Payments', 
  'Disputes', 
  'Commissions', 
  'Vendors & Clients', 
  'User Management', 
  'Settings', 
  'Reports', 
  'Audit Trail', 
  'Roles & Rights',
  'Grievance Officer',
  'Business Partner'
];

const allPermissions: Permission[] = ['create', 'read', 'update', 'delete'];
const allRoles: UserRole[] = ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Vendor/Client'];

const RolesAndRights: React.FC<RolesAndRightsProps> = ({ currentUser }) => {
  const [permissions, setPermissions] = useState(JSON.parse(JSON.stringify(initialPermissions)));
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  if (currentUser.role !== 'Admin') {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. This module is for administrators only.</p>
      </Card>
    );
  }

  const togglePermission = (role: UserRole, module: Module, permission: Permission) => {
    if (!isEditing) return;
    
    setPermissions((prev: any) => {
      const updated = JSON.parse(JSON.stringify(prev));
      
      if (!updated[role]) {
        updated[role] = {};
      }
      
      if (!updated[role][module]) {
        updated[role][module] = [];
      }
      
      const perms = updated[role][module];
      const index = perms.indexOf(permission);
      
      if (index > -1) {
        updated[role][module] = perms.filter((p: Permission) => p !== permission);
      } else {
        updated[role][module] = [...perms, permission];
      }
      
      return updated;
    });
    
    setHasChanges(true);
  };

  const toggleAllPermissionsForRole = (role: UserRole, module: Module) => {
    if (!isEditing) return;
    
    setPermissions((prev: any) => {
      const updated = JSON.parse(JSON.stringify(prev));
      
      if (!updated[role]) {
        updated[role] = {};
      }
      
      const currentPerms = updated[role][module] || [];
      
      if (currentPerms.length === allPermissions.length) {
        updated[role][module] = [];
      } else {
        updated[role][module] = [...allPermissions];
      }
      
      return updated;
    });
    
    setHasChanges(true);
  };

  const handleSave = () => {
    // In real implementation, this would save to backend
    console.log('Saving permissions:', permissions);
    alert('Permissions saved successfully!\n\nIn production, these changes would be saved to the backend and applied immediately.');
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setPermissions(JSON.parse(JSON.stringify(initialPermissions)));
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Roles & Rights Management</h1>
          <p className="text-slate-600 mt-1">Define permissions for each user role across all system modules.</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              Edit Permissions
            </Button>
          )}
          {isEditing && (
            <>
              <Button onClick={handleCancel} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges} className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <Card>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Edit Mode:</strong> Click on checkboxes to toggle permissions. Click &quot;All&quot; to toggle all permissions for a module.
            </p>
          </div>
        </Card>
      )}
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-300">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3 text-left text-sm font-semibold text-slate-700 border border-slate-300 sticky left-0 bg-slate-100 z-10">
                  Module
                </th>
                {allRoles.map(role => (
                  <th key={role} scope="col" className="p-3 text-center text-sm font-semibold text-slate-700 border border-slate-300 min-w-[200px]">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {allModules.map(module => (
                <tr key={module} className="odd:bg-white even:bg-slate-50/70">
                  <td className="p-3 font-semibold text-sm text-slate-800 border border-slate-300 sticky left-0 bg-inherit z-10">
                    {module}
                  </td>
                  {allRoles.map(role => {
                    const rolePerms = permissions[role]?.[module] || [];
                    const allChecked = rolePerms.length === allPermissions.length;
                    
                    return (
                      <td key={`${module}-${role}`} className="p-3 text-sm text-slate-500 border border-slate-300">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex justify-center items-center space-x-3">
                            {allPermissions.map(permission => {
                              const hasPerm = rolePerms.includes(permission);
                              return (
                                <div key={permission} className="flex items-center" title={permission}>
                                  <input
                                    id={`${role}-${module}-${permission}`}
                                    type="checkbox"
                                    checked={hasPerm}
                                    onChange={() => togglePermission(role, module, permission)}
                                    className={`h-4 w-4 border-slate-400 rounded-sm focus:ring-blue-500 focus:ring-offset-0 ${
                                      isEditing ? 'text-blue-600 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                                    }`}
                                    disabled={!isEditing}
                                  />
                                  <label 
                                    htmlFor={`${role}-${module}-${permission}`} 
                                    className={`ml-1.5 text-xs uppercase ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                  >
                                    {permission.charAt(0)}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => toggleAllPermissionsForRole(role, module)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {allChecked ? 'Clear All' : 'Select All'}
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-300">
            <p>
              <span className="font-semibold">Legend:</span> C = Create, R = Read, U = Update, D = Delete
              {isEditing && <span className="ml-4 text-blue-600 font-semibold">● Editing mode active - click to toggle permissions</span>}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Permission Guidelines">
        <div className="p-4 space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-slate-800">Role-Based Permissions:</h3>
            <p className="text-slate-600 mt-1">
              Set default permissions for each role. Users assigned to a role will inherit these permissions unless custom permissions are set.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">User-Specific Permissions:</h3>
            <p className="text-slate-600 mt-1">
              In User Management, you can enable &quot;Custom Permissions&quot; for individual users to override their role-based permissions with module-specific access.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800">
              <strong>Note:</strong> Changes to role permissions will affect all users with that role. For user-specific access, use the custom permissions feature in User Management.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RolesAndRights;
