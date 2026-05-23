import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EntityType, FieldType } from '../store/configStore';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface DynamicFormProps {
  entity: EntityType;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ entity, initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {}
  });
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (field: FieldType) => {
    if (field.label && field.label[i18n.language]) {
      return field.label[i18n.language];
    }
    return field.label?.['en'] || field.name;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {entity.fields.map(field => {
          const isRequired = field.required;
          return (
            <div key={field.name} className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-slate-700 capitalize">
                {getLabel(field)} {isRequired && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  {...register(field.name, { required: isRequired })}
                  className={cn("flex min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium text-slate-900")}
                />
              ) : field.type === 'select' ? (
                <select
                  {...register(field.name, { required: isRequired })}
                  className={cn("flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900")}
                >
                  <option value="">Select option</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center h-12">
                  <input
                    type="checkbox"
                    {...register(field.name)}
                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                </div>
              ) : (
                <input
                  type={['text', 'number', 'email', 'password', 'date'].includes(field.type) ? field.type : 'text'}
                  {...register(field.name, { required: isRequired })}
                  className={cn("flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium text-slate-900")}
                  title={!['text', 'number', 'email', 'password', 'date', 'textarea', 'select', 'checkbox'].includes(field.type) ? `Warning: Unknown type '${field.type}'. Falling back to text input.` : undefined}
                />
              )}
              {errors[field.name] && <span className="text-xs font-semibold text-red-500 bg-red-50 py-1 px-2 rounded-md w-fit">This field is required</span>}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 border border-transparent rounded-xl hover:bg-slate-200 focus:outline-none transition-colors">
          {t('cancel')}
        </button>
        <button type="submit" disabled={loading} className="px-8 py-3 flex items-center justify-center min-w-[120px] text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transform transition-all active:scale-95">
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t('save')}
        </button>
      </div>
    </form>
  );
};
