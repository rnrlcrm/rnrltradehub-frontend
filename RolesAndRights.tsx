
import React from 'react';
import Card from '../components/ui/Card';
import { User, Module, Permission, UserRole } from '../types';
import { mockPermissions } from '../lib/permissions';

interface RolesAndRightsProps {
  currentUser: User;
}

const allModules: Module[] = ['Sales Contracts', 'Invoices', 'Payments', 'Disputes', 'Commissions', 'Vendors & Clients', 'User Management', 'Settings', 'Reports', 'Audit Trail', 'Roles & Rights'];
const allPermissions: Permission[] = ['create', 'read', 'update', 'delete'];
const allRoles: UserRole[] = ['Admin', 'Sales', 'Accounts', 'Dispute Manager', 'Vendor/Client'];

const RolesAndRights: React.FC<RolesAndRightsProps> = ({ currentUser }) => {
  if (currentUser.role !== 'Admin') {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. This module is for administrators only.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Roles & Rights Management</h1>
      <p className="text-slate-600 -mt-4">Define permissions for each user role across all system modules. Changes here are reflected instantly across the application.</p>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-300">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3 text-left text-sm font-semibold text-slate-700 border border-slate-300">Module</th>
                {allRoles.map(role => (
                  <th key={role} scope="col" className="p-3 text-center text-sm font-semibold text-slate-700 border border-slate-300">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {allModules.map(module => (
                <tr key={module} className="odd:bg-white even:bg-slate-50/70">
                  <td className="p-3 font-semibold text-sm text-slate-800 border border-slate-300">{module}</td>
                  {allRoles.map(role => (
                    <td key={`${module}-${role}`} className="p-3 text-sm text-slate-500 border border-slate-300">
                      <div className="flex justify-center items-center space-x-4">
                        {allPermissions.map(permission => {
                          const hasPerm = mockPermissions[role]?.[module]?.includes(permission) ?? false;
                          return (
                            <div key={permission} className="flex items-center" title={permission}>
                              <input
                                id={`${role}-${module}-${permission}`}
                                type="checkbox"
                                checked={hasPerm}
                                readOnly
                                className="h-4 w-4 text-blue-600 border-slate-400 rounded-sm focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-70"
                                disabled={!mockPermissions['Admin']?.['Roles & Rights']?.includes('update')}
                              />
                              <label htmlFor={`${role}-${module}-${permission}`} className="ml-1.5 text-xs uppercase text-slate-600">{permission.charAt(0)}</label>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-300">
            <p><span className="font-semibold">Legend:</span> C = Create, R = Read, U = Update, D = Delete. Checkboxes are read-only in this preview.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RolesAndRights;
