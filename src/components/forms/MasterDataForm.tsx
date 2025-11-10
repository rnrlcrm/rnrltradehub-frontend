
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MasterDataItem } from '../../types';
import { FormActions, Button } from '../ui/Form';
import { masterDataSchema, withUniqueNameValidation } from '../../schemas/settingsSchemas';
import { LoadingButton } from '../Loading';

interface MasterDataFormProps {
  item: MasterDataItem | null;
  items: MasterDataItem[];
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const MasterDataForm: React.FC<MasterDataFormProps> = ({ item, items, onSave, onCancel, isSaving = false }) => {
  // Create schema with unique name validation
  const schema = withUniqueNameValidation(masterDataSchema, items, item?.id);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name || '',
    },
  });

  const onSubmit = (data: { name: string }) => {
    onSave(data.name);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-2">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className={`block w-full border rounded-none shadow-sm py-2 px-3 focus:outline-none focus:ring-0 sm:text-sm ${
            errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
          }`}
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={isSaving}>
          Save
        </LoadingButton>
      </FormActions>
    </form>
  );
};

export default MasterDataForm;
