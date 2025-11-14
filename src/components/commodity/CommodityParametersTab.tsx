import React, { useState, useEffect } from 'react';
import { CommodityParameter } from '../../types';
import { commodityParametersApi } from '../../api/settingsApi';
import { Button } from '../ui/Form';
import Modal from '../ui/Modal';
import { useToast } from '../../hooks/useToast';
import { useDialog } from '../dialogs/CustomDialogs';

interface CommodityParametersTabProps {
  commodityId: number;
  commodityUnit: string;
}

const CommodityParametersTab: React.FC<CommodityParametersTabProps> = ({ commodityId, commodityUnit }) => {
  const [parameters, setParameters] = useState<CommodityParameter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<CommodityParameter | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const { showConfirm } = useDialog();

  // Form state
  const [formData, setFormData] = useState({
    parameterName: '',
    unit: '',
    minValue: '',
    maxValue: '',
    fieldType: 'numeric' as 'numeric' | 'text' | 'dropdown',
    dropdownOptions: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadParameters();
  }, [commodityId]);

  const loadParameters = async () => {
    try {
      setIsLoading(true);
      const response = await commodityParametersApi.getAll(commodityId);
      setParameters(response.data);
    } catch (error: any) {
      toast.error('Failed to load parameters', error.message || 'Could not load parameters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (parameter: CommodityParameter | null = null) => {
    if (parameter) {
      setEditingParameter(parameter);
      setFormData({
        parameterName: parameter.parameterName,
        unit: parameter.unit || '',
        minValue: parameter.minValue?.toString() || '',
        maxValue: parameter.maxValue?.toString() || '',
        fieldType: parameter.fieldType,
        dropdownOptions: parameter.dropdownOptions?.join(', ') || '',
        isActive: parameter.isActive,
      });
    } else {
      setEditingParameter(null);
      setFormData({
        parameterName: '',
        unit: '',
        minValue: '',
        maxValue: '',
        fieldType: 'numeric',
        dropdownOptions: '',
        isActive: true,
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingParameter(null);
    setFormData({
      parameterName: '',
      unit: '',
      minValue: '',
      maxValue: '',
      fieldType: 'numeric',
      dropdownOptions: '',
      isActive: true,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.parameterName.trim()) {
      newErrors.parameterName = 'Parameter name is required';
    }

    if (formData.fieldType === 'numeric') {
      if (formData.minValue && isNaN(Number(formData.minValue))) {
        newErrors.minValue = 'Min value must be a number';
      }
      if (formData.maxValue && isNaN(Number(formData.maxValue))) {
        newErrors.maxValue = 'Max value must be a number';
      }
      if (formData.minValue && formData.maxValue && Number(formData.minValue) > Number(formData.maxValue)) {
        newErrors.minValue = 'Min value cannot be greater than max value';
      }
    }

    if (formData.fieldType === 'dropdown' && !formData.dropdownOptions.trim()) {
      newErrors.dropdownOptions = 'Dropdown options are required (comma-separated)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const parameterData = {
        parameterName: formData.parameterName.trim(),
        unit: formData.unit.trim() || undefined,
        minValue: formData.minValue ? Number(formData.minValue) : undefined,
        maxValue: formData.maxValue ? Number(formData.maxValue) : undefined,
        fieldType: formData.fieldType,
        dropdownOptions: formData.fieldType === 'dropdown' 
          ? formData.dropdownOptions.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        isActive: formData.isActive,
      };

      if (editingParameter) {
        const response = await commodityParametersApi.update(editingParameter.id, parameterData);
        setParameters(parameters.map(p => p.id === editingParameter.id ? response.data : p));
        toast.success('Parameter Updated', `Successfully updated ${formData.parameterName}`);
      } else {
        const response = await commodityParametersApi.create(commodityId, parameterData);
        setParameters([...parameters, response.data]);
        toast.success('Parameter Created', `Successfully created ${formData.parameterName}`);
      }

      handleCloseModal();
    } catch (error: any) {
      toast.error('Save Failed', error.message || 'Failed to save parameter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (parameter: CommodityParameter) => {
    const confirmed = await showConfirm(
      'Delete Parameter',
      `Are you sure you want to delete "${parameter.parameterName}"? This action cannot be undone.`,
      { variant: 'destructive', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    try {
      await commodityParametersApi.delete(parameter.id);
      setParameters(parameters.filter(p => p.id !== parameter.id));
      toast.success('Parameter Deleted', `Successfully deleted ${parameter.parameterName}`);
    } catch (error: any) {
      toast.error('Delete Failed', error.message || 'Failed to delete parameter');
    }
  };

  const handleToggleActive = async (parameter: CommodityParameter) => {
    const newStatus = !parameter.isActive;
    try {
      const response = await commodityParametersApi.update(parameter.id, { isActive: newStatus });
      setParameters(parameters.map(p => p.id === parameter.id ? response.data : p));
      toast.success(
        `Parameter ${newStatus ? 'Activated' : 'Deactivated'}`,
        `${parameter.parameterName} is now ${newStatus ? 'active' : 'inactive'}`
      );
    } catch (error: any) {
      toast.error('Status Change Failed', error.message || 'Failed to change parameter status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Commodity Parameters</h3>
          <p className="text-sm text-slate-600">Manage quality and specification parameters for this commodity</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary">
          Add Parameter
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-600">Loading parameters...</div>
      ) : parameters.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-4">No parameters defined yet</p>
          <Button onClick={() => handleOpenModal()} variant="primary" className="text-sm">
            Add First Parameter
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Range/Options
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parameters.map((parameter) => (
                <tr key={parameter.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {parameter.parameterName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {parameter.unit || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      parameter.fieldType === 'numeric' ? 'bg-blue-100 text-blue-800' :
                      parameter.fieldType === 'text' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {parameter.fieldType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {parameter.fieldType === 'numeric' && (parameter.minValue !== undefined || parameter.maxValue !== undefined) ? (
                      <span>
                        {parameter.minValue !== undefined ? parameter.minValue : '-'} 
                        {' to '}
                        {parameter.maxValue !== undefined ? parameter.maxValue : '-'}
                      </span>
                    ) : parameter.fieldType === 'dropdown' && parameter.dropdownOptions ? (
                      <span className="text-xs">{parameter.dropdownOptions.join(', ')}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleToggleActive(parameter)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parameter.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {parameter.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(parameter)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(parameter)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Parameter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingParameter ? 'Edit Parameter' : 'Add Parameter'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.parameterName}
              onChange={(e) => setFormData({ ...formData, parameterName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Staple Length, Micronaire, Strength"
            />
            {errors.parameterName && (
              <p className="text-red-500 text-xs mt-1">{errors.parameterName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.fieldType}
              onChange={(e) => setFormData({ ...formData, fieldType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="numeric">Numeric</option>
              <option value="text">Text</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit (Optional)
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., mm, %, g/tex, kg"
            />
          </div>

          {formData.fieldType === 'numeric' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Value (Optional)
                </label>
                <input
                  type="text"
                  value={formData.minValue}
                  onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0"
                />
                {errors.minValue && (
                  <p className="text-red-500 text-xs mt-1">{errors.minValue}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Value (Optional)
                </label>
                <input
                  type="text"
                  value={formData.maxValue}
                  onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100"
                />
                {errors.maxValue && (
                  <p className="text-red-500 text-xs mt-1">{errors.maxValue}</p>
                )}
              </div>
            </div>
          )}

          {formData.fieldType === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropdown Options <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dropdownOptions}
                onChange={(e) => setFormData({ ...formData, dropdownOptions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Good, Fair, Poor (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Enter options separated by commas</p>
              {errors.dropdownOptions && (
                <p className="text-red-500 text-xs mt-1">{errors.dropdownOptions}</p>
              )}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" onClick={handleCloseModal} variant="secondary" disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingParameter ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommodityParametersTab;
