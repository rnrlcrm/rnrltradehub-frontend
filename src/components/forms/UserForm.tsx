
import React, { useState, useEffect } from 'react';
import { User } from '../../types/multiTenant';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface UserFormProps {
  user?: User | null;
  readOnly: boolean;
  onSave: (data: User) => void;
  onCancel: () => void;
}

// Extended user type with custom permissions
interface UserWithCustomPermissions extends User {
  customPermissions?: UserPermissions;
}

const modules = [
  'Sales Contracts',
  'Invoices', 
  'Payments',
  'Commissions',
  'Disputes',
  'Business Partners',
  'Reports',
  'Audit Trail',
  'User Management',
  'Roles & Rights',
  'Settings',
  'Grievance Officer'
];

const permissions = ['create', 'read', 'update', 'delete'];

interface UserPermissions {
  [module: string]: string[];
}

const getInitialState = (): Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { customPermissions?: UserPermissions } => ({
  name: '',
  email: '',
  userType: 'back_office',
  portal: 'back_office',
  isSubUser: false,
  status: 'active',
  isVerified: false,
  role: 'Sales',
  customPermissions: {},
});

const UserForm: React.FC<UserFormProps> = ({ user, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { customPermissions?: UserPermissions }>(getInitialState());
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);

  useEffect(() => {
    if (user) {
      const userWithPerms = user as UserWithCustomPermissions;
      const userData = { ...user, customPermissions: userWithPerms.customPermissions || {} };
      setFormData(userData);
      setUseCustomPermissions(!!userWithPerms.customPermissions && Object.keys(userWithPerms.customPermissions).length > 0);
    } else {
      setFormData(getInitialState());
      setUseCustomPermissions(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (module: string, permission: string) => {
    if (readOnly) return;
    
    setFormData(prev => {
      const customPerms = { ...prev.customPermissions } || {};
      const modulePerms = customPerms[module] || [];
      
      if (modulePerms.includes(permission)) {
        customPerms[module] = modulePerms.filter(p => p !== permission);
      } else {
        customPerms[module] = [...modulePerms, permission];
      }
      
      return { ...prev, customPermissions: customPerms };
    });
  };

  const handleModuleSelectAll = (module: string) => {
    if (readOnly) return;
    
    setFormData(prev => {
      const customPerms = { ...prev.customPermissions } || {};
      const modulePerms = customPerms[module] || [];
      
      if (modulePerms.length === permissions.length) {
        customPerms[module] = [];
      } else {
        customPerms[module] = [...permissions];
      }
      
      return { ...prev, customPermissions: customPerms };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: Partial<UserWithCustomPermissions> = { ...formData };
    if (!useCustomPermissions) {
      delete userData.customPermissions;
    }
    onSave(userData as User);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <FormRow>
          <FormLabel htmlFor="name">Full Name *</FormLabel>
          <FormInput 
            id="name" 
            name="name" 
            type="text" 
            value={formData.name} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="email">Email Address *</FormLabel>
          <FormInput 
            id="email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          />
        </FormRow>

        <FormRow>
          <FormLabel htmlFor="userType">User Type *</FormLabel>
          <FormInput 
            component="select" 
            id="userType" 
            name="userType" 
            value={formData.userType} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          >
            <option value="back_office">Back Office</option>
            <option value="client">Client</option>
            <option value="vendor">Vendor</option>
          </FormInput>
        </FormRow>

        <FormRow>
          <FormLabel htmlFor="status">Status *</FormLabel>
          <FormInput 
            component="select" 
            id="status" 
            name="status" 
            value={formData.status} 
            onChange={handleChange} 
            isReadOnly={readOnly}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </FormInput>
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="role">Default Role *</FormLabel>
          <FormInput 
            component="select" 
            id="role" 
            name="role" 
            value={formData.role || ''} 
            onChange={handleChange} 
            isReadOnly={readOnly}
          >
            <option value="">None</option>
            <option value="Admin">Admin</option>
            <option value="Sales">Sales</option>
            <option value="Accounts">Accounts</option>
            <option value="Dispute Manager">Dispute Manager</option>
            <option value="Business Partner">Business Partner</option>
          </FormInput>
        </FormRow>

        {!readOnly && (
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomPermissions}
                onChange={(e) => setUseCustomPermissions(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Use Custom Permissions (Override role-based permissions)
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Enable to assign specific module permissions for this user
            </p>
          </div>
        )}

        {useCustomPermissions && (
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Module Permissions</h3>
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-md">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Module</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Create</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Read</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Update</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">Delete</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700">All</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {modules.map(module => {
                    const modulePerms = formData.customPermissions?.[module] || [];
                    const allSelected = modulePerms.length === permissions.length;
                    
                    return (
                      <tr key={module} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-sm text-slate-800">{module}</td>
                        {permissions.map(perm => (
                          <td key={perm} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={modulePerms.includes(perm)}
                              onChange={() => handlePermissionToggle(module, perm)}
                              disabled={readOnly}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleModuleSelectAll(module)}
                            disabled={readOnly}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {allSelected ? 'None' : 'All'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && <Button type="submit">Save User</Button>}
      </FormActions>
    </form>
  );
};

export default UserForm;
